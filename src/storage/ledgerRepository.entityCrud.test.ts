import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createTestDatabase } from './testDatabase';
import { SQLiteLedgerRepository } from './ledgerRepository';
import { DatabaseAdapter, EntityIntegrityError, ProtectedEntityError } from './types';

describe('Repository Entity Management CRUD & Integrity Guards (Ticket 01)', () => {
  let db: DatabaseAdapter;
  let repo: SQLiteLedgerRepository;

  beforeEach(() => {
    db = createTestDatabase();
    repo = new SQLiteLedgerRepository(db);
  });

  afterEach(() => {
    db.closeSync?.();
  });

  describe('Account Management (SCEN-002 to SCEN-006)', () => {
    it('SCEN-002: creates depository account and credits readyToAssign pool', () => {
      const initialRta = repo.getBudgetState().readyToAssignCents;

      const account = repo.createAccount({
        name: 'High Yield Savings',
        accountType: 'savings',
        balanceCents: 150000, // $1,500.00
      });

      expect(account.id).toBeDefined();
      expect(account.name).toBe('High Yield Savings');
      expect(account.accountType).toBe('savings');
      expect(account.balanceCents).toBe(150000);

      const state = repo.getBudgetState();
      expect(state.accounts[account.id]).toBeDefined();
      expect(state.accounts[account.id].balanceCents).toBe(150000);
      expect(state.readyToAssignCents).toBe(initialRta + 150000);
    });

    it('SCEN-003: creates credit card account and auto-provisions linked payment category', () => {
      const account = repo.createAccount({
        name: 'Chase Sapphire',
        accountType: 'credit',
        balanceCents: -45000, // -$450.00 debt
      });

      expect(account.accountType).toBe('credit');
      expect(account.creditPaymentCategoryId).toBeDefined();

      const state = repo.getBudgetState();
      const paymentCat = state.categories[account.creditPaymentCategoryId!];
      expect(paymentCat).toBeDefined();
      expect(paymentCat.isCreditPayment).toBe(true);
      expect(paymentCat.name).toBe('Chase Sapphire Payment');
      expect(paymentCat.unfundedDebtCents).toBe(45000);
    });

    it('SCEN-004: updates account name and balance', () => {
      const account = repo.createAccount({
        name: 'Emergency Fund',
        accountType: 'savings',
        balanceCents: 50000,
      });

      const updated = repo.updateAccount({
        id: account.id,
        name: 'Primary Emergency Fund',
        balanceCents: 75000,
      });

      expect(updated.name).toBe('Primary Emergency Fund');
      expect(updated.balanceCents).toBe(75000);

      const state = repo.getBudgetState();
      expect(state.accounts[account.id].name).toBe('Primary Emergency Fund');
      expect(state.accounts[account.id].balanceCents).toBe(75000);
    });

    it('SCEN-005: blocks deletion of account with existing transactions', () => {
      const account = repo.createAccount({
        name: 'Active Checking',
        accountType: 'checking',
        balanceCents: 10000,
      });

      repo.postOutflow({
        id: 'tx-guard-acc',
        accountId: account.id,
        categoryId: 'cat-groceries',
        amountCents: 2500,
        payee: 'Supermarket',
      });

      expect(() => {
        repo.deleteAccount(account.id);
      }).toThrow(EntityIntegrityError);

      // Verify account was NOT deleted
      expect(repo.getBudgetState().accounts[account.id]).toBeDefined();
    });

    it('SCEN-006: deletes empty account with zero transactions and cleans up linked credit category', () => {
      const ccAccount = repo.createAccount({
        name: 'Unused Card',
        accountType: 'credit',
        balanceCents: 0,
      });

      const paymentCatId = ccAccount.creditPaymentCategoryId!;
      expect(repo.getBudgetState().categories[paymentCatId]).toBeDefined();

      repo.deleteAccount(ccAccount.id);

      const state = repo.getBudgetState();
      expect(state.accounts[ccAccount.id]).toBeUndefined();
      expect(state.categories[paymentCatId]).toBeUndefined();
    });
  });

  describe('Category Group Management (SCEN-007 to SCEN-010)', () => {
    it('SCEN-007: creates category group with auto-incremented sort order', () => {
      const groupsBefore = repo.getCategoryGroups();
      const maxSortBefore = Math.max(...groupsBefore.map((g) => g.sortOrder), -1);

      const newGroup = repo.createCategoryGroup({
        name: 'Subscriptions & Memberships',
      });

      expect(newGroup.id).toBeDefined();
      expect(newGroup.name).toBe('Subscriptions & Memberships');
      expect(newGroup.sortOrder).toBe(maxSortBefore + 1);

      const groupsAfter = repo.getCategoryGroups();
      expect(groupsAfter.find((g) => g.id === newGroup.id)).toBeDefined();
    });

    it('SCEN-008: updates category group name', () => {
      const group = repo.createCategoryGroup({ name: 'Old Group Name' });

      const updated = repo.updateCategoryGroup({
        id: group.id,
        name: 'Refined Group Name',
      });

      expect(updated.name).toBe('Refined Group Name');

      const found = repo.getCategoryGroups().find((g) => g.id === group.id);
      expect(found?.name).toBe('Refined Group Name');
    });

    it('SCEN-009: blocks deletion of category group containing child categories', () => {
      const group = repo.createCategoryGroup({ name: 'Parent Group' });
      repo.createCategory({
        groupId: group.id,
        name: 'Child Category',
        targetCents: 1000,
      });

      expect(() => {
        repo.deleteCategoryGroup(group.id);
      }).toThrow(EntityIntegrityError);

      expect(repo.getCategoryGroups().find((g) => g.id === group.id)).toBeDefined();
    });

    it('SCEN-010: deletes empty category group', () => {
      const group = repo.createCategoryGroup({ name: 'Empty Disposable Group' });

      repo.deleteCategoryGroup(group.id);

      expect(repo.getCategoryGroups().find((g) => g.id === group.id)).toBeUndefined();
    });
  });

  describe('Category Management (SCEN-011 to SCEN-015)', () => {
    it('SCEN-011: creates category with target configuration', () => {
      const group = repo.createCategoryGroup({ name: 'Fixed Expenses' });

      const cat = repo.createCategory({
        groupId: group.id,
        name: 'High-Speed Internet',
        targetCents: 8500,
        targetType: 'MONTHLY_SET_ASIDE',
        targetDueDay: 20,
      });

      expect(cat.id).toBeDefined();
      expect(cat.name).toBe('High-Speed Internet');
      expect(cat.groupId).toBe(group.id);
      expect(cat.targetCents).toBe(8500);
      expect(cat.targetType).toBe('MONTHLY_SET_ASIDE');
      expect(cat.targetDueDay).toBe(20);
      expect(cat.assignedCents).toBe(0);
      expect(cat.availableCents).toBe(0);

      const state = repo.getBudgetState();
      expect(state.categories[cat.id]).toBeDefined();
    });

    it('SCEN-012: updates category attributes and reassigns parent group', () => {
      const g1 = repo.createCategoryGroup({ name: 'Group 1' });
      const g2 = repo.createCategoryGroup({ name: 'Group 2' });

      const cat = repo.createCategory({
        groupId: g1.id,
        name: 'Cell Phone',
        targetCents: 5000,
      });

      const updated = repo.updateCategory({
        id: cat.id,
        groupId: g2.id,
        name: 'Mobile Phone Plan',
        targetCents: 6500,
        targetType: 'NEEDED_FOR_SPENDING',
        targetDueDay: 15,
      });

      expect(updated.name).toBe('Mobile Phone Plan');
      expect(updated.groupId).toBe(g2.id);
      expect(updated.targetCents).toBe(6500);
      expect(updated.targetDueDay).toBe(15);

      const state = repo.getBudgetState();
      expect(state.categories[cat.id].name).toBe('Mobile Phone Plan');
      expect(state.categories[cat.id].groupId).toBe(g2.id);
    });

    it('SCEN-013: prevents direct deletion of credit payment category', () => {
      const ccAcc = repo.createAccount({
        name: 'Gold Card',
        accountType: 'credit',
        balanceCents: 0,
      });

      const paymentCatId = ccAcc.creditPaymentCategoryId!;

      expect(() => {
        repo.deleteCategory(paymentCatId);
      }).toThrow(ProtectedEntityError);
    });

    it('SCEN-014: prevents deletion of category with available balance or transactions', () => {
      const group = repo.createCategoryGroup({ name: 'Discretionary' });
      const cat = repo.createCategory({
        groupId: group.id,
        name: 'Books',
        targetCents: 2000,
      });

      // 1. Available balance > 0 check
      db.runSync('UPDATE categories SET available_cents = 2000 WHERE id = ?', cat.id);

      expect(() => {
        repo.deleteCategory(cat.id);
      }).toThrow(EntityIntegrityError);

      // Reset balance to 0 and add transaction
      db.runSync('UPDATE categories SET available_cents = 0 WHERE id = ?', cat.id);
      repo.postOutflow({
        id: 'tx-cat-guard',
        accountId: 'acc-checking',
        categoryId: cat.id,
        amountCents: 1500,
        payee: 'Bookstore',
      });

      expect(() => {
        repo.deleteCategory(cat.id);
      }).toThrow(EntityIntegrityError);
    });

    it('SCEN-015: deletes empty category with zero balance and zero transactions', () => {
      const group = repo.createCategoryGroup({ name: 'Hobbies' });
      const cat = repo.createCategory({
        groupId: group.id,
        name: 'Pottery',
        targetCents: 0,
      });

      repo.deleteCategory(cat.id);

      expect(repo.getBudgetState().categories[cat.id]).toBeUndefined();
    });
  });
});
