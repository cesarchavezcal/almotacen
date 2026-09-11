/**
 * Auto-Assign Payday Prioritization Engine
 *
 * Implements SCEN-031, SCEN-032, and SCEN-033 with strict integer cents.
 *
 * Priority Rules:
 * 1. Cash-overspent categories (availableCents < 0) restored to 0 first.
 * 2. Group sort order (Immediate Obligations -> True Expenses -> Quality of Life).
 * 3. Inside groups, sort by targetDueDay ascending (earlier due dates funded first).
 * 4. Never allocates more than readyToAssignCents (Exhaustion Invariant).
 */
import { Category, CategoryGroup } from './types';
import { calculateCategoryUnderfunded } from './targets';

export interface AutoAssignParams {
  readyToAssignCents: number;
  categories: Category[];
  groups: CategoryGroup[];
  rolloversByCategoryId?: Record<string, number>;
}

export interface AutoAssignResult {
  allocations: Record<string, number>;
  totalAllocatedCents: number;
  remainingReadyToAssignCents: number;
}

export function calculateAutoAssignAllocations(params: AutoAssignParams): AutoAssignResult {
  const { readyToAssignCents, categories, groups, rolloversByCategoryId = {} } = params;

  if (readyToAssignCents <= 0 || categories.length === 0) {
    return {
      allocations: {},
      totalAllocatedCents: 0,
      remainingReadyToAssignCents: Math.max(0, readyToAssignCents),
    };
  }

  let unassignedCents = readyToAssignCents;
  const allocations: Record<string, number> = {};

  const groupSortOrderMap: Record<string, number> = {};
  for (const group of groups) {
    groupSortOrderMap[group.id] = group.sortOrder;
  }

  const eligibleCategories = categories.filter((category) => !category.isCreditPayment);

  // PASS 1: Cash-Overspent Categories (Priority 1: SCEN-031)
  for (const category of eligibleCategories) {
    if (unassignedCents <= 0) break;

    if (category.availableCents < 0) {
      const deficitCents = Math.abs(category.availableCents);
      const allocationCents = Math.min(unassignedCents, deficitCents);

      if (allocationCents > 0) {
        allocations[category.id] = (allocations[category.id] ?? 0) + allocationCents;
        unassignedCents -= allocationCents;
      }
    }
  }

  // PASS 2: Target Goals Prioritization (Priority 2 & 3: SCEN-032)
  if (unassignedCents > 0) {
    // Sort categories by:
    // 1. Group sort order ascending
    // 2. targetDueDay ascending (null/undefined treated as late in month: 99)
    const sortedForTargets = [...eligibleCategories].sort((catA, catB) => {
      const groupOrderA = groupSortOrderMap[catA.groupId] ?? 999;
      const groupOrderB = groupSortOrderMap[catB.groupId] ?? 999;

      if (groupOrderA !== groupOrderB) {
        return groupOrderA - groupOrderB;
      }

      const dueDayA = catA.targetDueDay ?? 99;
      const dueDayB = catB.targetDueDay ?? 99;
      return dueDayA - dueDayB;
    });

    for (const category of sortedForTargets) {
      if (unassignedCents <= 0) break;

      const rollover = rolloversByCategoryId[category.id] ?? 0;
      // Account for allocations already made in Pass 1
      const effectiveAssigned = category.assignedCents + (allocations[category.id] ?? 0);
      const simulatedCategory: Category = {
        ...category,
        assignedCents: effectiveAssigned,
      };

      const underfundedInfo = calculateCategoryUnderfunded(simulatedCategory, rollover);
      const neededCents = underfundedInfo.underfundedCents;

      if (neededCents > 0) {
        const allocationCents = Math.min(unassignedCents, neededCents);
        allocations[category.id] = (allocations[category.id] ?? 0) + allocationCents;
        unassignedCents -= allocationCents;
      }
    }
  }

  const totalAllocatedCents = readyToAssignCents - unassignedCents;

  return {
    allocations,
    totalAllocatedCents,
    remainingReadyToAssignCents: unassignedCents,
  };
}
