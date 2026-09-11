import { describe, it, expect } from '@jest/globals';
import {
  buildAutoAssignPreview,
  getDonorCategories,
  getCategoryDeficit,
} from './budgetViewHelpers';
import { Category, CategoryGroup } from './types';
import { coverOverspending } from './overspendingCoverage';

describe('Modal Flows & Scenarios (SCEN-036, SCEN-037)', () => {
  const mockGroups: CategoryGroup[] = [
    { id: 'grp-immediate', name: 'Immediate Obligations', sortOrder: 1 },
    { id: 'grp-true', name: 'True Expenses', sortOrder: 2 },
    { id: 'grp-qol', name: 'Quality of Life', sortOrder: 3 },
  ];

  describe('SCEN-036: Auto-Assign Modal Preview & Allocation Confirmation', () => {
    it('exhausts available funds across prioritized bills and goals', () => {
      const categories: Record<string, Category> = {
        'cat-electric': {
          id: 'cat-electric',
          groupId: 'grp-immediate',
          name: 'Electric Bill',
          targetCents: 15000,
          assignedCents: 0,
          availableCents: 0,
          targetType: 'MONTHLY_SET_ASIDE',
          targetDueDay: 10,
        },
        'cat-rent': {
          id: 'cat-rent',
          groupId: 'grp-immediate',
          name: 'Rent',
          targetCents: 120000,
          assignedCents: 0,
          availableCents: 0,
          targetType: 'MONTHLY_SET_ASIDE',
          targetDueDay: 1,
        },
        'cat-fun': {
          id: 'cat-fun',
          groupId: 'grp-qol',
          name: 'Dining & Fun',
          targetCents: 30000,
          assignedCents: 0,
          availableCents: 0,
          targetType: 'NEEDED_FOR_SPENDING',
          targetDueDay: 25,
        },
      };

      const readyToAssignCents = 130000; // $1,300.00
      const preview = buildAutoAssignPreview(readyToAssignCents, categories, mockGroups);

      // Rent (due 1st) gets $1,200.00, Electric (due 10th) gets remaining $100.00
      expect(preview.totalAllocatedCents).toBe(130000);
      expect(preview.remainingReadyToAssignCents).toBe(0);
      expect(preview.items).toHaveLength(2);

      const rentItem = preview.items.find((item) => item.categoryId === 'cat-rent');
      expect(rentItem).toBeDefined();
      expect(rentItem?.allocatedCents).toBe(120000);
      expect(rentItem?.newAvailableCents).toBe(120000);

      const electricItem = preview.items.find((item) => item.categoryId === 'cat-electric');
      expect(electricItem).toBeDefined();
      expect(electricItem?.allocatedCents).toBe(10000); // gets remainder
      expect(electricItem?.newAvailableCents).toBe(10000);

      // Dining & Fun gets nothing because funds exhausted
      const funItem = preview.items.find((item) => item.categoryId === 'cat-fun');
      expect(funItem).toBeUndefined();
    });

    it('prioritizes restoring cash-overspent categories to zero before bills', () => {
      const categories: Record<string, Category> = {
        'cat-overspent': {
          id: 'cat-overspent',
          groupId: 'grp-qol',
          name: 'Restaurants',
          targetCents: 20000,
          assignedCents: 0,
          availableCents: -5000, // -$50.00 overspent
        },
        'cat-rent': {
          id: 'cat-rent',
          groupId: 'grp-immediate',
          name: 'Rent',
          targetCents: 100000,
          assignedCents: 0,
          availableCents: 0,
          targetType: 'MONTHLY_SET_ASIDE',
          targetDueDay: 1,
        },
      };

      const preview = buildAutoAssignPreview(30000, categories, mockGroups);

      // Overspent gets $50.00 first (restoring to $0.00)
      const overspentItem = preview.items.find((item) => item.categoryId === 'cat-overspent');
      expect(overspentItem).toBeDefined();
      expect(overspentItem?.allocatedCents).toBe(5000);
      expect(overspentItem?.newAvailableCents).toBe(0);

      // Rent gets remaining $250.00
      const rentItem = preview.items.find((item) => item.categoryId === 'cat-rent');
      expect(rentItem).toBeDefined();
      expect(rentItem?.allocatedCents).toBe(25000);
      expect(rentItem?.newAvailableCents).toBe(25000);
    });
  });

  describe('SCEN-037: Interactive Overspending Modal Coverage Flow', () => {
    it('filters only donor categories with positive balances and excludes overspent category', () => {
      const categories: Record<string, Category> = {
        'cat-target': {
          id: 'cat-target',
          groupId: 'grp-qol',
          name: 'Coffee',
          targetCents: 5000,
          assignedCents: 0,
          availableCents: -1500, // -$15.00
        },
        'cat-donor-1': {
          id: 'cat-donor-1',
          groupId: 'grp-immediate',
          name: 'Groceries',
          targetCents: 50000,
          assignedCents: 50000,
          availableCents: 25000, // $250.00 available
        },
        'cat-donor-2': {
          id: 'cat-donor-2',
          groupId: 'grp-true',
          name: 'Auto Maintenance',
          targetCents: 30000,
          assignedCents: 30000,
          availableCents: 10000, // $100.00 available
        },
        'cat-depleted': {
          id: 'cat-depleted',
          groupId: 'grp-qol',
          name: 'Books',
          targetCents: 2000,
          assignedCents: 2000,
          availableCents: 0,
        },
        'cat-cc-payment': {
          id: 'cat-cc-payment',
          groupId: 'grp-immediate',
          name: 'Credit Card Payment',
          targetCents: 0,
          assignedCents: 0,
          availableCents: 50000,
          isCreditPayment: true,
        },
      };

      const deficit = getCategoryDeficit(categories['cat-target']);
      expect(deficit.deficitCents).toBe(1500);
      expect(deficit.isCreditDebt).toBe(false);

      const donors = getDonorCategories('cat-target', categories, mockGroups);
      expect(donors).toHaveLength(2);
      expect(donors.map((d) => d.id)).toEqual(['cat-donor-1', 'cat-donor-2']);

      // Execute atomic rebalancing
      const result = coverOverspending({
        state: {
          categories,
          readyToAssignCents: 0,
          accounts: {},
          transactions: [],
          totalOutflowCents: 0,
          totalInflowCents: 0,
        },
        targetCategoryId: 'cat-target',
        sourceCategoryId: 'cat-donor-1',
        amountCents: deficit.deficitCents,
      });

      expect(result.coveredCents).toBe(1500);
      expect(result.state.categories['cat-target'].availableCents).toBe(0);
      expect(result.state.categories['cat-donor-1'].availableCents).toBe(23500);
      expect(result.state.readyToAssignCents).toBe(0);
    });

    it('covers credit card unfunded debt and increments credit card payment reserve', () => {
      const categories: Record<string, Category> = {
        'cat-debt': {
          id: 'cat-debt',
          groupId: 'grp-qol',
          name: 'Tech Gadgets',
          targetCents: 0,
          assignedCents: 0,
          availableCents: 0,
          unfundedDebtCents: 8500, // $85.00 credit debt
        },
        'cat-emergency': {
          id: 'cat-emergency',
          groupId: 'grp-immediate',
          name: 'Emergency Fund',
          targetCents: 100000,
          assignedCents: 100000,
          availableCents: 50000,
        },
        'cat-cc': {
          id: 'cat-cc',
          groupId: 'grp-immediate',
          name: 'Apple Card Payment',
          targetCents: 0,
          assignedCents: 0,
          availableCents: 10000,
          isCreditPayment: true,
        },
      };

      const deficit = getCategoryDeficit(categories['cat-debt']);
      expect(deficit.deficitCents).toBe(8500);
      expect(deficit.isCreditDebt).toBe(true);

      const result = coverOverspending({
        state: {
          categories,
          readyToAssignCents: 0,
          accounts: {},
          transactions: [],
          totalOutflowCents: 0,
          totalInflowCents: 0,
        },
        targetCategoryId: 'cat-debt',
        sourceCategoryId: 'cat-emergency',
        amountCents: 8500,
        creditPaymentCategoryId: 'cat-cc',
      });

      expect(result.isCreditDebtCovered).toBe(true);
      expect(result.state.categories['cat-debt'].unfundedDebtCents).toBe(0);
      expect(result.state.categories['cat-emergency'].availableCents).toBe(41500);
      expect(result.state.categories['cat-cc'].availableCents).toBe(18500); // 10000 + 8500
    });
  });
});
