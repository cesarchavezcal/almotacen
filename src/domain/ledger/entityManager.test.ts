import { describe, it, expect } from '@jest/globals';
import { EntityManager } from './entityManager';
import { Account, Category } from './types';
import { EntityIntegrityError, ProtectedEntityError, ValidationError } from './errors';

describe('EntityManager Domain Engine (Ticket 01 / SCEN-060, SCEN-061, SCEN-062)', () => {
  describe('Failure-First Enumeration & Invariant Guards (SCEN-060, SCEN-062)', () => {
    it('SCEN-060: blocks account deletion when transactions exist', () => {
      const account: Account = {
        id: 'acc-checking-1',
        name: 'Primary Checking',
        accountType: 'checking',
        balanceCents: 150000,
      };

      expect(() =>
        EntityManager.planAccountDeletion({
          account,
          transactionCount: 3,
        })
      ).toThrow(EntityIntegrityError);

      expect(() =>
        EntityManager.planAccountDeletion({
          account,
          transactionCount: 3,
        })
      ).toThrow('Cannot delete account with existing transactions.');
    });

    it('SCEN-060: blocks category deletion when category has available funds (> 0)', () => {
      const category: Category = {
        id: 'cat-dining',
        groupId: 'grp-food',
        name: 'Dining Out',
        targetCents: 20000,
        assignedCents: 20000,
        availableCents: 5000,
      };

      expect(() =>
        EntityManager.planCategoryDeletion({
          category,
          transactionCount: 0,
        })
      ).toThrow(EntityIntegrityError);

      expect(() =>
        EntityManager.planCategoryDeletion({
          category,
          transactionCount: 0,
        })
      ).toThrow('Cannot delete category with available funds or active transactions.');
    });

    it('SCEN-060: blocks category deletion when category is overspent (< 0)', () => {
      const category: Category = {
        id: 'cat-groceries',
        groupId: 'grp-food',
        name: 'Groceries',
        targetCents: 40000,
        assignedCents: 10000,
        availableCents: -2500,
      };

      expect(() =>
        EntityManager.planCategoryDeletion({
          category,
          transactionCount: 0,
        })
      ).toThrow(EntityIntegrityError);
    });

    it('SCEN-060: blocks category deletion when category has active transactions', () => {
      const category: Category = {
        id: 'cat-utilities',
        groupId: 'grp-bills',
        name: 'Utilities',
        targetCents: 15000,
        assignedCents: 0,
        availableCents: 0,
      };

      expect(() =>
        EntityManager.planCategoryDeletion({
          category,
          transactionCount: 1,
        })
      ).toThrow(EntityIntegrityError);
    });

    it('SCEN-060: blocks direct deletion of protected credit card payment category', () => {
      const category: Category = {
        id: 'cat-cc-apple-card',
        groupId: 'grp-payments',
        name: 'Apple Card Payment',
        targetCents: 0,
        assignedCents: 0,
        availableCents: 0,
        isCreditPayment: true,
      };

      expect(() =>
        EntityManager.planCategoryDeletion({
          category,
          transactionCount: 0,
        })
      ).toThrow(ProtectedEntityError);

      expect(() =>
        EntityManager.planCategoryDeletion({
          category,
          transactionCount: 0,
        })
      ).toThrow('Credit payment categories cannot be deleted directly.');
    });

    it('SCEN-062: blocks category group deletion when child categories exist', () => {
      expect(() =>
        EntityManager.planCategoryGroupDeletion({
          groupId: 'grp-living',
          childCategoryCount: 4,
        })
      ).toThrow(EntityIntegrityError);

      expect(() =>
        EntityManager.planCategoryGroupDeletion({
          groupId: 'grp-living',
          childCategoryCount: 4,
        })
      ).toThrow('Cannot delete category group containing categories.');
    });

    it('blocks creation of account with blank name', () => {
      expect(() =>
        EntityManager.planAccountCreation({
          name: '   ',
          accountType: 'checking',
          balanceCents: 1000,
        })
      ).toThrow(ValidationError);
    });
  });

  describe('Happy-Path Plans & Cascades (SCEN-061, SCEN-062)', () => {
    it('SCEN-061: plans clean deletion for empty depository account', () => {
      const account: Account = {
        id: 'acc-savings',
        name: 'Emergency Savings',
        accountType: 'savings',
        balanceCents: 0,
      };

      const plan = EntityManager.planAccountDeletion({
        account,
        transactionCount: 0,
      });

      expect(plan.deleteAccountIds).toEqual(['acc-savings']);
      expect(plan.deleteCategoryIds).toEqual([]);
      expect(plan.readyToAssignAdjustmentCents).toBe(0);
    });

    it('SCEN-061: cascades deletion to linked credit payment category when balance and transactions are zero', () => {
      const account: Account = {
        id: 'acc-cc-1',
        name: 'Sapphire Preferred',
        accountType: 'credit',
        balanceCents: 0,
        creditPaymentCategoryId: 'cat-cc-acc-cc-1',
      };

      const linkedCategory: Category = {
        id: 'cat-cc-acc-cc-1',
        groupId: 'grp-payments',
        name: 'Sapphire Preferred Payment',
        targetCents: 0,
        assignedCents: 0,
        availableCents: 0,
        isCreditPayment: true,
      };

      const plan = EntityManager.planAccountDeletion({
        account,
        transactionCount: 0,
        linkedPaymentCategory: linkedCategory,
        linkedPaymentCategoryTransactionCount: 0,
      });

      expect(plan.deleteAccountIds).toEqual(['acc-cc-1']);
      expect(plan.deleteCategoryIds).toEqual(['cat-cc-acc-cc-1']);
    });

    it('SCEN-061: retains linked credit payment category if it has active transactions or non-zero balance', () => {
      const account: Account = {
        id: 'acc-cc-2',
        name: 'Apple Card',
        accountType: 'credit',
        balanceCents: 0,
        creditPaymentCategoryId: 'cat-cc-apple',
      };

      const linkedCategory: Category = {
        id: 'cat-cc-apple',
        groupId: 'grp-payments',
        name: 'Apple Card Payment',
        targetCents: 0,
        assignedCents: 0,
        availableCents: 1500, // Still has available payment funds!
        isCreditPayment: true,
      };

      const plan = EntityManager.planAccountDeletion({
        account,
        transactionCount: 0,
        linkedPaymentCategory: linkedCategory,
        linkedPaymentCategoryTransactionCount: 0,
      });

      expect(plan.deleteAccountIds).toEqual(['acc-cc-2']);
      expect(plan.deleteCategoryIds).toEqual([]); // Protected from cascade!
    });

    it('SCEN-062: plans deletion for empty category group', () => {
      const plan = EntityManager.planCategoryGroupDeletion({
        groupId: 'grp-empty',
        childCategoryCount: 0,
      });

      expect(plan.deleteCategoryGroupIds).toEqual(['grp-empty']);
    });

    it('plans creation of depository account with positive starting balance', () => {
      const plan = EntityManager.planAccountCreation({
        name: 'Checking Account',
        accountType: 'checking',
        balanceCents: 250000,
      });

      expect(plan.account.name).toBe('Checking Account');
      expect(plan.account.accountType).toBe('checking');
      expect(plan.account.balanceCents).toBe(250000);
      expect(plan.readyToAssignInflowCents).toBe(250000);
      expect(plan.linkedPaymentCategory).toBeUndefined();
    });

    it('plans creation of credit card account with negative debt and linked payment category', () => {
      const plan = EntityManager.planAccountCreation({
        id: 'card-1',
        name: 'Chase Freedom',
        accountType: 'credit',
        balanceCents: -50000, // -$500 debt input
      });

      expect(plan.account.name).toBe('Chase Freedom');
      expect(plan.account.accountType).toBe('credit');
      expect(plan.account.balanceCents).toBe(-50000); // Stored as negative cents
      expect(plan.readyToAssignInflowCents).toBe(0); // Credit debt does NOT credit RTA
      expect(plan.linkedPaymentCategory).toBeDefined();
      expect(plan.linkedPaymentCategory?.id).toBe('cat-cc-card-1');
      expect(plan.linkedPaymentCategory?.name).toBe('Chase Freedom Payment');
      expect(plan.linkedPaymentCategory?.isCreditPayment).toBe(true);
      expect(plan.linkedPaymentCategory?.unfundedDebtCents).toBe(50000);
      expect(plan.linkedCategoryGroup?.id).toBe('grp-payments');
    });
  });
});
