import { SupabaseLedgerRepository } from '../supabaseLedgerRepository';
import { SupabaseClient } from '@supabase/supabase-js';
import { fromPartial } from '@total-typescript/shoehorn';
import { AccountRow, CategoryGroupRow, CategoryRow, TransactionRow, MetadataRow } from '../types';
import { EntityIntegrityError, LedgerError, ProtectedEntityError, ValidationError } from '../../../domain/ledger/errors';
import { Account, Category, Transaction } from '../../../domain/ledger/types';
import { mapAccountRowToDomain } from '../mappers';

interface MockTableHandlers {
  select?: jest.Mock;
  insert?: jest.Mock;
  update?: jest.Mock;
  delete?: jest.Mock;
  upsert?: jest.Mock;
}

function createMockSupabase(
  initialData: {
    metadata?: MetadataRow[];
    accounts?: AccountRow[];
    category_groups?: CategoryGroupRow[];
    categories?: CategoryRow[];
    transactions?: TransactionRow[];
  } = {},
  options: {
    failOnSelect?: boolean;
    failOnInsert?: boolean;
    failOnUpdate?: boolean;
    failOnDelete?: boolean;
  } = {}
) {
  const tableData: Record<string, unknown[]> = {
    metadata: (initialData.metadata ?? []).map((r) => ({ ...r })),
    accounts: (initialData.accounts ?? []).map((r) => ({ ...r })),
    category_groups: (initialData.category_groups ?? []).map((r) => ({ ...r })),
    categories: (initialData.categories ?? []).map((r) => ({ ...r })),
    transactions: (initialData.transactions ?? []).map((r) => ({ ...r })),
  };

  const handlers: Record<string, MockTableHandlers> = {};

  const getOrCreateHandlers = (table: string): MockTableHandlers => {
    if (!handlers[table]) {
      handlers[table] = {
        select: jest.fn().mockImplementation(() => {
          if (options.failOnSelect) {
            return {
              order: jest.fn().mockResolvedValue({ data: null, error: { message: 'Query failed' } }),
              then: (resolve: (val: unknown) => unknown) =>
                Promise.resolve({ data: null, error: { message: 'Query failed' } }).then(resolve),
            };
          }
          return {
            order: jest.fn().mockResolvedValue({ data: tableData[table] ?? [], error: null }),
            then: (resolve: (val: unknown) => unknown) =>
              Promise.resolve({ data: tableData[table] ?? [], error: null }).then(resolve),
          };
        }),
        insert: jest.fn().mockImplementation((rows: unknown) => {
          const builder = {
            throwOnError: jest.fn().mockImplementation(() => builder),
            then: (resolve: (val: unknown) => unknown, reject?: (err: unknown) => unknown) => {
              if (options.failOnInsert) {
                return Promise.reject(new Error('Simulated network failure on insert')).then(resolve, reject);
              }
              const rowArr = Array.isArray(rows) ? rows : [rows];
              tableData[table]?.push(...rowArr);
              return Promise.resolve({ data: rows, error: null }).then(resolve, reject);
            },
          };
          return builder;
        }),
        update: jest.fn().mockImplementation(() => {
          const builder: {
            eq: jest.Mock;
            throwOnError: jest.Mock;
            then: (resolve: (val: unknown) => unknown, reject?: (err: unknown) => unknown) => Promise<unknown>;
          } = {
            eq: jest.fn().mockImplementation(() => builder),
            throwOnError: jest.fn().mockImplementation(() => builder),
            then: (resolve: (val: unknown) => unknown, reject?: (err: unknown) => unknown) => {
              if (options.failOnUpdate) {
                return Promise.reject(new Error('Simulated network failure on update')).then(resolve, reject);
              }
              return Promise.resolve({ data: null, error: null }).then(resolve, reject);
            },
          };
          return builder;
        }),
        delete: jest.fn().mockImplementation(() => {
          const builder: {
            eq: jest.Mock;
            throwOnError: jest.Mock;
            then: (resolve: (val: unknown) => unknown, reject?: (err: unknown) => unknown) => Promise<unknown>;
          } = {
            eq: jest.fn().mockImplementation(() => builder),
            throwOnError: jest.fn().mockImplementation(() => builder),
            then: (resolve: (val: unknown) => unknown, reject?: (err: unknown) => unknown) => {
              if (options.failOnDelete) {
                return Promise.reject(new Error('Simulated network failure on delete')).then(resolve, reject);
              }
              return Promise.resolve({ data: null, error: null }).then(resolve, reject);
            },
          };
          return builder;
        }),
        upsert: jest.fn().mockImplementation((rows: unknown) => {
          const builder = {
            throwOnError: jest.fn().mockImplementation(() => builder),
            then: (resolve: (val: unknown) => unknown, reject?: (err: unknown) => unknown) => {
              if (options.failOnInsert) {
                return Promise.reject(new Error('Simulated network failure on upsert')).then(resolve, reject);
              }
              const rowArr = Array.isArray(rows) ? rows : [rows];
              for (const row of rowArr) {
                const r = row as Record<string, unknown>;
                const existingIdx = (tableData[table] ?? []).findIndex((existing) => {
                  const e = existing as Record<string, unknown>;
                  if (table === 'metadata' && typeof e.key === 'string' && typeof r.key === 'string') {
                    return e.key === r.key;
                  }
                  if (typeof e.id === 'string' && typeof r.id === 'string') {
                    return e.id === r.id;
                  }
                  return false;
                });
                if (existingIdx >= 0) {
                  tableData[table][existingIdx] = { ...(tableData[table][existingIdx] as Record<string, unknown>), ...r };
                } else {
                  tableData[table]?.push(r);
                }
              }
              return Promise.resolve({ data: rows, error: null }).then(resolve, reject);
            },
          };
          return builder;
        }),
      };
    }
    return handlers[table];
  };

  const mockClient = fromPartial<SupabaseClient>({
    auth: fromPartial<SupabaseClient['auth']>({
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-uuid' } },
        error: null,
      }),
      getSession: jest.fn().mockResolvedValue({
        data: { session: { user: { id: 'test-user-uuid' } } },
        error: null,
      }),
    }),
    from: jest.fn().mockImplementation((table: string) => {
      const h = getOrCreateHandlers(table);
      return fromPartial({
        select: h.select,
        insert: h.insert,
        update: h.update,
        delete: h.delete,
        upsert: h.upsert,
      });
    }),
  });

  return { mockClient, handlers, tableData };
}

describe('SupabaseLedgerRepository (Tickets 02: SCEN-004, SCEN-005, SCEN-006, SCEN-007)', () => {
  const seedAccounts: AccountRow[] = [
    {
      id: 'acc-checking',
      user_id: 'test-user-uuid',
      name: 'Checking Account',
      account_type: 'checking',
      balance_cents: 100000, // $1,000.00
    },
  ];

  const seedGroups: CategoryGroupRow[] = [
    {
      id: 'grp-bills',
      user_id: 'test-user-uuid',
      name: 'Immediate Obligations',
      sort_order: 1,
    },
  ];

  const seedCategories: CategoryRow[] = [
    {
      id: 'cat-groceries',
      user_id: 'test-user-uuid',
      group_id: 'grp-bills',
      name: 'Groceries',
      assigned_cents: 20000,
      activity_cents: 0,
      available_cents: 20000, // $200.00
      target_cents: 20000,
      target_type: 'NEEDED_FOR_SPENDING',
      target_due_day: 15,
      unfunded_debt_cents: 0,
      is_credit_payment: 0,
      credit_account_id: null,
      sort_order: 1,
    },
  ];

  const seedMetadata: MetadataRow[] = [
    {
      user_id: 'test-user-uuid',
      key: 'ready_to_assign_cents',
      value: '80000', // $800.00
    },
    {
      user_id: 'test-user-uuid',
      key: 'schema_version',
      value: '2',
    },
  ];

  describe('SCEN-004: Cache Hydration on Launch', () => {
    it('queries Supabase tables and populates in-memory BudgetState and CategoryGroup[]', async () => {
      const { mockClient } = createMockSupabase({
        accounts: seedAccounts,
        category_groups: seedGroups,
        categories: seedCategories,
        metadata: seedMetadata,
      });

      const repo = new SupabaseLedgerRepository(mockClient);
      await repo.initializeAsync();

      const state = repo.getBudgetState();
      const groups = repo.getCategoryGroups();

      expect(Object.keys(state.accounts)).toHaveLength(1);
      expect(state.accounts['acc-checking'].id).toBe('acc-checking');
      expect(state.accounts['acc-checking'].balanceCents).toBe(100000);

      expect(Object.keys(state.categories)).toHaveLength(1);
      expect(state.categories['cat-groceries'].id).toBe('cat-groceries');
      expect(state.categories['cat-groceries'].availableCents).toBe(20000);

      expect(state.readyToAssignCents).toBe(80000);
      expect(groups).toHaveLength(1);
      expect(groups[0].id).toBe('grp-bills');
    });

    it('gracefully initializes empty default state when no records exist', async () => {
      const { mockClient } = createMockSupabase();

      const repo = new SupabaseLedgerRepository(mockClient);
      await repo.initializeAsync();

      const state = repo.getBudgetState();
      expect(state.accounts).toEqual({});
      expect(state.categories).toEqual({});
      expect(state.transactions).toEqual([]);
      expect(state.readyToAssignCents).toBe(0);
    });

    it('throws LedgerError when any table query fails during initialization', async () => {
      const { mockClient } = createMockSupabase({}, { failOnSelect: true });
      const repo = new SupabaseLedgerRepository(mockClient);
      await expect(repo.initializeAsync()).rejects.toThrow(LedgerError);
    });
  });

  describe('SCEN-005: Zero-Latency Synchronous Store Reads', () => {
    it('returns synchronous snapshot without returning a Promise', async () => {
      const { mockClient } = createMockSupabase({
        accounts: seedAccounts,
        category_groups: seedGroups,
        categories: seedCategories,
        metadata: seedMetadata,
      });

      const repo = new SupabaseLedgerRepository(mockClient);
      await repo.initializeAsync();

      // useSyncExternalStore requires synchronous return value
      const stateSnapshot = repo.getBudgetState();
      const groupsSnapshot = repo.getCategoryGroups();

      expect(stateSnapshot).not.toBeInstanceOf(Promise);
      expect(groupsSnapshot).not.toBeInstanceOf(Promise);
      expect(stateSnapshot.readyToAssignCents).toBe(80000);
      expect(Array.isArray(groupsSnapshot)).toBe(true);
    });
  });

  describe('SCEN-006: Optimistic Outflow Mutation', () => {
    it('mutates in-memory cache synchronously and dispatches background insert', async () => {
      const { mockClient, handlers } = createMockSupabase({
        accounts: seedAccounts,
        category_groups: seedGroups,
        categories: seedCategories,
        metadata: seedMetadata,
      });

      const repo = new SupabaseLedgerRepository(mockClient);
      await repo.initializeAsync();

      const listener = jest.fn();
      repo.subscribe(listener);

      const result = repo.postOutflow({
        id: 'tx-outflow-1',
        accountId: 'acc-checking',
        categoryId: 'cat-groceries',
        amountCents: 5000, // $50.00
        payee: 'Supermarket',
      });

      expect(result.transaction.amountCents).toBe(5000);
      expect(result.isOverspent).toBe(false);

      // Verify synchronous cache update
      const updatedState = repo.getBudgetState();
      const checkingAcc = updatedState.accounts['acc-checking'];
      const groceriesCat = updatedState.categories['cat-groceries'];

      expect(checkingAcc?.balanceCents).toBe(95000); // 100000 - 5000
      expect(groceriesCat?.availableCents).toBe(15000); // 20000 - 5000
      expect(listener).toHaveBeenCalled();

      // Verify remote background calls were dispatched
      expect(handlers['transactions'].insert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'tx-outflow-1',
          account_id: 'acc-checking',
          category_id: 'cat-groceries',
          amount_cents: 5000,
        })
      );
    });
  });

  describe('SCEN-007: Optimistic Mutation Rollback on Network Rejection', () => {
    it('reverts in-memory cache to previous snapshot and notifies subscribers when write fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const { mockClient } = createMockSupabase(
        {
          accounts: seedAccounts,
          category_groups: seedGroups,
          categories: seedCategories,
          metadata: seedMetadata,
        },
        { failOnInsert: true }
      );

      const repo = new SupabaseLedgerRepository(mockClient);
      await repo.initializeAsync();

      const listener = jest.fn();
      repo.subscribe(listener);

      const errorListener = jest.fn();
      repo.subscribeError(errorListener);

      // Post outflow which should trigger rollback after async rejection
      repo.postOutflow({
        id: 'tx-outflow-fail',
        accountId: 'acc-checking',
        categoryId: 'cat-groceries',
        amountCents: 5000,
        payee: 'Failed Supermarket',
      });

      // Synchronous optimistic state immediately after mutation
      expect(repo.getBudgetState().accounts['acc-checking'].balanceCents).toBe(95000);

      // Wait for rejected promise tick
      await new Promise((resolve) => setTimeout(resolve, 50));

      // After failure, cache must revert to pre-mutation snapshot
      const revertedState = repo.getBudgetState();
      expect(revertedState.accounts['acc-checking'].balanceCents).toBe(100000);
      expect(revertedState.categories['cat-groceries'].availableCents).toBe(20000);
      expect(revertedState.transactions.find((t: Transaction) => t.id === 'tx-outflow-fail')).toBeUndefined();

      // Listener fired both on optimistic update and on rollback
      expect(listener).toHaveBeenCalledTimes(2);

      // Error listener fired and lastSyncError is set
      expect(errorListener).toHaveBeenCalledTimes(1);
      expect(repo.getLastSyncError()?.message).toContain('Remote sync rejected');

      consoleSpy.mockRestore();
    });
  });

  describe('Failure-First Invariants & Referential Integrity', () => {
    it('validates amountCents must be positive for outflow and inflow', async () => {
      const { mockClient } = createMockSupabase({
        accounts: seedAccounts,
        category_groups: seedGroups,
        categories: seedCategories,
      });

      const repo = new SupabaseLedgerRepository(mockClient);
      await repo.initializeAsync();

      expect(() =>
        repo.postOutflow({
          id: 'tx-invalid',
          accountId: 'acc-checking',
          categoryId: 'cat-groceries',
          amountCents: -100,
          payee: 'Invalid',
        })
      ).toThrow(ValidationError);

      expect(() =>
        repo.postInflow({
          id: 'tx-invalid-inflow',
          accountId: 'acc-checking',
          amountCents: 0,
          payee: 'Invalid',
        })
      ).toThrow(ValidationError);
    });

    it('blocks deleting account with linked transactions', async () => {
      const seedTx: TransactionRow[] = [
        {
          id: 'tx-1',
          user_id: 'test-user-uuid',
          account_id: 'acc-checking',
          category_id: 'cat-groceries',
          amount_cents: 1000,
          payee: 'Store',
          transaction_type: 'outflow',
          occurred_at: new Date().toISOString(),
        },
      ];

      const { mockClient } = createMockSupabase({
        accounts: seedAccounts,
        transactions: seedTx,
      });

      const repo = new SupabaseLedgerRepository(mockClient);
      await repo.initializeAsync();

      expect(() => repo.deleteAccount('acc-checking')).toThrow(EntityIntegrityError);
    });

    it('blocks deleting category group with child categories', async () => {
      const { mockClient } = createMockSupabase({
        category_groups: seedGroups,
        categories: seedCategories,
      });

      const repo = new SupabaseLedgerRepository(mockClient);
      await repo.initializeAsync();

      expect(() => repo.deleteCategoryGroup('grp-bills')).toThrow(EntityIntegrityError);
    });

    it('blocks deleting protected credit card payment category', async () => {
      const creditCat: CategoryRow = {
        id: 'cat-cc-acc-card',
        user_id: 'test-user-uuid',
        group_id: 'grp-bills',
        name: 'Credit Card Payment',
        assigned_cents: 0,
        activity_cents: 0,
        available_cents: 0,
        target_cents: 0,
        unfunded_debt_cents: 0,
        is_credit_payment: 1,
        credit_account_id: 'acc-card',
        sort_order: 1,
      };

      const { mockClient } = createMockSupabase({
        categories: [creditCat],
      });

      const repo = new SupabaseLedgerRepository(mockClient);
      await repo.initializeAsync();

      expect(() => repo.deleteCategory('cat-cc-acc-card')).toThrow(ProtectedEntityError);
    });

    it('throws ValidationError for invalid or corrupted account_type in row mapping', () => {
      const corruptedRow = fromPartial<AccountRow>({
        id: 'acc-bad',
        user_id: 'test-user-uuid',
        name: 'Bad Account',
        account_type: 'corrupted_type' as unknown as AccountRow['account_type'],
        balance_cents: 10000,
      });
      expect(() => mapAccountRowToDomain(corruptedRow)).toThrow(ValidationError);
    });
  });

  describe('Entity CRUD Operations', () => {
    it('creates depository account and immediately credits readyToAssignCents', async () => {
      const { mockClient } = createMockSupabase();
      const repo = new SupabaseLedgerRepository(mockClient);
      await repo.initializeAsync();

      const acc = repo.createAccount({
        id: 'acc-savings-1',
        name: 'High Yield Savings',
        accountType: 'savings',
        balanceCents: 50000,
      });

      expect(acc.id).toBe('acc-savings-1');
      expect(acc.balanceCents).toBe(50000);
      expect(repo.getBudgetState().readyToAssignCents).toBe(50000);
      expect(repo.getBudgetState().accounts['acc-savings-1']).toBeDefined();
    });

    it('provisions credit card account with linked payment category in grp-payments', async () => {
      const { mockClient } = createMockSupabase();
      const repo = new SupabaseLedgerRepository(mockClient);
      await repo.initializeAsync();

      const acc = repo.createAccount({
        id: 'acc-card-1',
        name: 'Sapphire Card',
        accountType: 'credit',
        balanceCents: -25000,
      });

      expect(acc.creditPaymentCategoryId).toBe('cat-cc-acc-card-1');
      expect(repo.getCategoryGroups().some((g) => g.id === 'grp-payments')).toBe(true);

      const paymentCat = repo.getBudgetState().categories['cat-cc-acc-card-1'];
      expect(paymentCat).toBeDefined();
      expect(paymentCat.isCreditPayment).toBe(true);
      expect(paymentCat.unfundedDebtCents).toBe(25000);
    });

    it('creates, updates, and deletes category groups and categories', async () => {
      const { mockClient } = createMockSupabase();
      const repo = new SupabaseLedgerRepository(mockClient);
      await repo.initializeAsync();

      const group = repo.createCategoryGroup({ name: 'Entertainment' });
      expect(group.name).toBe('Entertainment');
      expect(repo.getCategoryGroups()).toHaveLength(1);

      const cat = repo.createCategory({
        groupId: group.id,
        name: 'Movies',
        targetCents: 3000,
      });
      expect(cat.name).toBe('Movies');
      expect(repo.getBudgetState().categories[cat.id]).toBeDefined();

      const updatedCat = repo.updateCategory({
        id: cat.id,
        name: 'Cinema & Streaming',
        targetCents: 4500,
      });
      expect(updatedCat.name).toBe('Cinema & Streaming');
      expect(updatedCat.targetCents).toBe(4500);

      repo.deleteCategory(cat.id);
      expect(repo.getBudgetState().categories[cat.id]).toBeUndefined();

      repo.deleteCategoryGroup(group.id);
      expect(repo.getCategoryGroups()).toHaveLength(0);
    });
  });

  describe('Budget Allocation, Payment & Diagnostics', () => {
    it('allocates envelopes and deducts from readyToAssignCents', async () => {
      const { mockClient } = createMockSupabase({
        accounts: seedAccounts,
        category_groups: seedGroups,
        categories: seedCategories,
        metadata: seedMetadata,
      });

      const repo = new SupabaseLedgerRepository(mockClient);
      await repo.initializeAsync();

      expect(repo.getBudgetState().readyToAssignCents).toBe(80000);

      const allocResult = repo.allocateEnvelope({
        categoryId: 'cat-groceries',
        amountCents: 10000,
      });

      expect(allocResult.isOverAssigned).toBe(false);
      expect(repo.getBudgetState().readyToAssignCents).toBe(70000);
      expect(repo.getBudgetState().categories['cat-groceries'].assignedCents).toBe(30000);
      expect(repo.getBudgetState().categories['cat-groceries'].availableCents).toBe(30000);
    });

    it('returns accurate diagnostics and executes factoryReset', async () => {
      const { mockClient } = createMockSupabase({
        accounts: seedAccounts,
        category_groups: seedGroups,
        categories: seedCategories,
        metadata: seedMetadata,
      });

      const repo = new SupabaseLedgerRepository(mockClient);
      await repo.initializeAsync();

      const diag = repo.getDiagnostics();
      expect(diag.accountCount).toBe(1);
      expect(diag.categoryGroupCount).toBe(1);
      expect(diag.categoryCount).toBe(1);
      expect(diag.transactionCount).toBe(0);

      repo.factoryReset();

      const postDiag = repo.getDiagnostics();
      expect(postDiag.accountCount).toBe(0);
      expect(postDiag.categoryGroupCount).toBe(0);
      expect(postDiag.categoryCount).toBe(0);
      expect(repo.getBudgetState().readyToAssignCents).toBe(0);
    });

    it('seeds demo data with correct credit_account_id for payment categories', async () => {
      const { mockClient, tableData } = createMockSupabase();
      const repo = new SupabaseLedgerRepository(mockClient);
      await repo.initializeAsync();

      repo.seedDemoData();

      // Wait a tick for background promises
      await new Promise((resolve) => setTimeout(resolve, 10));

      const categories = tableData['categories'] as CategoryRow[];
      const ccCategory = categories.find((c) => c.is_credit_payment === 1);
      expect(ccCategory).toBeDefined();
      expect(ccCategory?.credit_account_id).toBe('acc-credit');
    });

    it('captures immutable readyToAssignCents in background upserts preventing state races', async () => {
      const { mockClient, tableData } = createMockSupabase({
        accounts: seedAccounts,
        category_groups: seedGroups,
        categories: seedCategories,
        metadata: seedMetadata,
      });

      const repo = new SupabaseLedgerRepository(mockClient);
      await repo.initializeAsync();

      // Perform allocation
      repo.allocateEnvelope({
        categoryId: 'cat-groceries',
        amountCents: 10000,
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const metadataRows = tableData['metadata'] as MetadataRow[];
      const rtaRow = metadataRows.find((m) => m.key === 'ready_to_assign_cents');
      expect(rtaRow?.value).toBe('70000');
    });

    it('notifies error subscribers and rolls back when throwOnError rejects', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const { mockClient } = createMockSupabase(
        {
          accounts: seedAccounts,
          category_groups: seedGroups,
          categories: seedCategories,
          metadata: seedMetadata,
        },
        { failOnUpdate: true }
      );

      const repo = new SupabaseLedgerRepository(mockClient);
      await repo.initializeAsync();

      const errorListener = jest.fn();
      repo.subscribeError(errorListener);

      repo.updateAccount({
        id: 'acc-checking',
        name: 'Updated Checking',
      });

      // Synchronous optimistic update
      expect(repo.getBudgetState().accounts['acc-checking'].name).toBe('Updated Checking');

      // Wait for background promise rejection
      await new Promise((resolve) => setTimeout(resolve, 20));

      // Rolled back
      expect(repo.getBudgetState().accounts['acc-checking'].name).toBe('Checking Account');
      expect(errorListener).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Remote sync rejected'),
        })
      );

      consoleSpy.mockRestore();
    });
  });
});
