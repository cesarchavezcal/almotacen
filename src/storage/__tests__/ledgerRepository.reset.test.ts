import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createTestDatabase } from '../testDatabase';
import { SQLiteLedgerRepository } from '../ledgerRepository';
import { DatabaseAdapter, DiagnosticsData } from '../types';
import { isOnboardingCompleted } from '../schema';

describe('Data Reset & Diagnostics Engine (Ticket 02)', () => {
  let db: DatabaseAdapter;
  let repo: SQLiteLedgerRepository;

  beforeEach(() => {
    db = createTestDatabase();
    repo = new SQLiteLedgerRepository(db);
  });

  afterEach(() => {
    db.closeSync?.();
  });

  describe('SCEN-016: Factory Reset', () => {
    it('wipes all entities, zeroes Ready to Assign, and unsets onboarding_completed', () => {
      // Baseline test database has demo data
      expect(Object.keys(repo.getBudgetState().accounts).length).toBeGreaterThan(0);
      expect(isOnboardingCompleted(db)).toBe(true);

      repo.factoryReset();

      const state = repo.getBudgetState();
      expect(Object.keys(state.accounts)).toHaveLength(0);
      expect(Object.keys(state.categories)).toHaveLength(0);
      expect(repo.getCategoryGroups()).toHaveLength(0);
      expect(state.readyToAssignCents).toBe(0);
      expect(isOnboardingCompleted(db)).toBe(false);

      const diag = repo.getDiagnostics();
      expect(diag.accountCount).toBe(0);
      expect(diag.categoryGroupCount).toBe(0);
      expect(diag.categoryCount).toBe(0);
      expect(diag.transactionCount).toBe(0);
      expect(diag.schemaVersion).toBe(2);
    });
  });

  describe('SCEN-017: Seed Demo Data', () => {
    it('atomically populates starter archetype data and sets onboarding_completed to true', () => {
      repo.factoryReset();
      expect(isOnboardingCompleted(db)).toBe(false);

      repo.seedDemoData();

      const state = repo.getBudgetState();
      expect(Object.keys(state.accounts).length).toBeGreaterThan(0);
      expect(Object.keys(state.categories).length).toBeGreaterThan(0);
      expect(repo.getCategoryGroups().length).toBeGreaterThan(0);
      expect(state.readyToAssignCents).toBeGreaterThan(0);
      expect(isOnboardingCompleted(db)).toBe(true);
    });
  });

  describe('SCEN-018: System Diagnostics', () => {
    it('returns exact entity row counts and schema version', () => {
      repo.factoryReset();

      const acc1 = repo.createAccount({ name: 'Checking', accountType: 'checking', balanceCents: 50000 });
      const acc2 = repo.createAccount({ name: 'Savings', accountType: 'savings', balanceCents: 100000 });
      const group1 = repo.createCategoryGroup({ name: 'Housing' });
      const group2 = repo.createCategoryGroup({ name: 'Food' });
      const cat1 = repo.createCategory({ groupId: group1.id, name: 'Rent', targetCents: 120000 });
      const cat2 = repo.createCategory({ groupId: group2.id, name: 'Groceries', targetCents: 40000 });

      repo.postOutflow({
        id: 'tx-supermarket',
        accountId: acc1.id,
        categoryId: cat2.id,
        amountCents: 2500,
        payee: 'Supermarket',
      });

      const diagnostics: DiagnosticsData = repo.getDiagnostics();

      expect(diagnostics.schemaVersion).toBe(2);
      expect(diagnostics.accountCount).toBe(2);
      expect(diagnostics.categoryGroupCount).toBe(2);
      expect(diagnostics.categoryCount).toBe(2);
      expect(diagnostics.transactionCount).toBe(1);
    });
  });

  describe('SCEN-019: Clear Transactions Only (Zero-Base Re-Anchor)', () => {
    it('clears transactions, zeroes envelope balances, preserves accounts, and re-anchors Ready to Assign', () => {
      repo.factoryReset();

      // Setup 2 depository accounts + 1 credit card account
      const checking = repo.createAccount({ name: 'Checking', accountType: 'checking', balanceCents: 200000 }); // $2,000
      const savings = repo.createAccount({ name: 'Savings', accountType: 'savings', balanceCents: 300000 });   // $3,000
      const credit = repo.createAccount({ name: 'Credit Card', accountType: 'credit', balanceCents: 50000 });   // $500 debt

      const group = repo.createCategoryGroup({ name: 'Living' });
      const cat = repo.createCategory({ groupId: group.id, name: 'Utilities', targetCents: 15000 });

      // Allocate funds to envelope
      repo.allocateEnvelope({ categoryId: cat.id, amountCents: 15000 });

      // Post transactions
      repo.postOutflow({
        id: 'tx-electric',
        accountId: checking.id,
        categoryId: cat.id,
        amountCents: 5000,
        payee: 'Electric Co',
      });

      // Verify pre-reset state
      const preState = repo.getBudgetState();
      expect(preState.categories[cat.id].assignedCents).toBe(15000);
      expect(preState.categories[cat.id].availableCents).toBe(10000);
      expect(repo.getDiagnostics().transactionCount).toBe(1);

      // Execute Zero-Base Re-Anchor
      repo.clearTransactionsOnly();

      // Verify post-reset state
      const postState = repo.getBudgetState();

      // 1. Transactions cleared
      expect(repo.getDiagnostics().transactionCount).toBe(0);

      // 2. Accounts and balances preserved (checking had 200000 - 5000 = 195000)
      expect(postState.accounts[checking.id].balanceCents).toBe(195000);
      expect(postState.accounts[savings.id].balanceCents).toBe(300000);
      expect(postState.accounts[credit.id].balanceCents).toBe(50000);

      // 3. Envelopes zeroed out
      expect(postState.categories[cat.id].assignedCents).toBe(0);
      expect(postState.categories[cat.id].availableCents).toBe(0);
      expect(postState.categories[cat.id].unfundedDebtCents).toBe(0);

      // 4. Ready to Assign re-anchored to sum of positive depository accounts (195000 + 300000 = 495000)
      expect(postState.readyToAssignCents).toBe(495000);

      // 5. Onboarding status preserved
      expect(isOnboardingCompleted(db)).toBe(true);
    });
  });
});
