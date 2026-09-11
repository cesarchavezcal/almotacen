/**
 * Budget View Domain Helpers (Zero-Based Envelope Calculations & Group Aggregations)
 *
 * Implements SCEN-005, SCEN-006, SCEN-014, and SCEN-015 with strict integer cents.
 */
import { Category } from './types';

export interface ReadyToAssignBannerState {
  status: 'positive' | 'zero' | 'overassigned';
  badgeText: 'READY TO ASSIGN' | 'ZERO-BASED' | 'OVERASSIGNED';
  isOverAssigned: boolean;
  description: string;
}

export function getReadyToAssignBannerState(readyToAssignCents: number): ReadyToAssignBannerState {
  if (readyToAssignCents > 0) {
    return {
      status: 'positive',
      badgeText: 'READY TO ASSIGN',
      isOverAssigned: false,
      description: 'Assign cash to envelopes until zero dollars remain.',
    };
  }

  if (readyToAssignCents === 0) {
    return {
      status: 'zero',
      badgeText: 'ZERO-BASED',
      isOverAssigned: false,
      description: 'All dollars have been given a job • Every dollar accounted for.',
    };
  }

  return {
    status: 'overassigned',
    badgeText: 'OVERASSIGNED',
    isOverAssigned: true,
    description: 'You have assigned more money than you have available in cash accounts.',
  };
}

export type QuickFillAction = 'add_50' | 'add_100' | 'sub_50' | 'fill_remaining';

export function calculateQuickFillAllocation(
  currentAssignedCents: number,
  readyToAssignCents: number,
  action: QuickFillAction
): number {
  switch (action) {
    case 'add_50':
      return currentAssignedCents + 5000;
    case 'add_100':
      return currentAssignedCents + 10000;
    case 'sub_50':
      return Math.max(0, currentAssignedCents - 5000);
    case 'fill_remaining':
      return readyToAssignCents > 0 ? currentAssignedCents + readyToAssignCents : currentAssignedCents;
  }
}

export interface EnvelopeBadge {
  type: 'credit_debt' | 'cash_overspent' | 'depleted' | 'funded';
  label: 'CREDIT DEBT' | 'CASH OVERSPENT' | 'DEPLETED' | 'FUNDED';
  isWarning?: boolean;
  isError?: boolean;
}

/**
 * Two-Axis Overspending & Debt Determination (SCEN-015):
 * Differentiates credit-card-backed unfunded liability (amber warning)
 * from liquid cash overspending (red error).
 */
export function getEnvelopeBadge(category: {
  availableCents: number;
  unfundedDebtCents?: number;
  isCreditPayment?: boolean;
}): EnvelopeBadge {
  // Axis 1: Credit Card Unfunded Debt (Amber)
  if (category.unfundedDebtCents && category.unfundedDebtCents > 0) {
    return {
      type: 'credit_debt',
      label: 'CREDIT DEBT',
      isWarning: true,
    };
  }

  // Axis 2: Cash Overspending (Red)
  if (category.availableCents < 0) {
    return {
      type: 'cash_overspent',
      label: 'CASH OVERSPENT',
      isError: true,
    };
  }

  if (category.availableCents === 0) {
    return {
      type: 'depleted',
      label: 'DEPLETED',
    };
  }

  return {
    type: 'funded',
    label: 'FUNDED',
  };
}

export interface BudgetCategoryGroupItem {
  id: string;
  name: string;
  targetCents: number;
  targetType?: Category['targetType'];
  targetDueDay?: number;
  underfundedCents: number;
  assignedCents: number;
  activityCents: number;
  availableCents: number;
  unfundedDebtCents?: number;
  isCreditPayment?: boolean;
}

export interface BudgetDisplayGroup {
  id: string;
  name: string;
  items: BudgetCategoryGroupItem[];
}

export function buildBudgetDisplayGroups(
  categoriesRecord: Record<string, Category>,
  groupsList: { id: string; name: string }[],
  rolloversByCategoryId: Record<string, number> = {}
): BudgetDisplayGroup[] {
  const allCategories = Object.values(categoriesRecord);
  const standardCategories = allCategories.filter((c) => !c.isCreditPayment);
  const creditCategories = allCategories.filter((c) => c.isCreditPayment);

  const displayGroups: BudgetDisplayGroup[] = groupsList
    .map((g) => {
      const items: BudgetCategoryGroupItem[] = standardCategories
        .filter((c) => c.groupId === g.id)
        .map((c) => {
          const rollover = rolloversByCategoryId[c.id] ?? 0;
          let underfundedCents = 0;
          if (c.targetCents > 0) {
            if (c.targetType === 'MONTHLY_SET_ASIDE') {
              underfundedCents = Math.max(0, c.targetCents - c.assignedCents);
            } else {
              const effectiveTotal = Math.max(0, rollover) + c.assignedCents;
              underfundedCents = Math.max(0, c.targetCents - effectiveTotal);
            }
          }

          return {
            id: c.id,
            name: c.name,
            targetCents: c.targetCents,
            targetType: c.targetType,
            targetDueDay: c.targetDueDay,
            underfundedCents,
            assignedCents: c.assignedCents,
            activityCents: c.availableCents - c.assignedCents,
            availableCents: c.availableCents,
            unfundedDebtCents: c.unfundedDebtCents,
            isCreditPayment: false,
          };
        });

      return {
        id: g.id,
        name: g.name,
        items,
      };
    })
    .filter((g) => g.items.length > 0);

  if (creditCategories.length > 0) {
    displayGroups.unshift({
      id: 'group-credit-card-payments',
      name: 'Credit Card Payment Reserves',
      items: creditCategories.map((c) => ({
        id: c.id,
        name: c.name,
        targetCents: c.targetCents,
        targetType: c.targetType,
        targetDueDay: c.targetDueDay,
        underfundedCents: 0,
        assignedCents: c.assignedCents,
        activityCents: c.availableCents - c.assignedCents,
        availableCents: c.availableCents,
        unfundedDebtCents: c.unfundedDebtCents,
        isCreditPayment: true,
      })),
    });
  }

  return displayGroups;
}

export interface BudgetTotals {
  totalAssignedCents: number;
  totalAvailableCents: number;
}

export function calculateBudgetTotals(
  categoriesRecord: Record<string, Category>
): BudgetTotals {
  let assigned = 0;
  let available = 0;
  for (const cat of Object.values(categoriesRecord)) {
    if (!cat.isCreditPayment) {
      assigned += cat.assignedCents;
      available += cat.availableCents;
    }
  }
  return {
    totalAssignedCents: assigned,
    totalAvailableCents: available,
  };
}
