import { describe, it, expect } from '@jest/globals';
import { calculateAutoAssignAllocations, AutoAssignResult } from './autoAssign';
import { Category, CategoryGroup } from './types';

describe('Auto-Assign Payday Prioritization Engine (SCEN-031, SCEN-032, SCEN-033)', () => {
  const defaultGroups: CategoryGroup[] = [
    { id: 'grp-immediate', name: 'Immediate Obligations', sortOrder: 0 },
    { id: 'grp-true', name: 'True Expenses', sortOrder: 1 },
    { id: 'grp-qol', name: 'Quality of Life', sortOrder: 2 },
  ];

  it('SCEN-031: Priority 1 - funds overspent categories first to restore available to 0', () => {
    const categories: Category[] = [
      {
        id: 'cat-dining',
        groupId: 'grp-qol',
        name: 'Dining Out',
        targetCents: 15000,
        targetType: 'NEEDED_FOR_SPENDING',
        assignedCents: 0,
        availableCents: -5000, // -$50.00 cash overspent
      },
      {
        id: 'cat-rent',
        groupId: 'grp-immediate',
        name: 'Rent',
        targetCents: 100000,
        targetType: 'MONTHLY_SET_ASIDE',
        assignedCents: 0,
        availableCents: 0, // Underfunded by $1,000.00
      },
    ];

    const readyToAssignCents = 30000; // $300.00
    const result: AutoAssignResult = calculateAutoAssignAllocations({
      readyToAssignCents,
      categories,
      groups: defaultGroups,
    });

    // Dining Out receives $50.00 to cover deficit first
    expect(result.allocations['cat-dining']).toBe(5000);
    // Rent receives remaining $250.00
    expect(result.allocations['cat-rent']).toBe(25000);
    expect(result.totalAllocatedCents).toBe(30000);
    expect(result.remainingReadyToAssignCents).toBe(0);
  });

  it('SCEN-032: Priority Order - Immediate obligations funded before Quality of Life', () => {
    const categories: Category[] = [
      {
        id: 'cat-electric',
        groupId: 'grp-immediate',
        name: 'Electric Bill',
        targetCents: 15000, // $150.00
        targetType: 'MONTHLY_SET_ASIDE',
        targetDueDay: 15,
        assignedCents: 0,
        availableCents: 0,
      },
      {
        id: 'cat-vacation',
        groupId: 'grp-qol',
        name: 'Vacation Fund',
        targetCents: 50000, // $500.00
        targetType: 'NEEDED_FOR_SPENDING',
        targetDueDay: 30,
        assignedCents: 0,
        availableCents: 0,
      },
    ];

    const readyToAssignCents = 50000; // $500.00
    const result: AutoAssignResult = calculateAutoAssignAllocations({
      readyToAssignCents,
      categories,
      groups: defaultGroups,
    });

    // Electric bill gets full $150.00
    expect(result.allocations['cat-electric']).toBe(15000);
    // Vacation gets remaining $350.00
    expect(result.allocations['cat-vacation']).toBe(35000);
    expect(result.totalAllocatedCents).toBe(50000);
    expect(result.remainingReadyToAssignCents).toBe(0);
  });

  it('SCEN-032 edge case: sorts within same group by targetDueDay ascending', () => {
    const categories: Category[] = [
      {
        id: 'cat-late-bill',
        groupId: 'grp-immediate',
        name: 'Internet',
        targetCents: 10000, // $100.00
        targetDueDay: 25,
        assignedCents: 0,
        availableCents: 0,
      },
      {
        id: 'cat-early-bill',
        groupId: 'grp-immediate',
        name: 'Rent',
        targetCents: 10000, // $100.00
        targetDueDay: 5,
        assignedCents: 0,
        availableCents: 0,
      },
    ];

    const readyToAssignCents = 15000; // Only $150.00 available
    const result: AutoAssignResult = calculateAutoAssignAllocations({
      readyToAssignCents,
      categories,
      groups: defaultGroups,
    });

    // Rent is due earlier (day 5), gets full $100
    expect(result.allocations['cat-early-bill']).toBe(10000);
    // Internet gets remaining $50
    expect(result.allocations['cat-late-bill']).toBe(5000);
    expect(result.remainingReadyToAssignCents).toBe(0);
  });

  it('SCEN-033: Insufficient Ready to Assign Exhaustion Invariant', () => {
    const categories: Category[] = [
      {
        id: 'cat-1',
        groupId: 'grp-immediate',
        name: 'Bill 1',
        targetCents: 20000,
        assignedCents: 0,
        availableCents: 0,
      },
      {
        id: 'cat-2',
        groupId: 'grp-immediate',
        name: 'Bill 2',
        targetCents: 20000,
        assignedCents: 0,
        availableCents: 0,
      },
    ];

    const readyToAssignCents = 10000; // $100 available for $400 needed
    const result: AutoAssignResult = calculateAutoAssignAllocations({
      readyToAssignCents,
      categories,
      groups: defaultGroups,
    });

    const sumAllocated = Object.values(result.allocations).reduce((sum, val) => sum + val, 0);
    expect(sumAllocated).toBe(10000);
    expect(result.totalAllocatedCents).toBe(10000);
    expect(result.remainingReadyToAssignCents).toBe(0);
  });

  it('stops early when all targets and deficits are 100% funded with surplus remaining', () => {
    const categories: Category[] = [
      {
        id: 'cat-1',
        groupId: 'grp-immediate',
        name: 'Rent',
        targetCents: 50000, // $500.00
        assignedCents: 0,
        availableCents: 0,
      },
    ];

    const readyToAssignCents = 100000; // $1,000.00 available
    const result: AutoAssignResult = calculateAutoAssignAllocations({
      readyToAssignCents,
      categories,
      groups: defaultGroups,
    });

    expect(result.allocations['cat-1']).toBe(50000);
    expect(result.totalAllocatedCents).toBe(50000);
    expect(result.remainingReadyToAssignCents).toBe(50000); // $500.00 still unassigned
  });

  it('ignores credit payment categories in auto-assign allocations', () => {
    const categories: Category[] = [
      {
        id: 'cat-cc',
        groupId: 'grp-immediate',
        name: 'Apple Card Payment',
        targetCents: 50000,
        assignedCents: 0,
        availableCents: 0,
        isCreditPayment: true,
      },
    ];

    const result = calculateAutoAssignAllocations({
      readyToAssignCents: 20000,
      categories,
      groups: defaultGroups,
    });

    expect(result.allocations['cat-cc']).toBeUndefined();
    expect(result.totalAllocatedCents).toBe(0);
    expect(result.remainingReadyToAssignCents).toBe(20000);
  });
});
