import {
  DatabaseAdapter,
  LedgerRepository,
  CategoryGroup,
  CreateAccountInput,
  UpdateAccountInput,
  CreateCategoryGroupInput,
  UpdateCategoryGroupInput,
  CreateCategoryInput,
  UpdateCategoryInput,
  DiagnosticsData,
} from './types';
import { BudgetState, Account, Category, Transaction, isTargetType } from '../domain/ledger/types';
import { EntityNotFoundError } from '../domain/ledger/errors';
import {
  prepareCreditCardPaymentCategory,
  calculateDepositoryInflowOnCreation,
  assertCanDeleteAccount,
  assertCanDeleteCategoryGroup,
  assertCanDeleteCategory,
  canCleanUpLinkedPaymentCategory,
} from '../domain/ledger/entityOperations';
import {
  postOutflowTransaction,
  postInflowTransaction,
  allocateEnvelope,
  postCreditCardPayment,
} from '../domain/ledger/ledgerEngine';
import { performMonthRollover, MonthRolloverResult } from '../domain/ledger/rollover';
import { calculateAutoAssignAllocations } from '../domain/ledger/autoAssign';
import { coverOverspending } from '../domain/ledger/overspendingCoverage';
import {
  seedDatabase,
  seedDemoData,
  factoryReset,
  clearTransactionsOnly,
  getDiagnostics,
} from './schema';

interface CategoryGroupRow {
  id: string;
  name: string;
  sort_order: number;
}

interface AccountRow {
  id: string;
  name: string;
  account_type: Account['accountType'];
  balance_cents: number;
  credit_payment_category_id: string | null;
  created_at: string;
}

interface CategoryRow {
  id: string;
  group_id: string;
  name: string;
  target_cents: number;
  target_type: Category['targetType'] | null;
  target_due_day: number | null;
  assigned_cents: number;
  available_cents: number;
  is_credit_payment: number;
  unfunded_debt_cents: number | null;
  sort_order: number;
}

interface TransactionRow {
  id: string;
  account_id: string;
  category_id: string | null;
  payee: string;
  amount_cents: number;
  direction: Transaction['direction'];
  occurred_at: string;
  sync_status: Transaction['syncStatus'];
  unfunded_debt_cents: number | null;
  transferred_to_reserve_cents: number | null;
}

export class SQLiteLedgerRepository implements LedgerRepository {
  constructor(private db: DatabaseAdapter) {}

  getCategoryGroups(): CategoryGroup[] {
    const groupRows = this.db.getAllSync<CategoryGroupRow>(
      'SELECT id, name, sort_order FROM category_groups ORDER BY sort_order ASC'
    );
    return groupRows.map((groupRow) => ({
      id: groupRow.id,
      name: groupRow.name,
      sortOrder: Number(groupRow.sort_order),
    }));
  }

  getBudgetState(): BudgetState {
    const metaRow = this.db.getFirstSync<{ value: string }>(
      'SELECT value FROM metadata WHERE key = ?',
      'ready_to_assign_cents'
    );
    const readyToAssignCents = metaRow ? parseInt(metaRow.value, 10) : 0;

    const accountRows = this.db.getAllSync<AccountRow>('SELECT * FROM accounts');
    const accounts: Record<string, Account> = {};
    for (const accountRow of accountRows) {
      accounts[accountRow.id] = {
        id: accountRow.id,
        name: accountRow.name,
        accountType: accountRow.account_type,
        balanceCents: Number(accountRow.balance_cents),
        creditPaymentCategoryId: accountRow.credit_payment_category_id || undefined,
      };
    }

    const categoryRows = this.db.getAllSync<CategoryRow>(
      'SELECT * FROM categories ORDER BY sort_order ASC'
    );
    const categories: Record<string, Category> = {};
    for (const categoryRow of categoryRows) {
      const targetType = isTargetType(categoryRow.target_type)
        ? categoryRow.target_type
        : 'NEEDED_FOR_SPENDING';

      categories[categoryRow.id] = {
        id: categoryRow.id,
        groupId: categoryRow.group_id,
        name: categoryRow.name,
        targetCents: Number(categoryRow.target_cents),
        targetType,
        targetDueDay:
          categoryRow.target_due_day !== null && categoryRow.target_due_day !== undefined
            ? Number(categoryRow.target_due_day)
            : undefined,
        assignedCents: Number(categoryRow.assigned_cents),
        availableCents: Number(categoryRow.available_cents),
        isCreditPayment: Boolean(categoryRow.is_credit_payment),
        unfundedDebtCents: Number(categoryRow.unfunded_debt_cents || 0),
      };
    }

    const transactionRows = this.db.getAllSync<TransactionRow>(
      'SELECT * FROM transactions ORDER BY occurred_at DESC'
    );
    const transactions: Transaction[] = transactionRows.map((transactionRow) => ({
      id: transactionRow.id,
      accountId: transactionRow.account_id,
      categoryId: transactionRow.category_id || undefined,
      payee: transactionRow.payee,
      amountCents: Number(transactionRow.amount_cents),
      direction: transactionRow.direction,
      occurredAt: transactionRow.occurred_at,
      syncStatus: transactionRow.sync_status,
      unfundedDebtCents: Number(transactionRow.unfunded_debt_cents || 0),
      transferredToReserveCents: Number(transactionRow.transferred_to_reserve_cents || 0),
    }));

    let totalOutflowCents = 0;
    let totalInflowCents = 0;
    for (const transaction of transactions) {
      if (transaction.direction === 'outflow') {
        totalOutflowCents += transaction.amountCents;
      } else {
        totalInflowCents += transaction.amountCents;
      }
    }

    return {
      readyToAssignCents,
      accounts,
      categories,
      transactions,
      totalOutflowCents,
      totalInflowCents,
    };
  }

  postOutflow(params: {
    id: string;
    accountId: string;
    categoryId: string;
    amountCents: number;
    payee: string;
    occurredAt?: string;
  }): { transaction: Transaction; isOverspent: boolean } {
    const currentState = this.getBudgetState();
    const result = postOutflowTransaction({
      state: currentState,
      id: params.id,
      accountId: params.accountId,
      categoryId: params.categoryId,
      amountCents: params.amountCents,
      payee: params.payee,
      occurredAt: params.occurredAt,
    });

    this.db.withTransactionSync(() => {
      // 1. Update account balance
      const account = result.state.accounts[params.accountId];
      this.db.runSync(
        'UPDATE accounts SET balance_cents = ? WHERE id = ?',
        account.balanceCents,
        account.id
      );

      // 2. Update category available balance & unfunded debt
      const category = result.state.categories[params.categoryId];
      this.db.runSync(
        'UPDATE categories SET available_cents = ?, unfunded_debt_cents = ? WHERE id = ?',
        category.availableCents,
        category.unfundedDebtCents || 0,
        category.id
      );

      // 3. If credit payment reserve category was updated, persist it
      if (account.accountType === 'credit' && account.creditPaymentCategoryId) {
        const paymentCategory = result.state.categories[account.creditPaymentCategoryId];
        if (paymentCategory) {
          this.db.runSync(
            'UPDATE categories SET available_cents = ? WHERE id = ?',
            paymentCategory.availableCents,
            paymentCategory.id
          );
        }
      }

      // 4. Insert transaction record
      this.db.runSync(
        'INSERT INTO transactions (id, account_id, category_id, payee, amount_cents, direction, occurred_at, sync_status, unfunded_debt_cents, transferred_to_reserve_cents) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        result.transaction.id,
        result.transaction.accountId,
        result.transaction.categoryId || null,
        result.transaction.payee,
        result.transaction.amountCents,
        result.transaction.direction,
        result.transaction.occurredAt,
        result.transaction.syncStatus,
        result.transaction.unfundedDebtCents || 0,
        result.transaction.transferredToReserveCents || 0
      );
    });

    return {
      transaction: result.transaction,
      isOverspent: result.isOverspent,
    };
  }

  postInflow(params: {
    id: string;
    accountId: string;
    amountCents: number;
    payee: string;
    occurredAt?: string;
  }): { transaction: Transaction } {
    const currentState = this.getBudgetState();
    const result = postInflowTransaction({
      state: currentState,
      id: params.id,
      accountId: params.accountId,
      amountCents: params.amountCents,
      payee: params.payee,
      occurredAt: params.occurredAt,
    });

    this.db.withTransactionSync(() => {
      // 1. Update account balance
      const account = result.state.accounts[params.accountId];
      this.db.runSync(
        'UPDATE accounts SET balance_cents = ? WHERE id = ?',
        account.balanceCents,
        account.id
      );

      // 2. Update ready_to_assign in metadata
      this.db.runSync(
        'INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)',
        'ready_to_assign_cents',
        String(result.state.readyToAssignCents)
      );

      // 3. Insert transaction record
      this.db.runSync(
        'INSERT INTO transactions (id, account_id, payee, amount_cents, direction, occurred_at, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        result.transaction.id,
        result.transaction.accountId,
        result.transaction.payee,
        result.transaction.amountCents,
        result.transaction.direction,
        result.transaction.occurredAt,
        result.transaction.syncStatus
      );
    });

    return {
      transaction: result.transaction,
    };
  }

  allocateEnvelope(params: {
    categoryId: string;
    amountCents: number;
  }): { isOverAssigned: boolean } {
    const currentState = this.getBudgetState();
    const result = allocateEnvelope({
      state: currentState,
      categoryId: params.categoryId,
      amountCents: params.amountCents,
    });

    this.db.withTransactionSync(() => {
      const category = result.state.categories[params.categoryId];
      this.db.runSync(
        'UPDATE categories SET assigned_cents = ?, available_cents = ? WHERE id = ?',
        category.assignedCents,
        category.availableCents,
        category.id
      );

      this.db.runSync(
        'INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)',
        'ready_to_assign_cents',
        String(result.state.readyToAssignCents)
      );
    });

    return {
      isOverAssigned: result.isOverAssigned,
    };
  }

  postCreditCardPayment(params: {
    id: string;
    fromAccountId: string;
    toAccountId: string;
    amountCents: number;
    payee?: string;
    occurredAt?: string;
  }): { transaction: Transaction } {
    const currentState = this.getBudgetState();
    const result = postCreditCardPayment({
      state: currentState,
      id: params.id,
      fromAccountId: params.fromAccountId,
      toAccountId: params.toAccountId,
      amountCents: params.amountCents,
      payee: params.payee,
      occurredAt: params.occurredAt,
    });

    this.db.withTransactionSync(() => {
      // 1. Update fromAccount
      const fromAccount = result.state.accounts[params.fromAccountId];
      this.db.runSync(
        'UPDATE accounts SET balance_cents = ? WHERE id = ?',
        fromAccount.balanceCents,
        fromAccount.id
      );

      // 2. Update toAccount
      const toAccount = result.state.accounts[params.toAccountId];
      this.db.runSync(
        'UPDATE accounts SET balance_cents = ? WHERE id = ?',
        toAccount.balanceCents,
        toAccount.id
      );

      // 3. Update payment category
      if (toAccount.creditPaymentCategoryId) {
        const paymentCategory = result.state.categories[toAccount.creditPaymentCategoryId];
        if (paymentCategory) {
          this.db.runSync(
            'UPDATE categories SET available_cents = ? WHERE id = ?',
            paymentCategory.availableCents,
            paymentCategory.id
          );
        }
      }

      // 4. Insert transaction
      this.db.runSync(
        'INSERT INTO transactions (id, account_id, category_id, payee, amount_cents, direction, occurred_at, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        result.transaction.id,
        result.transaction.accountId,
        result.transaction.categoryId || null,
        result.transaction.payee,
        result.transaction.amountCents,
        result.transaction.direction,
        result.transaction.occurredAt,
        result.transaction.syncStatus
      );
    });

    return {
      transaction: result.transaction,
    };
  }

  performMonthRollover(targetMonth?: string): MonthRolloverResult {
    const currentState = this.getBudgetState();
    const result = performMonthRollover({ state: currentState, targetMonth });

    this.db.withTransactionSync(() => {
      // 1. Update Ready to Assign in metadata
      this.db.runSync(
        'INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)',
        'ready_to_assign_cents',
        String(result.state.readyToAssignCents)
      );

      // 2. Track current cycle month if provided
      if (targetMonth) {
        this.db.runSync(
          'INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)',
          'current_cycle_month',
          targetMonth
        );
      }

      // 3. Update category envelopes (assigned resets to 0, deficits cleared, unspent rolled over)
      for (const category of Object.values(result.state.categories)) {
        this.db.runSync(
          'UPDATE categories SET assigned_cents = ?, available_cents = ?, unfunded_debt_cents = ? WHERE id = ?',
          category.assignedCents,
          category.availableCents,
          category.unfundedDebtCents || 0,
          category.id
        );
      }
    });

    return result;
  }

  applyAutoAssign(): { totalAllocatedCents: number; assignedCount: number } {
    const currentState = this.getBudgetState();
    const groups = this.getCategoryGroups();

    const autoAssignResult = calculateAutoAssignAllocations({
      readyToAssignCents: currentState.readyToAssignCents,
      categories: Object.values(currentState.categories),
      groups,
    });

    if (autoAssignResult.totalAllocatedCents === 0) {
      return { totalAllocatedCents: 0, assignedCount: 0 };
    }

    let assignedCount = 0;
    this.db.withTransactionSync(() => {
      for (const [categoryId, allocatedCents] of Object.entries(autoAssignResult.allocations)) {
        if (allocatedCents > 0) {
          const category = currentState.categories[categoryId];
          if (category) {
            const newAssignedCents = category.assignedCents + allocatedCents;
            const newAvailableCents = category.availableCents + allocatedCents;
            this.db.runSync(
              'UPDATE categories SET assigned_cents = ?, available_cents = ? WHERE id = ?',
              newAssignedCents,
              newAvailableCents,
              category.id
            );
            assignedCount++;
          }
        }
      }

      this.db.runSync(
        'INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)',
        'ready_to_assign_cents',
        String(autoAssignResult.remainingReadyToAssignCents)
      );
    });

    return {
      totalAllocatedCents: autoAssignResult.totalAllocatedCents,
      assignedCount,
    };
  }

  rebalanceCategoryFunds(params: {
    targetCategoryId: string;
    sourceCategoryId: string;
    amountCents: number;
  }): { coveredCents: number; isCreditDebtCovered: boolean } {
    const currentState = this.getBudgetState();
    const result = coverOverspending({
      state: currentState,
      targetCategoryId: params.targetCategoryId,
      sourceCategoryId: params.sourceCategoryId,
      amountCents: params.amountCents,
    });

    this.db.withTransactionSync(() => {
      // 1. Update source category
      const sourceCategory = result.state.categories[params.sourceCategoryId];
      this.db.runSync(
        'UPDATE categories SET assigned_cents = ?, available_cents = ? WHERE id = ?',
        sourceCategory.assignedCents,
        sourceCategory.availableCents,
        sourceCategory.id
      );

      // 2. Update target category
      const targetCategory = result.state.categories[params.targetCategoryId];
      this.db.runSync(
        'UPDATE categories SET assigned_cents = ?, available_cents = ?, unfunded_debt_cents = ? WHERE id = ?',
        targetCategory.assignedCents,
        targetCategory.availableCents,
        targetCategory.unfundedDebtCents || 0,
        targetCategory.id
      );

      // 3. If credit payment category was credited, update it
      if (result.isCreditDebtCovered) {
        const paymentCategoryId = result.coveredPaymentCategoryId;
        const paymentCategory = paymentCategoryId
          ? result.state.categories[paymentCategoryId]
          : Object.values(result.state.categories).find((category) => category.isCreditPayment);
        if (paymentCategory) {
          this.db.runSync(
            'UPDATE categories SET assigned_cents = ?, available_cents = ? WHERE id = ?',
            paymentCategory.assignedCents,
            paymentCategory.availableCents,
            paymentCategory.id
          );
        }
      }
    });

    return {
      coveredCents: result.coveredCents,
      isCreditDebtCovered: result.isCreditDebtCovered,
    };
  }

  resetDatabase(): void {
    seedDatabase(this.db);
  }

  factoryReset(): void {
    factoryReset(this.db);
  }

  clearTransactionsOnly(): void {
    clearTransactionsOnly(this.db);
  }

  seedDemoData(): void {
    seedDemoData(this.db);
  }

  getDiagnostics(): DiagnosticsData {
    return getDiagnostics(this.db);
  }

  createAccount(input: CreateAccountInput): Account {
    return this.db.withTransactionSync(() => {
      const id = input.id || `acc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date().toISOString();
      let creditPaymentCategoryId: string | undefined = undefined;

      if (input.accountType === 'credit') {
        const preparedPaymentCategory = prepareCreditCardPaymentCategory(input.name, id, input.balanceCents);
        creditPaymentCategoryId = preparedPaymentCategory.categoryId;

        const existingCategoryGroup = this.db.getFirstSync<{ id: string }>(
          'SELECT id FROM category_groups WHERE id = ?',
          preparedPaymentCategory.paymentGroupId
        );
        if (!existingCategoryGroup) {
          this.db.runSync(
            'INSERT INTO category_groups (id, name, sort_order) VALUES (?, ?, ?)',
            preparedPaymentCategory.paymentGroupId,
            preparedPaymentCategory.paymentGroupName,
            0
          );
        }

        this.db.runSync(
          'INSERT INTO categories (id, group_id, name, target_cents, target_type, target_due_day, assigned_cents, available_cents, is_credit_payment, unfunded_debt_cents, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          preparedPaymentCategory.categoryId,
          preparedPaymentCategory.paymentGroupId,
          preparedPaymentCategory.categoryName,
          0,
          'NEEDED_FOR_SPENDING',
          null,
          0,
          0,
          1,
          preparedPaymentCategory.startingDebtCents,
          0
        );
      }

      this.db.runSync(
        'INSERT INTO accounts (id, name, account_type, balance_cents, credit_payment_category_id, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        id,
        input.name,
        input.accountType,
        input.balanceCents,
        creditPaymentCategoryId || null,
        now
      );

      const readyToAssignAddition = calculateDepositoryInflowOnCreation(input.accountType, input.balanceCents);
      if (readyToAssignAddition > 0) {
        const metaRow = this.db.getFirstSync<{ value: string }>(
          'SELECT value FROM metadata WHERE key = ?',
          'ready_to_assign_cents'
        );
        const currentReadyToAssignCents = metaRow ? parseInt(metaRow.value, 10) : 0;
        this.db.runSync(
          'INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)',
          'ready_to_assign_cents',
          String(currentReadyToAssignCents + readyToAssignAddition)
        );
      }

      return {
        id,
        name: input.name,
        accountType: input.accountType,
        balanceCents: input.balanceCents,
        creditPaymentCategoryId,
      };
    });
  }

  updateAccount(input: UpdateAccountInput): Account {
    return this.db.withTransactionSync(() => {
      const existingAccount = this.db.getFirstSync<AccountRow>(
        'SELECT * FROM accounts WHERE id = ?',
        input.id
      );
      if (!existingAccount) {
        throw new EntityNotFoundError('Account', input.id);
      }

      const updatedName = input.name;
      const currentBalance = Number(existingAccount.balance_cents);
      const updatedBalance = input.balanceCents !== undefined ? input.balanceCents : currentBalance;

      this.db.runSync(
        'UPDATE accounts SET name = ?, balance_cents = ? WHERE id = ?',
        updatedName,
        updatedBalance,
        input.id
      );

      // Preserve ledger parity: adjust Ready to Assign for depository accounts if balance changed
      if (existingAccount.account_type !== 'credit' && input.balanceCents !== undefined) {
        const delta = updatedBalance - currentBalance;
        if (delta !== 0) {
          const currentReadyToAssignRow = this.db.getFirstSync<{ value: string }>(
            'SELECT value FROM metadata WHERE key = ?',
            'ready_to_assign_cents'
          );
          const currentReadyToAssignCents = currentReadyToAssignRow ? Number(currentReadyToAssignRow.value) : 0;
          this.db.runSync(
            'INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)',
            'ready_to_assign_cents',
            String(currentReadyToAssignCents + delta)
          );
        }
      }

      return {
        id: existingAccount.id,
        name: updatedName,
        accountType: existingAccount.account_type,
        balanceCents: updatedBalance,
        creditPaymentCategoryId: existingAccount.credit_payment_category_id || undefined,
      };
    });
  }

  deleteAccount(id: string): void {
    this.db.withTransactionSync(() => {
      const existingAccount = this.db.getFirstSync<AccountRow>(
        'SELECT * FROM accounts WHERE id = ?',
        id
      );
      if (!existingAccount) {
        throw new EntityNotFoundError('Account', id);
      }

      const transactionCountRow = this.db.getFirstSync<{ count: number }>(
        'SELECT COUNT(*) as count FROM transactions WHERE account_id = ?',
        id
      );
      assertCanDeleteAccount(transactionCountRow?.count ?? 0);

      // If it is a credit card account, clean up linked payment category if it has no transactions and zero balance
      if (existingAccount.credit_payment_category_id) {
        const paymentCategoryId = existingAccount.credit_payment_category_id;
        const paymentCategory = this.db.getFirstSync<CategoryRow>(
          'SELECT * FROM categories WHERE id = ?',
          paymentCategoryId
        );
        if (paymentCategory) {
          const paymentCategoryTransactionCountRow = this.db.getFirstSync<{ count: number }>(
            'SELECT COUNT(*) as count FROM transactions WHERE category_id = ?',
            paymentCategoryId
          );
          const paymentCategoryTransactionCount = paymentCategoryTransactionCountRow?.count ?? 0;
          const paymentCategoryAvailableCents = Number(paymentCategory.available_cents);

          if (canCleanUpLinkedPaymentCategory(paymentCategoryAvailableCents, paymentCategoryTransactionCount)) {
            this.db.runSync('DELETE FROM categories WHERE id = ?', paymentCategoryId);
          }
        }
      }

      this.db.runSync('DELETE FROM accounts WHERE id = ?', id);
    });
  }

  createCategoryGroup(input: CreateCategoryGroupInput): CategoryGroup {
    return this.db.withTransactionSync(() => {
      const id = input.id || `grp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const maxSortOrderRow = this.db.getFirstSync<{ max_sort: number | null }>(
        'SELECT MAX(sort_order) as max_sort FROM category_groups'
      );
      const sortOrder = (maxSortOrderRow?.max_sort !== null && maxSortOrderRow?.max_sort !== undefined)
        ? Number(maxSortOrderRow.max_sort) + 1
        : 0;

      this.db.runSync(
        'INSERT INTO category_groups (id, name, sort_order) VALUES (?, ?, ?)',
        id,
        input.name,
        sortOrder
      );

      return {
        id,
        name: input.name,
        sortOrder,
      };
    });
  }

  updateCategoryGroup(input: UpdateCategoryGroupInput): CategoryGroup {
    return this.db.withTransactionSync(() => {
      const existingCategoryGroup = this.db.getFirstSync<CategoryGroupRow>(
        'SELECT * FROM category_groups WHERE id = ?',
        input.id
      );
      if (!existingCategoryGroup) {
        throw new EntityNotFoundError('CategoryGroup', input.id);
      }

      this.db.runSync(
        'UPDATE category_groups SET name = ? WHERE id = ?',
        input.name,
        input.id
      );

      return {
        id: existingCategoryGroup.id,
        name: input.name,
        sortOrder: Number(existingCategoryGroup.sort_order),
      };
    });
  }

  deleteCategoryGroup(id: string): void {
    this.db.withTransactionSync(() => {
      const existingCategoryGroup = this.db.getFirstSync<CategoryGroupRow>(
        'SELECT * FROM category_groups WHERE id = ?',
        id
      );
      if (!existingCategoryGroup) {
        throw new EntityNotFoundError('CategoryGroup', id);
      }

      const categoryCountRow = this.db.getFirstSync<{ count: number }>(
        'SELECT COUNT(*) as count FROM categories WHERE group_id = ?',
        id
      );
      assertCanDeleteCategoryGroup(categoryCountRow?.count ?? 0);

      this.db.runSync('DELETE FROM category_groups WHERE id = ?', id);
    });
  }

  createCategory(input: CreateCategoryInput): Category {
    return this.db.withTransactionSync(() => {
      const parentCategoryGroup = this.db.getFirstSync<CategoryGroupRow>(
        'SELECT id FROM category_groups WHERE id = ?',
        input.groupId
      );
      if (!parentCategoryGroup) {
        throw new EntityNotFoundError('CategoryGroup', input.groupId);
      }

      const id = input.id || `cat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const maxSortOrderRow = this.db.getFirstSync<{ max_sort: number | null }>(
        'SELECT MAX(sort_order) as max_sort FROM categories WHERE group_id = ?',
        input.groupId
      );
      const sortOrder = (maxSortOrderRow?.max_sort !== null && maxSortOrderRow?.max_sort !== undefined)
        ? Number(maxSortOrderRow.max_sort) + 1
        : 0;

      const targetCents = input.targetCents || 0;
      const targetType = input.targetType || 'NEEDED_FOR_SPENDING';
      const targetDueDay = input.targetDueDay || null;

      this.db.runSync(
        'INSERT INTO categories (id, group_id, name, target_cents, target_type, target_due_day, assigned_cents, available_cents, is_credit_payment, unfunded_debt_cents, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        id,
        input.groupId,
        input.name,
        targetCents,
        targetType,
        targetDueDay,
        0,
        0,
        0,
        0,
        sortOrder
      );

      return {
        id,
        groupId: input.groupId,
        name: input.name,
        targetCents,
        targetType,
        targetDueDay: targetDueDay || undefined,
        assignedCents: 0,
        availableCents: 0,
        isCreditPayment: false,
        unfundedDebtCents: 0,
      };
    });
  }

  updateCategory(input: UpdateCategoryInput): Category {
    return this.db.withTransactionSync(() => {
      const existingCategory = this.db.getFirstSync<CategoryRow>(
        'SELECT * FROM categories WHERE id = ?',
        input.id
      );
      if (!existingCategory) {
        throw new EntityNotFoundError('Category', input.id);
      }

      const newGroupId = input.groupId || existingCategory.group_id;
      if (input.groupId && input.groupId !== existingCategory.group_id) {
        const parentCategoryGroup = this.db.getFirstSync<CategoryGroupRow>(
          'SELECT id FROM category_groups WHERE id = ?',
          input.groupId
        );
        if (!parentCategoryGroup) {
          throw new EntityNotFoundError('CategoryGroup', input.groupId);
        }
      }

      const newName = input.name !== undefined ? input.name : existingCategory.name;
      const newTargetCents = input.targetCents !== undefined ? input.targetCents : Number(existingCategory.target_cents);
      const newTargetType = input.targetType !== undefined ? input.targetType : (existingCategory.target_type || 'NEEDED_FOR_SPENDING');
      const newTargetDueDay = input.targetDueDay !== undefined ? input.targetDueDay : (existingCategory.target_due_day || null);

      this.db.runSync(
        'UPDATE categories SET group_id = ?, name = ?, target_cents = ?, target_type = ?, target_due_day = ? WHERE id = ?',
        newGroupId,
        newName,
        newTargetCents,
        newTargetType,
        newTargetDueDay,
        input.id
      );

      const validTargetType = isTargetType(newTargetType) ? newTargetType : 'NEEDED_FOR_SPENDING';

      return {
        id: existingCategory.id,
        groupId: newGroupId,
        name: newName,
        targetCents: newTargetCents,
        targetType: validTargetType,
        targetDueDay: newTargetDueDay || undefined,
        assignedCents: Number(existingCategory.assigned_cents),
        availableCents: Number(existingCategory.available_cents),
        isCreditPayment: existingCategory.is_credit_payment === 1,
        unfundedDebtCents: Number(existingCategory.unfunded_debt_cents || 0),
      };
    });
  }

  deleteCategory(id: string): void {
    this.db.withTransactionSync(() => {
      const existingCategory = this.db.getFirstSync<CategoryRow>(
        'SELECT * FROM categories WHERE id = ?',
        id
      );
      if (!existingCategory) {
        throw new EntityNotFoundError('Category', id);
      }

      const transactionCountRow = this.db.getFirstSync<{ count: number }>(
        'SELECT COUNT(*) as count FROM transactions WHERE category_id = ?',
        id
      );

      assertCanDeleteCategory({
        isCreditPayment: existingCategory.is_credit_payment === 1,
        availableCents: Number(existingCategory.available_cents),
        transactionCount: transactionCountRow?.count ?? 0,
      });

      this.db.runSync('DELETE FROM categories WHERE id = ?', id);
    });
  }
}

