import { describe, it, expect } from '@jest/globals';
import { BudgetState, Account, Category } from './types';
import { performMonthRollover } from './rollover';

describe('Dual-Ledger Month Rollover Engine (SCEN-026, SCEN-027)', () => {
  const baseChecking: Account = {
    id: 'acc-checking',
    name: 'Checking',
    accountType: 'checking',
    balanceCents: 200000, // $2,000.00
  };

  const baseCredit: Account = {
    id: 'acc-credit',
    name: 'Credit Card',
    accountType: 'credit',
    balanceCents: -8000, // -$80.00 debt
    creditPaymentCategoryId: 'cat-cc-payment',
  };

  const baseCcPaymentCat: Category = {
    id: 'cat-cc-payment',
    groupId: 'grp-payments',
    name: 'Credit Card Payment',
    targetCents: 0,
    assignedCents: 0,
    availableCents: 15000, // $150.00 reserved
    isCreditPayment: true,
    unfundedDebtCents: 0,
  };

  const createInitialState = (categories: Record<string, Category>, readyToAssignCents = 50000): BudgetState => ({
    readyToAssignCents,
    accounts: {
      [baseChecking.id]: baseChecking,
      [baseCredit.id]: baseCredit,
    },
    categories,
    transactions: [],
    totalOutflowCents: 0,
    totalInflowCents: 0,
  });

  describe('SCEN-026: Positive Envelope Balance Rollover', () => {
    it('carries over positive available balances to the new month and resets assigned cents to zero', () => {
      const state = createInitialState({
        [baseCcPaymentCat.id]: baseCcPaymentCat,
        'cat-groceries': {
          id: 'cat-groceries',
          groupId: 'grp-living',
          name: 'Groceries',
          targetCents: 40000,
          assignedCents: 40000,
          availableCents: 12500, // $125.00 unspent
          isCreditPayment: false,
          unfundedDebtCents: 0,
        },
        'cat-rent': {
          id: 'cat-rent',
          groupId: 'grp-fixed',
          name: 'Rent',
          targetCents: 100000,
          assignedCents: 100000,
          availableCents: 0, // exactly spent
          isCreditPayment: false,
          unfundedDebtCents: 0,
        },
      });

      const result = performMonthRollover({ state });

      // Groceries available should carry over intact, assigned resets to 0
      expect(result.state.categories['cat-groceries'].availableCents).toBe(12500);
      expect(result.state.categories['cat-groceries'].assignedCents).toBe(0);

      // Rent available should stay 0, assigned resets to 0
      expect(result.state.categories['cat-rent'].availableCents).toBe(0);
      expect(result.state.categories['cat-rent'].assignedCents).toBe(0);

      // Credit card payment envelope retains reserved cash
      expect(result.state.categories['cat-cc-payment'].availableCents).toBe(15000);

      // Ready to assign is preserved
      expect(result.state.readyToAssignCents).toBe(50000);
      expect(result.totalCashDeficitDeductedCents).toBe(0);
      expect(result.unspentBalancesCarriedOverCents).toBe(27500); // 12500 + 15000
    });
  });

  describe('SCEN-027: Cash Deficit Absorption & Credit Debt Isolation', () => {
    it('deducts cash overspending deficits from next month Ready to Assign and resets envelope to 0', () => {
      const state = createInitialState({
        [baseCcPaymentCat.id]: baseCcPaymentCat,
        'cat-dining': {
          id: 'cat-dining',
          groupId: 'grp-living',
          name: 'Dining Out',
          targetCents: 10000,
          assignedCents: 10000,
          availableCents: -5000, // -$50.00 cash deficit
          isCreditPayment: false,
          unfundedDebtCents: 0,
        },
      }, 50000); // RTA: $500.00

      const result = performMonthRollover({ state });

      // $50.00 deficit is deducted from RTA
      expect(result.state.readyToAssignCents).toBe(45000);
      expect(result.totalCashDeficitDeductedCents).toBe(5000);

      // Dining available resets to 0
      expect(result.state.categories['cat-dining'].availableCents).toBe(0);
      expect(result.state.categories['cat-dining'].assignedCents).toBe(0);
    });

    it('retains credit card overspending debt on the card account without deducting from Ready to Assign', () => {
      const state = createInitialState({
        [baseCcPaymentCat.id]: baseCcPaymentCat,
        'cat-electronics': {
          id: 'cat-electronics',
          groupId: 'grp-shopping',
          name: 'Electronics',
          targetCents: 0,
          assignedCents: 0,
          availableCents: -8000, // -$80.00 credit debt
          isCreditPayment: false,
          unfundedDebtCents: 8000, // all credit debt
        },
      }, 50000);

      const result = performMonthRollover({ state });

      // RTA is NOT reduced for credit card debt
      expect(result.state.readyToAssignCents).toBe(50000);
      expect(result.totalCashDeficitDeductedCents).toBe(0);
      expect(result.retainedCreditDebtCents).toBe(8000);

      // Electronics available balance and category unfunded debt reset to 0 in envelope
      expect(result.state.categories['cat-electronics'].availableCents).toBe(0);
      expect(result.state.categories['cat-electronics'].unfundedDebtCents).toBe(0);

      // Credit card account balance remains -$80.00 debt
      expect(result.state.accounts['acc-credit'].balanceCents).toBe(-8000);
    });

    it('correctly splits mixed cash and credit overspending within the same category', () => {
      const state = createInitialState({
        [baseCcPaymentCat.id]: baseCcPaymentCat,
        'cat-travel': {
          id: 'cat-travel',
          groupId: 'grp-living',
          name: 'Travel',
          targetCents: 0,
          assignedCents: 0,
          availableCents: -12000, // -$120.00 total overspent
          isCreditPayment: false,
          unfundedDebtCents: 7000, // $70.00 credit debt, remaining $50.00 was cash deficit
        },
      }, 50000);

      const result = performMonthRollover({ state });

      // Only the $50.00 cash deficit is deducted from RTA
      expect(result.state.readyToAssignCents).toBe(45000);
      expect(result.totalCashDeficitDeductedCents).toBe(5000);
      expect(result.retainedCreditDebtCents).toBe(7000);

      // Travel envelope resets to 0
      expect(result.state.categories['cat-travel'].availableCents).toBe(0);
      expect(result.state.categories['cat-travel'].unfundedDebtCents).toBe(0);
    });

    it('allows Ready to Assign to become negative if cash deficits exceed RTA', () => {
      const state = createInitialState({
        'cat-bills': {
          id: 'cat-bills',
          groupId: 'grp-living',
          name: 'Bills',
          targetCents: 0,
          assignedCents: 0,
          availableCents: -30000, // -$300.00 cash deficit
          isCreditPayment: false,
          unfundedDebtCents: 0,
        },
      }, 10000); // RTA: only $100.00 available

      const result = performMonthRollover({ state });

      // RTA becomes -$200.00 ($100.00 - $300.00)
      expect(result.state.readyToAssignCents).toBe(-20000);
      expect(result.totalCashDeficitDeductedCents).toBe(30000);
    });
  });
});
