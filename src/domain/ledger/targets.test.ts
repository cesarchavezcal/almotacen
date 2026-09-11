import { describe, it, expect } from '@jest/globals';
import { calculateCategoryUnderfunded, calculateTotalUnderfunded } from './targets';
import { Category } from './types';

describe('Target Goals & Underfunded Engine (SCEN-028, SCEN-029, SCEN-030)', () => {
  it('SCEN-028: Needed for spending target reduces underfunded amount by positive rollover', () => {
    const category: Category = {
      id: 'cat-groceries',
      groupId: 'grp-immediate',
      name: 'Groceries',
      targetCents: 50000, // $500.00
      targetType: 'NEEDED_FOR_SPENDING',
      assignedCents: 0,
      availableCents: 15000, // $150.00
    };

    // $150.00 rolled over from previous month
    const result = calculateCategoryUnderfunded(category, 15000);

    expect(result.underfundedCents).toBe(35000); // Needs $350.00
    expect(result.isFunded).toBe(false);
    expect(result.targetType).toBe('NEEDED_FOR_SPENDING');
  });

  it('SCEN-028 edge case: Needed for spending with assigned funds during current month', () => {
    const category: Category = {
      id: 'cat-groceries',
      groupId: 'grp-immediate',
      name: 'Groceries',
      targetCents: 50000,
      targetType: 'NEEDED_FOR_SPENDING',
      assignedCents: 20000, // $200 assigned this month
      availableCents: 35000,
    };

    // $150 rolled over + $200 assigned = $350 effective towards $500 target
    const result = calculateCategoryUnderfunded(category, 15000);

    expect(result.underfundedCents).toBe(15000); // $150 remaining
    expect(result.isFunded).toBe(false);
  });

  it('SCEN-029: Monthly set-aside ignores past rollover and requires full monthly target assignment', () => {
    const category: Category = {
      id: 'cat-emergency',
      groupId: 'grp-true',
      name: 'Emergency Fund',
      targetCents: 20000, // $200.00
      targetType: 'MONTHLY_SET_ASIDE',
      assignedCents: 0,
      availableCents: 100000, // $1,000.00 rolled over
    };

    const result = calculateCategoryUnderfunded(category, 100000);

    // Set-aside requires fresh $200 assigned this month regardless of $1,000 available
    expect(result.underfundedCents).toBe(20000);
    expect(result.isFunded).toBe(false);
    expect(result.targetType).toBe('MONTHLY_SET_ASIDE');
  });

  it('SCEN-029 edge case: Monthly set-aside partially funded in current month', () => {
    const category: Category = {
      id: 'cat-emergency',
      groupId: 'grp-true',
      name: 'Emergency Fund',
      targetCents: 20000,
      targetType: 'MONTHLY_SET_ASIDE',
      assignedCents: 5000, // $50 assigned this month
      availableCents: 105000,
    };

    const result = calculateCategoryUnderfunded(category, 100000);

    expect(result.underfundedCents).toBe(15000); // $150 remaining
    expect(result.isFunded).toBe(false);
  });

  it('SCEN-030: Fully funded category reports zero underfunded and isFunded true', () => {
    const category: Category = {
      id: 'cat-rent',
      groupId: 'grp-immediate',
      name: 'Rent',
      targetCents: 120000, // $1,200.00
      targetType: 'MONTHLY_SET_ASIDE',
      assignedCents: 120000,
      availableCents: 120000,
    };

    const result = calculateCategoryUnderfunded(category, 0);

    expect(result.underfundedCents).toBe(0);
    expect(result.isFunded).toBe(true);
  });

  it('handles negative rollover gracefully (cash overspent from prior month)', () => {
    const category: Category = {
      id: 'cat-dining',
      groupId: 'grp-qol',
      name: 'Dining',
      targetCents: 15000,
      targetType: 'NEEDED_FOR_SPENDING',
      assignedCents: 0,
      availableCents: -5000,
    };

    // Negative rollover does not add to underfunded target, treated as 0 effective rolled over
    const result = calculateCategoryUnderfunded(category, -5000);

    expect(result.underfundedCents).toBe(15000);
    expect(result.isFunded).toBe(false);
  });

  it('handles category with targetCents = 0', () => {
    const category: Category = {
      id: 'cat-misc',
      groupId: 'grp-qol',
      name: 'Misc',
      targetCents: 0,
      assignedCents: 0,
      availableCents: 0,
    };

    const result = calculateCategoryUnderfunded(category, 0);

    expect(result.underfundedCents).toBe(0);
    expect(result.isFunded).toBe(true);
  });

  it('calculateTotalUnderfunded sums all non-credit category deficits correctly', () => {
    const categories: Category[] = [
      {
        id: 'cat-1',
        groupId: 'grp-immediate',
        name: 'Rent',
        targetCents: 100000,
        targetType: 'MONTHLY_SET_ASIDE',
        assignedCents: 40000,
        availableCents: 40000,
      },
      {
        id: 'cat-2',
        groupId: 'grp-immediate',
        name: 'Groceries',
        targetCents: 50000,
        targetType: 'NEEDED_FOR_SPENDING',
        assignedCents: 10000,
        availableCents: 30000,
      },
      {
        id: 'cat-cc',
        groupId: 'grp-payments',
        name: 'Credit Card Payment',
        targetCents: 0,
        assignedCents: 0,
        availableCents: 0,
        isCreditPayment: true,
      },
    ];

    const rollovers = {
      'cat-1': 0,
      'cat-2': 20000, // $200 rollover + $100 assigned = $300 towards $500 target => $200 underfunded
    };

    const total = calculateTotalUnderfunded(categories, rollovers);
    // cat-1 underfunded: $1000 - $400 = $600 (60000)
    // cat-2 underfunded: $500 - $300 = $200 (20000)
    // total = 80000 cents ($800.00)
    expect(total).toBe(80000);
  });
});
