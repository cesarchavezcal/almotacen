import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from './client';
import {
  Account,
  BudgetState,
  Category,
  CategoryGroup,
  Transaction,
  isTargetType,
} from '../../domain/ledger/types';
import {
  CreateAccountInput,
  CreateCategoryGroupInput,
  CreateCategoryInput,
  DiagnosticsData,
  EntityNotFoundError,
  LedgerError,
  LedgerRepository,
  UpdateAccountInput,
  UpdateCategoryGroupInput,
  UpdateCategoryInput,
  ValidationError,
} from '../types';
import { MonthRolloverResult, performMonthRollover } from '../../domain/ledger/rollover';
import {
  postOutflowTransaction,
  postInflowTransaction,
  allocateEnvelope,
  postCreditCardPayment,
} from '../../domain/ledger/ledgerEngine';
import { calculateAutoAssignAllocations } from '../../domain/ledger/autoAssign';
import { coverOverspending } from '../../domain/ledger/overspendingCoverage';
import {
  assertCanDeleteAccount,
  assertCanDeleteCategory,
  assertCanDeleteCategoryGroup,
  canCleanUpLinkedPaymentCategory,
  prepareCreditCardPaymentCategory,
  calculateDepositoryInflowOnCreation,
} from '../../domain/ledger/entityOperations';
import {
  mapAccountRowToDomain,
  mapCategoryGroupRowToDomain,
  mapCategoryRowToDomain,
  mapTransactionRowToDomain,
  mapDomainToAccountRow,
  mapDomainToCategoryGroupRow,
  mapDomainToCategoryRow,
  mapDomainToTransactionRow,
} from './mappers';
import {
  validateRows,
  isAccountRow,
  isCategoryGroupRow,
  isCategoryRow,
  isTransactionRow,
  isMetadataRow,
} from './validators';
import { DEFAULT_SEED_DATA } from '../schema';

export class SupabaseLedgerRepository implements LedgerRepository {
  private client: SupabaseClient;
  private userId: string | null = null;
  private budgetState: BudgetState;
  private groups: CategoryGroup[];
  private schemaVersion = 2;
  private listeners = new Set<() => void>();
  private errorListeners = new Set<(err: LedgerError) => void>();
  private lastSyncError: LedgerError | null = null;

  constructor(client?: SupabaseClient) {
    this.client = client ?? getSupabaseClient();
    this.budgetState = {
      readyToAssignCents: 0,
      accounts: {},
      categories: {},
      transactions: [],
      totalOutflowCents: 0,
      totalInflowCents: 0,
    };
    this.groups = [];
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  subscribeError(listener: (err: LedgerError) => void): () => void {
    this.errorListeners.add(listener);
    return () => {
      this.errorListeners.delete(listener);
    };
  }

  getLastSyncError(): LedgerError | null {
    return this.lastSyncError;
  }

  clearLastSyncError(): void {
    this.lastSyncError = null;
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  async initializeAsync(): Promise<void> {
    const { data: userData } = await this.client.auth.getUser();
    this.userId = userData?.user?.id ?? null;

    if (!this.userId) {
      const { data: sessionData } = await this.client.auth.getSession();
      this.userId = sessionData?.session?.user?.id ?? null;
    }

    const [accRes, grpRes, catRes, txRes, metaRes] = await Promise.all([
      this.client.from('accounts').select('*'),
      this.client.from('category_groups').select('*'),
      this.client.from('categories').select('*'),
      this.client.from('transactions').select('*'),
      this.client.from('metadata').select('*'),
    ]);

    if (accRes.error) {
      throw new LedgerError(`Failed to load accounts from Supabase: ${accRes.error.message}`);
    }
    if (grpRes.error) {
      throw new LedgerError(`Failed to load category groups from Supabase: ${grpRes.error.message}`);
    }
    if (catRes.error) {
      throw new LedgerError(`Failed to load categories from Supabase: ${catRes.error.message}`);
    }
    if (txRes.error) {
      throw new LedgerError(`Failed to load transactions from Supabase: ${txRes.error.message}`);
    }
    if (metaRes.error) {
      throw new LedgerError(`Failed to load metadata from Supabase: ${metaRes.error.message}`);
    }

    const accountsData = validateRows(accRes.data, isAccountRow);
    const groupsData = validateRows(grpRes.data, isCategoryGroupRow);
    const categoriesData = validateRows(catRes.data, isCategoryRow);
    const txData = validateRows(txRes.data, isTransactionRow);
    const metaData = validateRows(metaRes.data, isMetadataRow);

    this.groups = groupsData.map(mapCategoryGroupRowToDomain);
    const domainCategories = categoriesData.map(mapCategoryRowToDomain);
    const domainTransactions = txData.map(mapTransactionRowToDomain);

    const accountsRecord: Record<string, Account> = {};
    for (const accRow of accountsData) {
      const creditCategory = categoriesData.find(
        (c) => c.credit_account_id === accRow.id || c.id === `cat-cc-${accRow.id}`
      );
      accountsRecord[accRow.id] = mapAccountRowToDomain(accRow, creditCategory?.id);
    }

    const categoriesRecord: Record<string, Category> = {};
    for (const cat of domainCategories) {
      categoriesRecord[cat.id] = cat;
    }

    let readyToAssignCents = 0;
    const rtaMeta = metaData.find((m) => m.key === 'ready_to_assign_cents');
    if (rtaMeta) {
      readyToAssignCents = Number(rtaMeta.value);
    } else {
      readyToAssignCents = Object.values(accountsRecord)
        .filter((a) => a.accountType !== 'credit' && a.balanceCents > 0)
        .reduce((sum, a) => sum + a.balanceCents, 0);
    }

    let totalOutflowCents = 0;
    let totalInflowCents = 0;
    for (const tx of domainTransactions) {
      if (tx.direction === 'outflow') {
        totalOutflowCents += tx.amountCents;
      } else {
        totalInflowCents += tx.amountCents;
      }
    }

    this.budgetState = {
      readyToAssignCents,
      accounts: accountsRecord,
      categories: categoriesRecord,
      transactions: domainTransactions,
      totalOutflowCents,
      totalInflowCents,
    };

    this.notify();
  }

  private cloneState(): { budgetState: BudgetState; groups: CategoryGroup[] } {
    return {
      budgetState: {
        readyToAssignCents: this.budgetState.readyToAssignCents,
        accounts: { ...this.budgetState.accounts },
        categories: { ...this.budgetState.categories },
        transactions: [...this.budgetState.transactions],
        totalOutflowCents: this.budgetState.totalOutflowCents,
        totalInflowCents: this.budgetState.totalInflowCents,
      },
      groups: this.groups.map((g) => ({ ...g })),
    };
  }

  private executeOptimisticMutation<T>(
    mutateLocal: (
      state: BudgetState,
      groups: CategoryGroup[]
    ) => { newState: BudgetState; newGroups?: CategoryGroup[]; result: T },
    persistRemote: (
      userId: string,
      targetState: BudgetState,
      targetGroups: CategoryGroup[]
    ) => PromiseLike<unknown>
  ): T {
    const snapshot = this.cloneState();
    try {
      const { newState, newGroups, result } = mutateLocal(this.budgetState, this.groups);
      this.budgetState = newState;
      if (newGroups) {
        this.groups = newGroups;
      }
      this.notify();

      if (this.userId) {
        Promise.resolve(persistRemote(this.userId, newState, newGroups ?? this.groups)).catch((err) => {
          const syncError = err instanceof Error ? err : new Error(String(err));
          const enrichedError = new LedgerError(
            `Remote sync rejected, rolling back local cache: ${syncError.message}`
          );
          this.lastSyncError = enrichedError;
          this.budgetState = snapshot.budgetState;
          this.groups = snapshot.groups;
          this.notify();
          for (const errorListener of this.errorListeners) {
            errorListener(enrichedError);
          }
          console.error(enrichedError.message);
        });
      }

      return result;
    } catch (err) {
      this.budgetState = snapshot.budgetState;
      this.groups = snapshot.groups;
      this.notify();
      throw err;
    }
  }

  getBudgetState(): BudgetState {
    return this.budgetState;
  }

  getCategoryGroups(): CategoryGroup[] {
    return this.groups;
  }

  postOutflow(params: {
    id: string;
    accountId: string;
    categoryId: string;
    amountCents: number;
    payee: string;
    occurredAt?: string;
  }): { transaction: Transaction; isOverspent: boolean } {
    if (params.amountCents <= 0) {
      throw new ValidationError('Amount must be positive');
    }

    return this.executeOptimisticMutation(
      (state) => {
        const result = postOutflowTransaction({
          state,
          id: params.id,
          accountId: params.accountId,
          categoryId: params.categoryId,
          amountCents: params.amountCents,
          payee: params.payee,
          occurredAt: params.occurredAt,
        });

        return {
          newState: result.state,
          result: {
            transaction: result.transaction,
            isOverspent: result.isOverspent,
          },
        };
      },
      async (userId, targetState) => {
        const txRow = mapDomainToTransactionRow(
          {
            id: params.id,
            accountId: params.accountId,
            categoryId: params.categoryId,
            amountCents: params.amountCents,
            payee: params.payee,
            direction: 'outflow',
            occurredAt: params.occurredAt ?? new Date().toISOString(),
            syncStatus: 'synced',
          },
          userId,
          'outflow'
        );

        const targetAccount = targetState.accounts[params.accountId];
        const targetCategory = targetState.categories[params.categoryId];

        const promises: PromiseLike<unknown>[] = [
          this.client.from('transactions').insert(txRow).throwOnError(),
        ];

        if (targetAccount) {
          promises.push(
            this.client
              .from('accounts')
              .update({ balance_cents: targetAccount.balanceCents })
              .eq('id', params.accountId)
              .eq('user_id', userId)
              .throwOnError()
          );
        }

        if (targetCategory) {
          promises.push(
            this.client
              .from('categories')
              .update({
                available_cents: targetCategory.availableCents,
                unfunded_debt_cents: targetCategory.unfundedDebtCents ?? 0,
              })
              .eq('id', params.categoryId)
              .eq('user_id', userId)
              .throwOnError()
          );
        }

        if (targetAccount?.accountType === 'credit' && targetAccount.creditPaymentCategoryId) {
          const paymentCat = targetState.categories[targetAccount.creditPaymentCategoryId];
          if (paymentCat) {
            promises.push(
              this.client
                .from('categories')
                .update({
                  available_cents: paymentCat.availableCents,
                })
                .eq('id', paymentCat.id)
                .eq('user_id', userId)
                .throwOnError()
            );
          }
        }

        await Promise.all(promises);
      }
    );
  }

  postInflow(params: {
    id: string;
    accountId: string;
    amountCents: number;
    payee: string;
    occurredAt?: string;
  }): { transaction: Transaction } {
    if (params.amountCents <= 0) {
      throw new ValidationError('Amount must be positive');
    }

    return this.executeOptimisticMutation(
      (state) => {
        const result = postInflowTransaction({
          state,
          id: params.id,
          accountId: params.accountId,
          amountCents: params.amountCents,
          payee: params.payee,
          occurredAt: params.occurredAt,
        });

        return {
          newState: result.state,
          result: {
            transaction: result.transaction,
          },
        };
      },
      async (userId, targetState) => {
        const txRow = mapDomainToTransactionRow(
          {
            id: params.id,
            accountId: params.accountId,
            amountCents: params.amountCents,
            payee: params.payee,
            direction: 'inflow',
            occurredAt: params.occurredAt ?? new Date().toISOString(),
            syncStatus: 'synced',
          },
          userId,
          'inflow'
        );

        const targetAccount = targetState.accounts[params.accountId];

        const promises: PromiseLike<unknown>[] = [
          this.client.from('transactions').insert(txRow).throwOnError(),
        ];

        if (targetAccount) {
          promises.push(
            this.client
              .from('accounts')
              .update({ balance_cents: targetAccount.balanceCents })
              .eq('id', params.accountId)
              .eq('user_id', userId)
              .throwOnError()
          );
        }

        promises.push(
          this.client
            .from('metadata')
            .upsert({
              user_id: userId,
              key: 'ready_to_assign_cents',
              value: String(targetState.readyToAssignCents),
            })
            .throwOnError()
        );

        await Promise.all(promises);
      }
    );
  }

  allocateEnvelope(params: {
    categoryId: string;
    amountCents: number;
  }): { isOverAssigned: boolean } {
    return this.executeOptimisticMutation(
      (state) => {
        const result = allocateEnvelope({
          state,
          categoryId: params.categoryId,
          amountCents: params.amountCents,
        });

        return {
          newState: result.state,
          result: {
            isOverAssigned: result.isOverAssigned,
          },
        };
      },
      async (userId, targetState) => {
        const targetCategory = targetState.categories[params.categoryId];

        const promises: PromiseLike<unknown>[] = [
          this.client
            .from('metadata')
            .upsert({
              user_id: userId,
              key: 'ready_to_assign_cents',
              value: String(targetState.readyToAssignCents),
            })
            .throwOnError(),
        ];

        if (targetCategory) {
          promises.push(
            this.client
              .from('categories')
              .update({
                assigned_cents: targetCategory.assignedCents,
                available_cents: targetCategory.availableCents,
              })
              .eq('id', params.categoryId)
              .eq('user_id', userId)
              .throwOnError()
          );
        }

        await Promise.all(promises);
      }
    );
  }

  postCreditCardPayment(params: {
    id: string;
    fromAccountId: string;
    toAccountId: string;
    amountCents: number;
    payee?: string;
    occurredAt?: string;
  }): { transaction: Transaction } {
    if (params.amountCents <= 0) {
      throw new ValidationError('Amount must be positive');
    }

    return this.executeOptimisticMutation(
      (state) => {
        const result = postCreditCardPayment({
          state,
          id: params.id,
          fromAccountId: params.fromAccountId,
          toAccountId: params.toAccountId,
          amountCents: params.amountCents,
          payee: params.payee,
          occurredAt: params.occurredAt,
        });

        return {
          newState: result.state,
          result: {
            transaction: result.transaction,
          },
        };
      },
      async (userId, targetState) => {
        const txRow = mapDomainToTransactionRow(
          {
            id: params.id,
            accountId: params.fromAccountId,
            amountCents: params.amountCents,
            payee: params.payee ?? 'Credit Card Payment',
            direction: 'outflow',
            occurredAt: params.occurredAt ?? new Date().toISOString(),
            syncStatus: 'synced',
          },
          userId,
          'credit_payment'
        );
        txRow.transfer_account_id = params.toAccountId;

        const fromAccount = targetState.accounts[params.fromAccountId];
        const toAccount = targetState.accounts[params.toAccountId];

        const promises: PromiseLike<unknown>[] = [
          this.client.from('transactions').insert(txRow).throwOnError(),
        ];

        if (fromAccount) {
          promises.push(
            this.client
              .from('accounts')
              .update({ balance_cents: fromAccount.balanceCents })
              .eq('id', params.fromAccountId)
              .eq('user_id', userId)
              .throwOnError()
          );
        }

        if (toAccount) {
          promises.push(
            this.client
              .from('accounts')
              .update({ balance_cents: toAccount.balanceCents })
              .eq('id', params.toAccountId)
              .eq('user_id', userId)
              .throwOnError()
          );

          if (toAccount.creditPaymentCategoryId) {
            const paymentCat = targetState.categories[toAccount.creditPaymentCategoryId];
            if (paymentCat) {
              promises.push(
                this.client
                  .from('categories')
                  .update({ available_cents: paymentCat.availableCents })
                  .eq('id', paymentCat.id)
                  .eq('user_id', userId)
                  .throwOnError()
              );
            }
          }
        }

        await Promise.all(promises);
      }
    );
  }

  performMonthRollover(targetMonth?: string): MonthRolloverResult {
    return this.executeOptimisticMutation(
      (state) => {
        const result = performMonthRollover({ state, targetMonth });
        return {
          newState: result.state,
          result,
        };
      },
      async (userId, targetState) => {
        const promises: PromiseLike<unknown>[] = [
          this.client
            .from('metadata')
            .upsert({
              user_id: userId,
              key: 'ready_to_assign_cents',
              value: String(targetState.readyToAssignCents),
            })
            .throwOnError(),
        ];

        if (targetMonth) {
          promises.push(
            this.client
              .from('metadata')
              .upsert({
                user_id: userId,
                key: 'current_cycle_month',
                value: targetMonth,
              })
              .throwOnError()
          );
        }

        for (const category of Object.values(targetState.categories)) {
          promises.push(
            this.client
              .from('categories')
              .update({
                assigned_cents: category.assignedCents,
                available_cents: category.availableCents,
                unfunded_debt_cents: category.unfundedDebtCents ?? 0,
              })
              .eq('id', category.id)
              .eq('user_id', userId)
              .throwOnError()
          );
        }

        await Promise.all(promises);
      }
    );
  }

  applyAutoAssign(): { totalAllocatedCents: number; assignedCount: number } {
    return this.executeOptimisticMutation(
      (state, groups) => {
        const autoAssignResult = calculateAutoAssignAllocations({
          readyToAssignCents: state.readyToAssignCents,
          categories: Object.values(state.categories),
          groups,
        });

        if (autoAssignResult.totalAllocatedCents === 0) {
          return {
            newState: state,
            result: { totalAllocatedCents: 0, assignedCount: 0 },
          };
        }

        const newCategories = { ...state.categories };
        let assignedCount = 0;

        for (const [categoryId, allocatedCents] of Object.entries(autoAssignResult.allocations)) {
          if (allocatedCents > 0 && newCategories[categoryId]) {
            const cat = newCategories[categoryId];
            newCategories[categoryId] = {
              ...cat,
              assignedCents: cat.assignedCents + allocatedCents,
              availableCents: cat.availableCents + allocatedCents,
            };
            assignedCount++;
          }
        }

        const newState: BudgetState = {
          ...state,
          readyToAssignCents: autoAssignResult.remainingReadyToAssignCents,
          categories: newCategories,
        };

        return {
          newState,
          result: {
            totalAllocatedCents: autoAssignResult.totalAllocatedCents,
            assignedCount,
          },
        };
      },
      async (userId, targetState) => {
        const promises: PromiseLike<unknown>[] = [
          this.client
            .from('metadata')
            .upsert({
              user_id: userId,
              key: 'ready_to_assign_cents',
              value: String(targetState.readyToAssignCents),
            })
            .throwOnError(),
        ];

        for (const category of Object.values(targetState.categories)) {
          promises.push(
            this.client
              .from('categories')
              .update({
                assigned_cents: category.assignedCents,
                available_cents: category.availableCents,
              })
              .eq('id', category.id)
              .eq('user_id', userId)
              .throwOnError()
          );
        }

        await Promise.all(promises);
      }
    );
  }

  rebalanceCategoryFunds(params: {
    targetCategoryId: string;
    sourceCategoryId: string;
    amountCents: number;
  }): { coveredCents: number; isCreditDebtCovered: boolean } {
    return this.executeOptimisticMutation(
      (state) => {
        const result = coverOverspending({
          state,
          targetCategoryId: params.targetCategoryId,
          sourceCategoryId: params.sourceCategoryId,
          amountCents: params.amountCents,
        });

        return {
          newState: result.state,
          result: {
            coveredCents: result.coveredCents,
            isCreditDebtCovered: result.isCreditDebtCovered,
          },
        };
      },
      async (userId, targetState) => {
        const sourceCat = targetState.categories[params.sourceCategoryId];
        const targetCat = targetState.categories[params.targetCategoryId];

        const promises: PromiseLike<unknown>[] = [];

        if (sourceCat) {
          promises.push(
            this.client
              .from('categories')
              .update({
                assigned_cents: sourceCat.assignedCents,
                available_cents: sourceCat.availableCents,
              })
              .eq('id', params.sourceCategoryId)
              .eq('user_id', userId)
              .throwOnError()
          );
        }

        if (targetCat) {
          promises.push(
            this.client
              .from('categories')
              .update({
                assigned_cents: targetCat.assignedCents,
                available_cents: targetCat.availableCents,
                unfunded_debt_cents: targetCat.unfundedDebtCents ?? 0,
              })
              .eq('id', params.targetCategoryId)
              .eq('user_id', userId)
              .throwOnError()
          );
        }

        // Check if any credit payment category changed
        for (const cat of Object.values(targetState.categories)) {
          if (cat.isCreditPayment) {
            promises.push(
              this.client
                .from('categories')
                .update({
                  assigned_cents: cat.assignedCents,
                  available_cents: cat.availableCents,
                })
                .eq('id', cat.id)
                .eq('user_id', userId)
                .throwOnError()
            );
          }
        }

        await Promise.all(promises);
      }
    );
  }

  createAccount(input: CreateAccountInput): Account {
    const id = input.id || `acc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    let creditPaymentCategoryId: string | undefined = undefined;

    return this.executeOptimisticMutation(
      (state, groups) => {
        let newGroups = [...groups];
        const newCategories = { ...state.categories };

        if (input.accountType === 'credit') {
          const prep = prepareCreditCardPaymentCategory(input.name, id, input.balanceCents);
          creditPaymentCategoryId = prep.categoryId;

          if (!groups.some((g) => g.id === prep.paymentGroupId)) {
            newGroups = [
              { id: prep.paymentGroupId, name: prep.paymentGroupName, sortOrder: 0 },
              ...newGroups,
            ];
          }

          newCategories[prep.categoryId] = {
            id: prep.categoryId,
            groupId: prep.paymentGroupId,
            name: prep.categoryName,
            targetCents: 0,
            targetType: 'NEEDED_FOR_SPENDING',
            assignedCents: 0,
            availableCents: 0,
            isCreditPayment: true,
            unfundedDebtCents: prep.startingDebtCents,
          };
        }

        const newAccount: Account = {
          id,
          name: input.name,
          accountType: input.accountType,
          balanceCents: input.balanceCents,
          creditPaymentCategoryId,
        };

        const newAccounts = {
          ...state.accounts,
          [id]: newAccount,
        };

        const rtaDelta = calculateDepositoryInflowOnCreation(input.accountType, input.balanceCents);
        const newState: BudgetState = {
          ...state,
          accounts: newAccounts,
          categories: newCategories,
          readyToAssignCents: state.readyToAssignCents + rtaDelta,
        };

        return {
          newState,
          newGroups,
          result: newAccount,
        };
      },
      async (userId, targetState) => {
        const promises: PromiseLike<unknown>[] = [];

        if (input.accountType === 'credit') {
          const prep = prepareCreditCardPaymentCategory(input.name, id, input.balanceCents);
          promises.push(
            this.client.from('category_groups').upsert({
              id: prep.paymentGroupId,
              user_id: userId,
              name: prep.paymentGroupName,
              sort_order: 0,
            }).throwOnError()
          );
          promises.push(
            this.client.from('categories').insert({
              id: prep.categoryId,
              user_id: userId,
              group_id: prep.paymentGroupId,
              name: prep.categoryName,
              assigned_cents: 0,
              activity_cents: 0,
              available_cents: 0,
              target_cents: 0,
              target_type: 'NEEDED_FOR_SPENDING',
              unfunded_debt_cents: prep.startingDebtCents,
              is_credit_payment: 1,
              credit_account_id: id,
              sort_order: 0,
            }).throwOnError()
          );
        }

        promises.push(
          this.client.from('accounts').insert({
            id,
            user_id: userId,
            name: input.name,
            account_type: input.accountType,
            balance_cents: input.balanceCents,
          }).throwOnError()
        );

        const rtaDelta = calculateDepositoryInflowOnCreation(input.accountType, input.balanceCents);
        if (rtaDelta > 0) {
          promises.push(
            this.client.from('metadata').upsert({
              user_id: userId,
              key: 'ready_to_assign_cents',
              value: String(targetState.readyToAssignCents),
            }).throwOnError()
          );
        }

        await Promise.all(promises);
      }
    );
  }

  updateAccount(input: UpdateAccountInput): Account {
    const existing = this.budgetState.accounts[input.id];
    if (!existing) {
      throw new EntityNotFoundError('Account', input.id);
    }

    const updatedBalance = input.balanceCents !== undefined ? input.balanceCents : existing.balanceCents;
    const delta = existing.accountType !== 'credit' && input.balanceCents !== undefined
      ? updatedBalance - existing.balanceCents
      : 0;

    return this.executeOptimisticMutation(
      (state) => {
        const updatedAccount: Account = {
          ...existing,
          name: input.name,
          balanceCents: updatedBalance,
        };

        const newState: BudgetState = {
          ...state,
          readyToAssignCents: state.readyToAssignCents + delta,
          accounts: {
            ...state.accounts,
            [input.id]: updatedAccount,
          },
        };

        return {
          newState,
          result: updatedAccount,
        };
      },
      async (userId, targetState) => {
        const promises: PromiseLike<unknown>[] = [
          this.client
            .from('accounts')
            .update({
              name: input.name,
              balance_cents: updatedBalance,
            })
            .eq('id', input.id)
            .eq('user_id', userId)
            .throwOnError(),
        ];

        if (delta !== 0) {
          promises.push(
            this.client.from('metadata').upsert({
              user_id: userId,
              key: 'ready_to_assign_cents',
              value: String(targetState.readyToAssignCents),
            }).throwOnError()
          );
        }

        await Promise.all(promises);
      }
    );
  }

  deleteAccount(id: string): void {
    const existing = this.budgetState.accounts[id];
    if (!existing) {
      throw new EntityNotFoundError('Account', id);
    }

    const txCount = this.budgetState.transactions.filter((t) => t.accountId === id).length;
    assertCanDeleteAccount(txCount);

    let paymentCategoryToDelete: string | null = null;
    if (existing.creditPaymentCategoryId) {
      const paymentCat = this.budgetState.categories[existing.creditPaymentCategoryId];
      if (paymentCat) {
        const catTxCount = this.budgetState.transactions.filter(
          (t) => t.categoryId === paymentCat.id
        ).length;
        if (canCleanUpLinkedPaymentCategory(paymentCat.availableCents, catTxCount)) {
          paymentCategoryToDelete = paymentCat.id;
        }
      }
    }

    this.executeOptimisticMutation(
      (state) => {
        const newAccounts = { ...state.accounts };
        delete newAccounts[id];

        const newCategories = { ...state.categories };
        if (paymentCategoryToDelete) {
          delete newCategories[paymentCategoryToDelete];
        }

        const newState: BudgetState = {
          ...state,
          accounts: newAccounts,
          categories: newCategories,
        };

        return {
          newState,
          result: undefined,
        };
      },
      async (userId) => {
        const promises: PromiseLike<unknown>[] = [];

        if (paymentCategoryToDelete) {
          promises.push(
            this.client
              .from('categories')
              .delete()
              .eq('id', paymentCategoryToDelete)
              .eq('user_id', userId)
              .throwOnError()
          );
        }

        promises.push(
          this.client
            .from('accounts')
            .delete()
            .eq('id', id)
            .eq('user_id', userId)
            .throwOnError()
        );

        await Promise.all(promises);
      }
    );
  }

  createCategoryGroup(input: CreateCategoryGroupInput): CategoryGroup {
    const id = input.id || `grp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    return this.executeOptimisticMutation(
      (state, groups) => {
        const maxSort = groups.reduce((max, g) => Math.max(max, g.sortOrder), -1);
        const sortOrder = maxSort + 1;

        const newGroup: CategoryGroup = {
          id,
          name: input.name,
          sortOrder,
        };

        return {
          newState: state,
          newGroups: [...groups, newGroup],
          result: newGroup,
        };
      },
      async (userId, _targetState, targetGroups) => {
        const group = targetGroups.find((g) => g.id === id);
        if (group) {
          await this.client.from('category_groups').insert({
            id: group.id,
            user_id: userId,
            name: group.name,
            sort_order: group.sortOrder,
          }).throwOnError();
        }
      }
    );
  }

  updateCategoryGroup(input: UpdateCategoryGroupInput): CategoryGroup {
    const existing = this.groups.find((g) => g.id === input.id);
    if (!existing) {
      throw new EntityNotFoundError('CategoryGroup', input.id);
    }

    return this.executeOptimisticMutation(
      (state, groups) => {
        const updatedGroup: CategoryGroup = {
          ...existing,
          name: input.name,
        };

        const newGroups = groups.map((g) => (g.id === input.id ? updatedGroup : g));

        return {
          newState: state,
          newGroups,
          result: updatedGroup,
        };
      },
      async (userId) => {
        await this.client
          .from('category_groups')
          .update({ name: input.name })
          .eq('id', input.id)
          .eq('user_id', userId)
          .throwOnError();
      }
    );
  }

  deleteCategoryGroup(id: string): void {
    const existing = this.groups.find((g) => g.id === id);
    if (!existing) {
      throw new EntityNotFoundError('CategoryGroup', id);
    }

    const childCount = Object.values(this.budgetState.categories).filter((c) => c.groupId === id).length;
    assertCanDeleteCategoryGroup(childCount);

    this.executeOptimisticMutation(
      (state, groups) => {
        const newGroups = groups.filter((g) => g.id !== id);
        return {
          newState: state,
          newGroups,
          result: undefined,
        };
      },
      async (userId) => {
        await this.client
          .from('category_groups')
          .delete()
          .eq('id', id)
          .eq('user_id', userId)
          .throwOnError();
      }
    );
  }

  createCategory(input: CreateCategoryInput): Category {
    const parentGroup = this.groups.find((g) => g.id === input.groupId);
    if (!parentGroup) {
      throw new EntityNotFoundError('CategoryGroup', input.groupId);
    }

    const id = input.id || `cat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    return this.executeOptimisticMutation(
      (state) => {
        const newCategory: Category = {
          id,
          groupId: input.groupId,
          name: input.name,
          targetCents: input.targetCents || 0,
          targetType: input.targetType || 'NEEDED_FOR_SPENDING',
          targetDueDay: input.targetDueDay,
          assignedCents: 0,
          availableCents: 0,
          isCreditPayment: false,
          unfundedDebtCents: 0,
        };

        const newState: BudgetState = {
          ...state,
          categories: {
            ...state.categories,
            [id]: newCategory,
          },
        };

        return {
          newState,
          result: newCategory,
        };
      },
      async (userId, targetState) => {
        const cat = targetState.categories[id];
        if (cat) {
          await this.client.from('categories').insert(
            mapDomainToCategoryRow(cat, userId, 0)
          ).throwOnError();
        }
      }
    );
  }

  updateCategory(input: UpdateCategoryInput): Category {
    const existing = this.budgetState.categories[input.id];
    if (!existing) {
      throw new EntityNotFoundError('Category', input.id);
    }

    const newGroupId = input.groupId || existing.groupId;
    if (input.groupId && input.groupId !== existing.groupId) {
      const parentGroup = this.groups.find((g) => g.id === input.groupId);
      if (!parentGroup) {
        throw new EntityNotFoundError('CategoryGroup', input.groupId);
      }
    }

    const newName = input.name !== undefined ? input.name : existing.name;
    const newTargetCents = input.targetCents !== undefined ? input.targetCents : existing.targetCents;
    const newTargetType = input.targetType !== undefined ? input.targetType : existing.targetType;
    const newTargetDueDay = input.targetDueDay !== undefined ? input.targetDueDay : existing.targetDueDay;

    return this.executeOptimisticMutation(
      (state) => {
        const updatedCat: Category = {
          ...existing,
          groupId: newGroupId,
          name: newName,
          targetCents: newTargetCents,
          targetType: isTargetType(newTargetType) ? newTargetType : 'NEEDED_FOR_SPENDING',
          targetDueDay: newTargetDueDay,
        };

        const newState: BudgetState = {
          ...state,
          categories: {
            ...state.categories,
            [input.id]: updatedCat,
          },
        };

        return {
          newState,
          result: updatedCat,
        };
      },
      async (userId) => {
        await this.client
          .from('categories')
          .update({
            group_id: newGroupId,
            name: newName,
            target_cents: newTargetCents,
            target_type: newTargetType,
            target_due_day: newTargetDueDay,
          })
          .eq('id', input.id)
          .eq('user_id', userId)
          .throwOnError();
      }
    );
  }

  deleteCategory(id: string): void {
    const existing = this.budgetState.categories[id];
    if (!existing) {
      throw new EntityNotFoundError('Category', id);
    }

    const txCount = this.budgetState.transactions.filter((t) => t.categoryId === id).length;
    assertCanDeleteCategory({
      isCreditPayment: Boolean(existing.isCreditPayment),
      availableCents: existing.availableCents,
      transactionCount: txCount,
    });

    this.executeOptimisticMutation(
      (state) => {
        const newCategories = { ...state.categories };
        delete newCategories[id];

        const newState: BudgetState = {
          ...state,
          categories: newCategories,
        };

        return {
          newState,
          result: undefined,
        };
      },
      async (userId) => {
        await this.client
          .from('categories')
          .delete()
          .eq('id', id)
          .eq('user_id', userId)
          .throwOnError();
      }
    );
  }

  getDiagnostics(): DiagnosticsData {
    return {
      schemaVersion: this.schemaVersion,
      accountCount: Object.keys(this.budgetState.accounts).length,
      categoryGroupCount: this.groups.length,
      categoryCount: Object.keys(this.budgetState.categories).length,
      transactionCount: this.budgetState.transactions.length,
    };
  }

  factoryReset(): void {
    this.executeOptimisticMutation(
      () => {
        return {
          newState: {
            readyToAssignCents: 0,
            accounts: {},
            categories: {},
            transactions: [],
            totalOutflowCents: 0,
            totalInflowCents: 0,
          },
          newGroups: [],
          result: undefined,
        };
      },
      async (userId) => {
        await Promise.all([
          this.client.from('transactions').delete().eq('user_id', userId).throwOnError(),
          this.client.from('categories').delete().eq('user_id', userId).throwOnError(),
          this.client.from('category_groups').delete().eq('user_id', userId).throwOnError(),
          this.client.from('accounts').delete().eq('user_id', userId).throwOnError(),
          this.client.from('metadata').upsert([
            { user_id: userId, key: 'schema_version', value: '2' },
            { user_id: userId, key: 'ready_to_assign_cents', value: '0' },
            { user_id: userId, key: 'onboarding_completed', value: 'false' },
          ]).throwOnError(),
        ]);
      }
    );
  }

  clearTransactionsOnly(): void {
    this.executeOptimisticMutation(
      (state) => {
        const resetCategories: Record<string, Category> = {};
        for (const [id, cat] of Object.entries(state.categories)) {
          resetCategories[id] = {
            ...cat,
            assignedCents: 0,
            availableCents: 0,
            unfundedDebtCents: 0,
          };
        }

        const newReadyToAssign = Object.values(state.accounts)
          .filter((a) => a.accountType !== 'credit' && a.balanceCents > 0)
          .reduce((sum, a) => sum + a.balanceCents, 0);

        const newState: BudgetState = {
          ...state,
          transactions: [],
          totalOutflowCents: 0,
          totalInflowCents: 0,
          readyToAssignCents: newReadyToAssign,
          categories: resetCategories,
        };

        return {
          newState,
          result: undefined,
        };
      },
      async (userId, targetState) => {
        await Promise.all([
          this.client.from('transactions').delete().eq('user_id', userId).throwOnError(),
          ...Object.values(targetState.categories).map((c) =>
            this.client
              .from('categories')
              .update({
                assigned_cents: 0,
                available_cents: 0,
                unfunded_debt_cents: 0,
              })
              .eq('id', c.id)
              .eq('user_id', userId)
              .throwOnError()
          ),
          this.client.from('metadata').upsert([
            {
              user_id: userId,
              key: 'ready_to_assign_cents',
              value: String(targetState.readyToAssignCents),
            },
            { user_id: userId, key: 'onboarding_completed', value: 'true' },
          ]).throwOnError(),
        ]);
      }
    );
  }

  seedDemoData(): void {
    const seed = DEFAULT_SEED_DATA;

    this.executeOptimisticMutation(
      () => {
        const accountsRecord: Record<string, Account> = {};
        for (const a of seed.accounts) {
          accountsRecord[a.id] = { ...a };
        }

        const categoriesRecord: Record<string, Category> = {};
        for (const c of seed.categories) {
          categoriesRecord[c.id] = { ...c };
        }

        const newState: BudgetState = {
          readyToAssignCents: seed.readyToAssignCents,
          accounts: accountsRecord,
          categories: categoriesRecord,
          transactions: [],
          totalOutflowCents: 0,
          totalInflowCents: 0,
        };

        return {
          newState,
          newGroups: seed.groups.map((g) => ({ ...g })),
          result: undefined,
        };
      },
      async (userId) => {
        await Promise.all([
          this.client.from('transactions').delete().eq('user_id', userId).throwOnError(),
          this.client.from('categories').delete().eq('user_id', userId).throwOnError(),
          this.client.from('category_groups').delete().eq('user_id', userId).throwOnError(),
          this.client.from('accounts').delete().eq('user_id', userId).throwOnError(),
        ]);

        if (seed.groups.length > 0) {
          await this.client
            .from('category_groups')
            .insert(seed.groups.map((g) => mapDomainToCategoryGroupRow(g, userId)))
            .throwOnError();
        }

        if (seed.categories.length > 0) {
          await this.client
            .from('categories')
            .insert(
              seed.categories.map((c, idx) => {
                const linkedAccount = seed.accounts.find(
                  (a) => a.creditPaymentCategoryId === c.id
                );
                return mapDomainToCategoryRow(c, userId, idx, linkedAccount?.id);
              })
            )
            .throwOnError();
        }

        if (seed.accounts.length > 0) {
          await this.client
            .from('accounts')
            .insert(seed.accounts.map((a) => mapDomainToAccountRow(a, userId)))
            .throwOnError();
        }

        await this.client.from('metadata').upsert([
          {
            user_id: userId,
            key: 'ready_to_assign_cents',
            value: String(seed.readyToAssignCents),
          },
          { user_id: userId, key: 'onboarding_completed', value: 'true' },
          { user_id: userId, key: 'schema_version', value: '2' },
        ]).throwOnError();
      }
    );
  }

  resetDatabase(): void {
    this.seedDemoData();
  }
}
