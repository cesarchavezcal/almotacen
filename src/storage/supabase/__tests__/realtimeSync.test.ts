import { SupabaseLedgerRepository } from '../supabaseLedgerRepository';
import { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { fromPartial } from '@total-typescript/shoehorn';
import { AccountRow, CategoryGroupRow, CategoryRow, TransactionRow, MetadataRow } from '../types';

interface MockTableHandlers {
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  upsert: jest.Mock;
}

interface MockRealtimeChannel {
  on: jest.Mock;
  subscribe: jest.Mock;
  unsubscribe: jest.Mock;
}

const flushPromises = async () => {
  for (let i = 0; i < 20; i++) {
    await Promise.resolve();
  }
};

describe('SupabaseLedgerRepository Realtime Synchronization (SCEN-014, SCEN-015)', () => {
  let tableData: Record<string, unknown[]>;
  let handlers: Record<string, MockTableHandlers>;
  let realtimeCallback: ((payload: unknown) => void) | null = null;
  let mockChannel: MockRealtimeChannel;
  let mockClient: SupabaseClient;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    realtimeCallback = null;

    tableData = {
      metadata: [
        { key: 'ready_to_assign_cents', value: '100000', user_id: 'test-user-uuid' },
        { key: 'onboarding_completed', value: 'true', user_id: 'test-user-uuid' },
      ],
      accounts: [
        {
          id: 'acc-checking',
          user_id: 'test-user-uuid',
          name: 'Checking Account',
          account_type: 'checking',
          balance_cents: 100000,
        },
      ],
      category_groups: [
        {
          id: 'grp-bills',
          user_id: 'test-user-uuid',
          name: 'Monthly Bills',
          sort_order: 1,
        },
      ],
      categories: [
        {
          id: 'cat-rent',
          user_id: 'test-user-uuid',
          group_id: 'grp-bills',
          name: 'Rent',
          target_cents: 80000,
          target_type: 'MONTHLY_SET_ASIDE',
          target_due_day: 1,
          assigned_cents: 0,
          available_cents: 0,
          is_credit_payment: false,
          unfunded_debt_cents: 0,
          sort_order: 1,
        },
      ],
      transactions: [],
    };

    handlers = {};

    const getOrCreateHandlers = (table: string): MockTableHandlers => {
      if (!handlers[table]) {
        handlers[table] = {
          select: jest.fn().mockImplementation(() => {
            return {
              order: jest.fn().mockResolvedValue({ data: tableData[table] ?? [], error: null }),
              then: (resolve: (val: unknown) => unknown) =>
                Promise.resolve({ data: tableData[table] ?? [], error: null }).then(resolve),
            };
          }),
          insert: jest.fn().mockImplementation((rows: unknown) => {
            const builder = {
              throwOnError: jest.fn().mockImplementation(() => builder),
              then: (resolve: (val: unknown) => unknown) => {
                const rowArr = Array.isArray(rows) ? rows : [rows];
                tableData[table]?.push(...rowArr);
                return Promise.resolve({ data: rows, error: null }).then(resolve);
              },
            };
            return builder;
          }),
          update: jest.fn().mockImplementation(() => {
            const builder = {
              eq: jest.fn().mockImplementation(() => builder),
              throwOnError: jest.fn().mockImplementation(() => builder),
              then: (resolve: (val: unknown) => unknown) =>
                Promise.resolve({ data: null, error: null }).then(resolve),
            };
            return builder;
          }),
          delete: jest.fn().mockImplementation(() => {
            const builder = {
              eq: jest.fn().mockImplementation(() => builder),
              throwOnError: jest.fn().mockImplementation(() => builder),
              then: (resolve: (val: unknown) => unknown) =>
                Promise.resolve({ data: null, error: null }).then(resolve),
            };
            return builder;
          }),
          upsert: jest.fn().mockImplementation((rows: unknown) => {
            const builder = {
              throwOnError: jest.fn().mockImplementation(() => builder),
              then: (resolve: (val: unknown) => unknown) =>
                Promise.resolve({ data: rows, error: null }).then(resolve),
            };
            return builder;
          }),
        };
      }
      return handlers[table];
    };

    mockChannel = {
      on: jest.fn().mockImplementation((_event: string, _filter: unknown, cb: (payload: unknown) => void) => {
        realtimeCallback = cb;
        return mockChannel;
      }),
      subscribe: jest.fn().mockImplementation(() => mockChannel),
      unsubscribe: jest.fn().mockImplementation(() => Promise.resolve('ok')),
    };

    mockClient = fromPartial<SupabaseClient>({
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
      channel: jest.fn().mockImplementation((_name: string) => mockChannel as unknown as RealtimeChannel),
      removeChannel: jest.fn().mockImplementation((_ch: unknown) => Promise.resolve('ok')),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('subscribes to postgres_changes on schema public filtered by user_id upon initializeAsync()', async () => {
    const repo = new SupabaseLedgerRepository(mockClient);
    await repo.initializeAsync();

    expect(mockClient.channel).toHaveBeenCalledWith('user-ledger-test-user-uuid');
    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        filter: 'user_id=eq.test-user-uuid',
      },
      expect.any(Function)
    );
    expect(mockChannel.subscribe).toHaveBeenCalled();
  });

  describe('SCEN-014: Remote Mutation Synchronization & 200ms Coalesced Debounce', () => {
    it('debounces incoming remote events by 200ms before re-hydrating the ledger', async () => {
      const repo = new SupabaseLedgerRepository(mockClient);
      await repo.initializeAsync();

      const listener = jest.fn();
      repo.subscribe(listener);

      // Mutate remote table data to simulate changes performed by a different client
      tableData.categories = [
        {
          id: 'cat-rent',
          user_id: 'test-user-uuid',
          group_id: 'grp-bills',
          name: 'Rent',
          target_cents: 80000,
          target_type: 'MONTHLY_SET_ASIDE',
          target_due_day: 1,
          assigned_cents: 50000,
          available_cents: 50000,
          is_credit_payment: false,
          unfunded_debt_cents: 0,
          sort_order: 1,
        },
      ];

      // Reset mock call counters after initial hydration
      (mockClient.from as jest.Mock).mockClear();
      listener.mockClear();

      // Trigger incoming remote event
      expect(realtimeCallback).toBeDefined();
      realtimeCallback!({ table: 'categories', eventType: 'UPDATE' });

      // At t = 0ms and t = 100ms, re-hydration must NOT have fired yet
      expect(mockClient.from).not.toHaveBeenCalled();
      expect(listener).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(mockClient.from).not.toHaveBeenCalled();
      expect(listener).not.toHaveBeenCalled();

      // At t = 200ms, debounce expires and re-hydration triggers
      jest.advanceTimersByTime(100);

      // Allow the async re-hydration promises to resolve
      await flushPromises();

      expect(mockClient.from).toHaveBeenCalledWith('categories');
      expect(repo.getBudgetState().categories['cat-rent'].assignedCents).toBe(50000);
      expect(listener).toHaveBeenCalled();
    });

    it('coalesces rapid burst events into exactly ONE re-hydration after 200ms quiet window', async () => {
      const repo = new SupabaseLedgerRepository(mockClient);
      await repo.initializeAsync();

      (mockClient.from as jest.Mock).mockClear();

      // Dispatch 5 rapid events spaced 40ms apart (total elapsed 160ms)
      for (let i = 0; i < 5; i++) {
        realtimeCallback!({ table: 'transactions', eventType: 'INSERT' });
        jest.advanceTimersByTime(40);
        expect(mockClient.from).not.toHaveBeenCalled();
      }

      // 100ms after the last event (total 260ms, but only 100ms since last event): still debouncing
      jest.advanceTimersByTime(100);
      expect(mockClient.from).not.toHaveBeenCalled();

      // Another 100ms (200ms since 5th event): re-hydration fires exactly once
      jest.advanceTimersByTime(100);
      await flushPromises();

      expect(mockClient.from).toHaveBeenCalledTimes(5); // 5 tables fetched once: accounts, category_groups, categories, transactions, metadata
    });
  });

  describe('SCEN-015: Local Mutation Echo Suppression', () => {
    it('suppresses websocket loopback echo from local optimistic writes without re-hydrating', async () => {
      const repo = new SupabaseLedgerRepository(mockClient);
      await repo.initializeAsync();

      (mockClient.from as jest.Mock).mockClear();

      // Execute a local optimistic mutation
      repo.postOutflow({
        id: 'tx-local-1',
        accountId: 'acc-checking',
        categoryId: 'cat-rent',
        amountCents: 2500,
        payee: 'Landlord',
      });

      // Clear mock calls from the optimistic write
      (mockClient.from as jest.Mock).mockClear();

      // Simulate incoming loopback echo from the transaction INSERT
      realtimeCallback!({ table: 'transactions', eventType: 'INSERT' });

      // Advance timers by 500ms
      jest.advanceTimersByTime(500);
      await flushPromises();

      // No re-hydration should have occurred because activeWriteCount suppressed the echo
      expect(mockClient.from).not.toHaveBeenCalled();
    });

    it('safely decrements activeWriteCount when a remote write fails so future remote events are not blocked', async () => {
      // Mock insert failure
      handlers['transactions'] = {
        select: jest.fn().mockImplementation(() => ({
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
          then: (resolve: (val: unknown) => unknown) =>
            Promise.resolve({ data: [], error: null }).then(resolve),
        })),
        insert: jest.fn().mockImplementation(() => {
          const promise = Promise.reject(new Error('Network offline'));
          return {
            throwOnError: jest.fn().mockReturnThis(),
            then: (resolve: unknown, reject: unknown) =>
              promise.then(resolve as (val: unknown) => unknown, reject as (err: unknown) => unknown),
          };
        }),
        update: jest.fn().mockImplementation(() => ({
          eq: jest.fn().mockReturnThis(),
          throwOnError: jest.fn().mockReturnThis(),
          then: (resolve: (val: unknown) => unknown) =>
            Promise.resolve({ data: null, error: null }).then(resolve),
        })),
        delete: jest.fn(),
        upsert: jest.fn(),
      };

      const repo = new SupabaseLedgerRepository(mockClient);
      await repo.initializeAsync();

      // Post outflow that will reject remotely
      repo.postOutflow({
        id: 'tx-fail-1',
        accountId: 'acc-checking',
        categoryId: 'cat-rent',
        amountCents: 1000,
        payee: 'Store',
      });

      // Allow the remote rejection to settle
      await flushPromises();

      (mockClient.from as jest.Mock).mockClear();

      // Subsequent remote event from another device should NOT be suppressed
      realtimeCallback!({ table: 'accounts', eventType: 'UPDATE' });
      jest.advanceTimersByTime(200);
      await flushPromises();

      expect(mockClient.from).toHaveBeenCalledWith('accounts');
    });
  });

  describe('Lifecycle & Channel Teardown', () => {
    it('unsubscribes channel and cancels pending debounce timers on dispose()', async () => {
      const repo = new SupabaseLedgerRepository(mockClient);
      await repo.initializeAsync();

      (mockClient.from as jest.Mock).mockClear();

      // Schedule a debounce timer
      realtimeCallback!({ table: 'metadata', eventType: 'UPDATE' });

      // Dispose repository before debounce expires
      repo.dispose();

      expect(mockClient.removeChannel).toHaveBeenCalledWith(mockChannel);

      // Fast-forward past 200ms
      jest.advanceTimersByTime(500);
      await flushPromises();

      // No re-hydration triggered after disposal
      expect(mockClient.from).not.toHaveBeenCalled();
    });
  });
});
