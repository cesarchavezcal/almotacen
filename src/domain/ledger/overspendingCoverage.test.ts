import { describe, it, expect } from '@jest/globals';
import { coverOverspending, CoverOverspendingParams, CoverOverspendingResult } from './overspendingCoverage';
import { BudgetState } from './types';

describe('Overspending Coverage Engine (SCEN-034, SCEN-035)', () => {
  const baseState: BudgetState = {
    readyToAssignCents: 50000,
    accounts: {
      'acc-checking': {
        id: 'acc-checking',
        name: 'Checking',
        accountType: 'checking',
        balanceCents: 200000,
      },
      'acc-credit': {
        id: 'acc-credit',
        name: 'Apple Card',
        accountType: 'credit',
        balanceCents: 4500,
        creditPaymentCategoryId: 'cat-cc-payment',
      },
    },
    categories: {
      'cat-dining': {
        id: 'cat-dining',
        groupId: 'grp-qol',
        name: 'Dining Out',
        targetCents: 15000,
        assignedCents: 0,
        availableCents: -3000, // -$30.00 cash overspent
      },
      'cat-groceries': {
        id: 'cat-groceries',
        groupId: 'grp-immediate',
        name: 'Groceries',
        targetCents: 40000,
        assignedCents: 40000,
        availableCents: 15000, // $150.00 available
      },
      'cat-electronics': {
        id: 'cat-electronics',
        groupId: 'grp-qol',
        name: 'Electronics',
        targetCents: 0,
        assignedCents: 0,
        availableCents: 0,
        unfundedDebtCents: 4500, // $45.00 credit debt
      },
      'cat-cc-payment': {
        id: 'cat-cc-payment',
        groupId: 'grp-payments',
        name: 'Apple Card Payment',
        targetCents: 0,
        assignedCents: 0,
        availableCents: 0,
        isCreditPayment: true,
      },
      'cat-emergency': {
        id: 'cat-emergency',
        groupId: 'grp-true',
        name: 'Emergency Fund',
        targetCents: 50000,
        assignedCents: 50000,
        availableCents: 10000, // $100.00 available
      },
    },
    transactions: [],
    totalOutflowCents: 0,
    totalInflowCents: 0,
  };

  it('SCEN-034: Cover Cash Overspending from Funded Category', () => {
    const params: CoverOverspendingParams = {
      state: baseState,
      targetCategoryId: 'cat-dining',
      sourceCategoryId: 'cat-groceries',
      amountCents: 3000, // $30.00
    };

    const result: CoverOverspendingResult = coverOverspending(params);

    // Target category available restored to $0.00
    expect(result.state.categories['cat-dining'].availableCents).toBe(0);
    // Source category available decremented by $30.00: $150 - $30 = $120
    expect(result.state.categories['cat-groceries'].availableCents).toBe(12000);
    // Zero-based conservation: readyToAssign unchanged
    expect(result.state.readyToAssignCents).toBe(50000);
    expect(result.coveredCents).toBe(3000);
  });

  it('SCEN-035: Cover Credit Card Unfunded Debt moves funds to CC payment reserve', () => {
    const params: CoverOverspendingParams = {
      state: baseState,
      targetCategoryId: 'cat-electronics',
      sourceCategoryId: 'cat-emergency',
      amountCents: 4500, // $45.00
      creditPaymentCategoryId: 'cat-cc-payment',
    };

    const result: CoverOverspendingResult = coverOverspending(params);

    // Unfunded debt wiped clean
    expect(result.state.categories['cat-electronics'].unfundedDebtCents).toBe(0);
    // Source category decremented: $100 - $45 = $55
    expect(result.state.categories['cat-emergency'].availableCents).toBe(5500);
    // Credit card payment envelope credited with $45.00
    expect(result.state.categories['cat-cc-payment'].availableCents).toBe(4500);
    // Ready to assign unchanged
    expect(result.state.readyToAssignCents).toBe(50000);
  });

  it('rejects transfer if source category has insufficient available funds', () => {
    const params: CoverOverspendingParams = {
      state: baseState,
      targetCategoryId: 'cat-dining',
      sourceCategoryId: 'cat-groceries',
      amountCents: 20000, // Wants $200, only $150 available
    };

    expect(() => coverOverspending(params)).toThrow(/Insufficient available funds in source category/);
  });

  it('rejects transfer if amountCents is non-positive', () => {
    const params: CoverOverspendingParams = {
      state: baseState,
      targetCategoryId: 'cat-dining',
      sourceCategoryId: 'cat-groceries',
      amountCents: 0,
    };

    expect(() => coverOverspending(params)).toThrow(/Transfer amount must be positive/);
  });

  it('rejects transfer if source and target category are the same', () => {
    const params: CoverOverspendingParams = {
      state: baseState,
      targetCategoryId: 'cat-groceries',
      sourceCategoryId: 'cat-groceries',
      amountCents: 5000,
    };

    expect(() => coverOverspending(params)).toThrow(/Source and target category cannot be the same/);
  });
});
