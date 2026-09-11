import { describe, it, expect } from '@jest/globals';
import {
  getEnvelopeBadge,
  getReadyToAssignBannerState,
  calculateQuickFillAllocation,
  buildBudgetDisplayGroups,
  calculateBudgetTotals,
  buildAutoAssignPreview,
  getDonorCategories,
  getCategoryDeficit,
} from './budgetViewHelpers';

describe('Budget View & Envelope Allocation Helpers (SCEN-005, SCEN-006, SCEN-014, SCEN-015)', () => {
  describe('getReadyToAssignBannerState (SCEN-005 & SCEN-006)', () => {
    it('returns positive state with success styling when readyToAssign > 0', () => {
      const state = getReadyToAssignBannerState(150000); // $1,500.00
      expect(state.status).toBe('positive');
      expect(state.badgeText).toBe('READY TO ASSIGN');
      expect(state.isOverAssigned).toBe(false);
    });

    it('returns zero state when readyToAssign is exactly 0', () => {
      const state = getReadyToAssignBannerState(0);
      expect(state.status).toBe('zero');
      expect(state.badgeText).toBe('ZERO-BASED');
      expect(state.isOverAssigned).toBe(false);
    });

    it('SCEN-006: returns negative/over-assigned warning state when readyToAssign < 0', () => {
      const state = getReadyToAssignBannerState(-5000); // -$50.00
      expect(state.status).toBe('overassigned');
      expect(state.badgeText).toBe('OVERASSIGNED');
      expect(state.isOverAssigned).toBe(true);
    });
  });

  describe('calculateQuickFillAllocation (SCEN-014)', () => {
    it('calculates +$50 increment', () => {
      const result = calculateQuickFillAllocation(10000, 20000, 'add_50');
      expect(result).toBe(15000); // $100 + $50 = $150
    });

    it('calculates +$100 increment', () => {
      const result = calculateQuickFillAllocation(10000, 20000, 'add_100');
      expect(result).toBe(20000); // $100 + $100 = $200
    });

    it('calculates -$50 decrement bounded at 0', () => {
      expect(calculateQuickFillAllocation(10000, 20000, 'sub_50')).toBe(5000);
      expect(calculateQuickFillAllocation(3000, 20000, 'sub_50')).toBe(0);
    });

    it('calculates fill_remaining: adds all positive unallocated cash to envelope', () => {
      const result = calculateQuickFillAllocation(10000, 45000, 'fill_remaining');
      expect(result).toBe(55000); // $100 + $450 = $550
    });

    it('fill_remaining does not add if readyToAssign is <= 0', () => {
      expect(calculateQuickFillAllocation(10000, 0, 'fill_remaining')).toBe(10000);
      expect(calculateQuickFillAllocation(10000, -5000, 'fill_remaining')).toBe(10000);
    });
  });

  describe('getEnvelopeBadge (SCEN-015: Dual-Axis Debt vs Cash Overspending)', () => {
    it('SCEN-015: returns amber CREDIT DEBT badge when category has unfunded debt', () => {
      const badge = getEnvelopeBadge({
        availableCents: 0,
        unfundedDebtCents: 4500, // $45.00 unfunded credit debt
      });
      expect(badge.type).toBe('credit_debt');
      expect(badge.label).toBe('CREDIT DEBT');
      expect(badge.isWarning).toBe(true);
    });

    it('SCEN-015: returns red CASH OVERSPENT badge when available cash is negative', () => {
      const badge = getEnvelopeBadge({
        availableCents: -2500, // -$25.00 cash overspent
        unfundedDebtCents: 0,
      });
      expect(badge.type).toBe('cash_overspent');
      expect(badge.label).toBe('CASH OVERSPENT');
      expect(badge.isError).toBe(true);
    });

    it('returns DEPLETED badge when available is zero and no debt', () => {
      const badge = getEnvelopeBadge({
        availableCents: 0,
        unfundedDebtCents: 0,
      });
      expect(badge.type).toBe('depleted');
      expect(badge.label).toBe('DEPLETED');
    });

    it('returns FUNDED badge when available is positive', () => {
      const badge = getEnvelopeBadge({
        availableCents: 15000,
        unfundedDebtCents: 0,
      });
      expect(badge.type).toBe('funded');
      expect(badge.label).toBe('FUNDED');
    });
  });

  describe('buildBudgetDisplayGroups & calculateBudgetTotals', () => {
    const mockCategories = {
      'cat-1': {
        id: 'cat-1',
        groupId: 'grp-1',
        name: 'Groceries',
        targetCents: 50000,
        assignedCents: 50000,
        availableCents: 35000,
      },
      'cat-2': {
        id: 'cat-2',
        groupId: 'grp-1',
        name: 'Rent',
        targetCents: 150000,
        assignedCents: 150000,
        availableCents: 150000,
      },
      'cat-cc': {
        id: 'cat-cc',
        groupId: 'grp-cc',
        name: 'Apple Card Payment',
        targetCents: 0,
        assignedCents: 0,
        availableCents: 4500,
        isCreditPayment: true,
      },
    };

    const mockGroups = [
      { id: 'grp-1', name: 'Immediate Obligations', sortOrder: 1 },
    ];

    it('calculates totals excluding internal credit payment envelopes', () => {
      const totals = calculateBudgetTotals(mockCategories);
      expect(totals.totalAssignedCents).toBe(200000); // 500 + 1500 = 2000
      expect(totals.totalAvailableCents).toBe(185000); // 350 + 1500 = 1850
    });

    it('builds display groups and unshifts credit reserve group', () => {
      const groups = buildBudgetDisplayGroups(mockCategories, mockGroups);
      expect(groups.length).toBe(2);
      expect(groups[0].id).toBe('group-credit-card-payments');
      expect(groups[0].items[0].name).toBe('Apple Card Payment');
      expect(groups[1].id).toBe('grp-1');
      expect(groups[1].items.length).toBe(2);
      expect(groups[1].items[0].activityCents).toBe(-15000); // 35000 - 50000 = -15000
    });
  });

  describe('buildAutoAssignPreview', () => {
    const mockCategories = {
      'cat-1': {
        id: 'cat-1',
        groupId: 'grp-1',
        name: 'Groceries',
        targetCents: 50000,
        assignedCents: 0,
        availableCents: 0,
        targetType: 'MONTHLY_SET_ASIDE' as const,
        targetDueDay: 5,
      },
      'cat-2': {
        id: 'cat-2',
        groupId: 'grp-1',
        name: 'Rent',
        targetCents: 150000,
        assignedCents: 0,
        availableCents: 0,
        targetType: 'MONTHLY_SET_ASIDE' as const,
        targetDueDay: 1,
      },
    };

    const mockGroups = [
      { id: 'grp-1', name: 'Immediate Obligations', sortOrder: 1 },
    ];

    it('generates preview items sorted by priority with new available balances', () => {
      const preview = buildAutoAssignPreview(100000, mockCategories, mockGroups);
      expect(preview.totalAllocatedCents).toBe(100000);
      expect(preview.remainingReadyToAssignCents).toBe(0);
      expect(preview.items.length).toBe(1);
      expect(preview.items[0].categoryName).toBe('Rent'); // earlier due day (1 < 5)
      expect(preview.items[0].allocatedCents).toBe(100000);
      expect(preview.items[0].newAvailableCents).toBe(100000);
    });

    it('returns empty items when readyToAssign is 0', () => {
      const preview = buildAutoAssignPreview(0, mockCategories, mockGroups);
      expect(preview.items).toHaveLength(0);
      expect(preview.totalAllocatedCents).toBe(0);
      expect(preview.remainingReadyToAssignCents).toBe(0);
    });
  });

  describe('getDonorCategories & getCategoryDeficit', () => {
    const mockCategories = {
      'cat-overspent': {
        id: 'cat-overspent',
        groupId: 'grp-1',
        name: 'Dining Out',
        targetCents: 10000,
        assignedCents: 10000,
        availableCents: -2500, // -$25.00 cash overspent
      },
      'cat-debt': {
        id: 'cat-debt',
        groupId: 'grp-1',
        name: 'Electronics',
        targetCents: 20000,
        assignedCents: 0,
        availableCents: 0,
        unfundedDebtCents: 5000, // $50.00 credit debt
      },
      'cat-donor-1': {
        id: 'cat-donor-1',
        groupId: 'grp-1',
        name: 'Groceries',
        targetCents: 50000,
        assignedCents: 50000,
        availableCents: 15000, // $150.00 positive
      },
      'cat-empty': {
        id: 'cat-empty',
        groupId: 'grp-1',
        name: 'Subscriptions',
        targetCents: 1500,
        assignedCents: 1500,
        availableCents: 0, // $0.00 depleted
      },
    };

    const mockGroups = [
      { id: 'grp-1', name: 'Daily Living', sortOrder: 1 },
    ];

    it('identifies cash overspending deficit correctly', () => {
      const deficit = getCategoryDeficit(mockCategories['cat-overspent']);
      expect(deficit.deficitCents).toBe(2500);
      expect(deficit.isCreditDebt).toBe(false);
    });

    it('identifies credit card unfunded debt deficit correctly', () => {
      const deficit = getCategoryDeficit(mockCategories['cat-debt']);
      expect(deficit.deficitCents).toBe(5000);
      expect(deficit.isCreditDebt).toBe(true);
    });

    it('filters donor categories with positive available balances excluding target', () => {
      const donors = getDonorCategories('cat-overspent', mockCategories, mockGroups);
      expect(donors).toHaveLength(1);
      expect(donors[0].id).toBe('cat-donor-1');
      expect(donors[0].name).toBe('Groceries');
      expect(donors[0].groupName).toBe('Daily Living');
      expect(donors[0].availableCents).toBe(15000);
    });
  });
});

