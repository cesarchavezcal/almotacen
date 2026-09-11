import { BudgetState, Category } from './types';

export interface MonthRolloverParams {
  state: BudgetState;
  targetMonth?: string;
}

export interface MonthRolloverResult {
  state: BudgetState;
  totalCashDeficitDeductedCents: number;
  unspentBalancesCarriedOverCents: number;
  retainedCreditDebtCents: number;
}

/**
 * Executes month-end rollover across category envelopes and Ready to Assign (SCEN-026, SCEN-027).
 *
 * Rules:
 * 1. Positive unspent envelope balances roll over intact into the new month's available balance.
 * 2. Uncovered cash deficits (negative available balance not funded by credit) are deducted directly
 *    from the new month's `Ready to Assign` pool. The envelope available resets to 0.
 * 3. Unfunded credit debt is retained as an ongoing credit card debt balance on the credit card account.
 *    It is NOT deducted from Ready to Assign. The category envelope available balance and unfunded debt
 *    reset to 0.
 * 4. Assigned cents for all non-credit payment envelopes reset to 0 in the fresh month cycle.
 * 5. Credit card payment reserve envelope available balance carries forward intact.
 */
export function performMonthRollover(params: MonthRolloverParams): MonthRolloverResult {
  const { state } = params;

  let totalCashDeficitDeductedCents = 0;
  let unspentBalancesCarriedOverCents = 0;
  let retainedCreditDebtCents = 0;

  const nextCategories: Record<string, Category> = {};

  for (const [id, cat] of Object.entries(state.categories)) {
    if (cat.isCreditPayment) {
      // Credit card payment category: available cash is reserved to pay the card and carries over
      if (cat.availableCents > 0) {
        unspentBalancesCarriedOverCents += cat.availableCents;
      }
      nextCategories[id] = {
        ...cat,
        assignedCents: 0,
      };
      continue;
    }

    if (cat.availableCents > 0) {
      // Positive unspent balance rolls over intact
      unspentBalancesCarriedOverCents += cat.availableCents;
      nextCategories[id] = {
        ...cat,
        assignedCents: 0, // Fresh month starts with zero newly assigned
      };
    } else if (cat.availableCents < 0) {
      // Category is overspent. Determine split between cash deficit and credit debt
      const unfundedDebt = cat.unfundedDebtCents || 0;
      const totalOverspent = Math.abs(cat.availableCents);

      // Unfunded debt cannot exceed total overspent
      const effectiveCreditDebt = Math.min(unfundedDebt, totalOverspent);
      const cashDeficit = Math.max(0, totalOverspent - effectiveCreditDebt);

      totalCashDeficitDeductedCents += cashDeficit;
      retainedCreditDebtCents += effectiveCreditDebt;

      // Both cash overspending and credit overspending reset to 0 in the envelope.
      // Cash was absorbed by RTA; credit debt is locked into the credit card account balance.
      nextCategories[id] = {
        ...cat,
        availableCents: 0,
        assignedCents: 0,
        unfundedDebtCents: 0,
      };
    } else {
      // Exactly zero available
      nextCategories[id] = {
        ...cat,
        assignedCents: 0,
      };
    }
  }

  // Deduct uncovered cash deficits from Ready to Assign
  const nextReadyToAssignCents = state.readyToAssignCents - totalCashDeficitDeductedCents;

  const nextState: BudgetState = {
    ...state,
    readyToAssignCents: nextReadyToAssignCents,
    categories: nextCategories,
  };

  return {
    state: nextState,
    totalCashDeficitDeductedCents,
    unspentBalancesCarriedOverCents,
    retainedCreditDebtCents,
  };
}
