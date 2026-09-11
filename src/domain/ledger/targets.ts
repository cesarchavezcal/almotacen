/**
 * Category Targets & Underfunded Calculations Engine
 *
 * Implements SCEN-028, SCEN-029, and SCEN-030 with strict integer cents.
 */
import { Category, CategoryUnderfundedInfo, TargetType } from './types';

export function calculateCategoryUnderfunded(
  category: Category,
  rolledOverAvailableCents: number = 0
): CategoryUnderfundedInfo {
  const targetType: TargetType = category.targetType ?? 'NEEDED_FOR_SPENDING';
  const targetCents = category.targetCents ?? 0;
  const assignedCents = category.assignedCents ?? 0;

  if (targetCents <= 0) {
    return {
      categoryId: category.id,
      targetCents: 0,
      targetType,
      underfundedCents: 0,
      isFunded: true,
    };
  }

  let underfundedCents = 0;

  if (targetType === 'MONTHLY_SET_ASIDE') {
    // SCEN-029: Requires full fresh assignment this month, ignoring past rollover balance
    underfundedCents = Math.max(0, targetCents - assignedCents);
  } else {
    // SCEN-028: NEEDED_FOR_SPENDING (Rollover-Aware)
    // Positive funds carried over from previous cycle count towards the target
    const effectiveRollover = Math.max(0, rolledOverAvailableCents);
    const effectiveTotalFunds = effectiveRollover + assignedCents;
    underfundedCents = Math.max(0, targetCents - effectiveTotalFunds);
  }

  return {
    categoryId: category.id,
    targetCents,
    targetType,
    underfundedCents,
    isFunded: underfundedCents === 0,
  };
}

export function calculateTotalUnderfunded(
  categories: Category[],
  rolloversByCategoryId: Record<string, number> = {}
): number {
  let totalDeficit = 0;

  for (const cat of categories) {
    if (cat.isCreditPayment) {
      continue;
    }
    const rolledOver = rolloversByCategoryId[cat.id] ?? 0;
    const info = calculateCategoryUnderfunded(cat, rolledOver);
    totalDeficit += info.underfundedCents;
  }

  return totalDeficit;
}
