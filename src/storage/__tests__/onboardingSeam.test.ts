import { describe, it, expect, beforeEach } from '@jest/globals';
import { SupabaseLedgerRepository } from '../supabase/supabaseLedgerRepository';
import { SQLiteLedgerRepository } from '../ledgerRepository';
import { createCleanTestDatabase } from '../testDatabase';
import { DatabaseAdapter, LedgerRepository } from '../types';
import { ValidatedOnboardingConfig } from '../../domain/onboarding/types';
import { getArchetypeTemplate } from '../../domain/onboarding/archetypes';
import { fromPartial } from '@total-typescript/shoehorn';
import { SupabaseClient } from '@supabase/supabase-js';

function createMockSupabaseForOnboarding() {
  const tableData: Record<string, unknown[]> = {
    metadata: [],
    accounts: [],
    category_groups: [],
    categories: [],
    transactions: [],
  };

  const client = {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-uuid' } },
        error: null,
      }),
      getSession: jest.fn().mockResolvedValue({
        data: { session: { user: { id: 'test-user-uuid' } } },
        error: null,
      }),
    },
    from: jest.fn().mockImplementation((table: string) => {
      const builder: Record<string, unknown> = {};
      builder.select = jest.fn().mockImplementation(() => {
        return Promise.resolve({ data: tableData[table] ?? [], error: null });
      });
      builder.insert = jest.fn().mockImplementation((rows: unknown) => {
        const rowArr = Array.isArray(rows) ? rows : [rows];
        tableData[table]?.push(...rowArr);
        const chain = {
          throwOnError: jest.fn().mockImplementation(() => chain),
          then: (resolve: (val: unknown) => unknown) =>
            Promise.resolve({ data: rows, error: null }).then(resolve),
        };
        return chain;
      });
      builder.upsert = jest.fn().mockImplementation((rows: unknown) => {
        const rowArr = Array.isArray(rows) ? rows : [rows];
        tableData[table]?.push(...rowArr);
        const chain = {
          throwOnError: jest.fn().mockImplementation(() => chain),
          then: (resolve: (val: unknown) => unknown) =>
            Promise.resolve({ data: rows, error: null }).then(resolve),
        };
        return chain;
      });
      builder.delete = jest.fn().mockImplementation(() => {
        tableData[table] = [];
        const chain = {
          eq: jest.fn().mockImplementation(() => chain),
          throwOnError: jest.fn().mockImplementation(() => chain),
          then: (resolve: (val: unknown) => unknown) =>
            Promise.resolve({ data: [], error: null }).then(resolve),
        };
        return chain;
      });
      return builder;
    }),
  };

  return { client: fromPartial<SupabaseClient>(client), tableData };
}

describe('Onboarding Storage Seam (Ticket 02 / SCEN-010, SCEN-011)', () => {
  const template = getArchetypeTemplate('STANDARD_BALANCED');

  const baseConfig: ValidatedOnboardingConfig = {
    depositoryAccount: {
      id: 'acc-checking-1',
      name: 'Primary Checking',
      startingBalanceCents: 200000, // $2,000.00
    },
    creditCardAccount: {
      id: 'acc-cc-1',
      name: 'Chase Sapphire',
      startingDebtCents: 50000, // $500.00 debt
    },
    template,
    allocations: {
      'cat-groceries': 60000, // $600.00
      'cat-rent': 140000, // $1,400.00
    },
    remainingReadyToAssignCents: 0,
  };

  describe('SCEN-010: Web Onboarding Commitment & Hydration on SupabaseLedgerRepository', () => {
    it('commits onboarding config optimistically and sets onboarding completed on SupabaseLedgerRepository', async () => {
      const { client, tableData } = createMockSupabaseForOnboarding();
      const repo = new SupabaseLedgerRepository(client);
      await repo.initializeAsync();

      expect(repo.isOnboardingCompleted()).toBe(false);

      // Execute commitment
      repo.commitOnboardingConfig(baseConfig);

      // In-memory cache must update immediately
      expect(repo.isOnboardingCompleted()).toBe(true);

      const state = repo.getBudgetState();
      expect(state.accounts['acc-checking-1']).toBeDefined();
      expect(state.accounts['acc-checking-1'].balanceCents).toBe(200000);
      expect(state.accounts['acc-cc-1']).toBeDefined();
      expect(state.accounts['acc-cc-1'].balanceCents).toBe(-50000);
      expect(state.readyToAssignCents).toBe(0);

      // Categories should be populated with allocations
      expect(state.categories['cat-groceries']).toBeDefined();
      expect(state.categories['cat-groceries'].assignedCents).toBe(60000);
      expect(state.categories['cat-groceries'].availableCents).toBe(60000);

      // Linked credit card payment category should exist
      expect(state.categories['cat-cc-payment']).toBeDefined();
      expect(state.categories['cat-cc-payment'].isCreditPayment).toBe(true);
      expect(state.categories['cat-cc-payment'].unfundedDebtCents).toBe(50000);

      // Allow background remote persistence promise to flush
      await new Promise((r) => setTimeout(r, 10));

      // Remote tables must have received rows
      expect(tableData.accounts.length).toBe(2);
      expect(tableData.categories.length).toBeGreaterThan(0);
      expect(tableData.category_groups.length).toBeGreaterThan(0);
      expect(tableData.metadata.some((m: unknown) => (m as { key: string; value: string }).key === 'onboarding_completed' && (m as { key: string; value: string }).value === 'true')).toBe(true);
    });
  });

  describe('SCEN-010: Onboarding Commitment on SQLiteLedgerRepository', () => {
    let db: DatabaseAdapter;

    beforeEach(() => {
      db = createCleanTestDatabase();
    });

    afterEach(() => {
      db?.closeSync?.();
    });

    it('commits onboarding config atomically on SQLiteLedgerRepository', () => {
      const repo = new SQLiteLedgerRepository(db);
      expect(repo.isOnboardingCompleted()).toBe(false);

      repo.commitOnboardingConfig(baseConfig);

      expect(repo.isOnboardingCompleted()).toBe(true);
      const state = repo.getBudgetState();
      expect(state.accounts['acc-checking-1'].name).toBe('Primary Checking');
      expect(state.accounts['acc-cc-1'].balanceCents).toBe(-50000);
      expect(state.categories['cat-groceries'].assignedCents).toBe(60000);
      expect(state.readyToAssignCents).toBe(0);
    });
  });

  describe('SCEN-011: Explore Demo via Repository Seam', () => {
    it('sets onboarding completed to true when seedDemoData is executed on SupabaseLedgerRepository', async () => {
      const { client } = createMockSupabaseForOnboarding();
      const repo = new SupabaseLedgerRepository(client);
      await repo.initializeAsync();

      expect(repo.isOnboardingCompleted()).toBe(false);

      repo.seedDemoData();

      expect(repo.isOnboardingCompleted()).toBe(true);
      const state = repo.getBudgetState();
      expect(Object.keys(state.accounts).length).toBeGreaterThan(0);
      expect(Object.keys(state.categories).length).toBeGreaterThan(0);
    });
  });
});
