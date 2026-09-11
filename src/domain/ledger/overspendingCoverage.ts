/**
 * Interactive Overspending Coverage & Atomic Rebalancing Engine
 *
 * Implements SCEN-034 and SCEN-035 with strict integer cents and zero-based conservation.
 */
import { BudgetState, Category } from './types';
import { LedgerDomainError } from './errors';

export interface CoverOverspendingParams {
  state: BudgetState;
  targetCategoryId: string;
  sourceCategoryId: string;
  amountCents: number;
  creditPaymentCategoryId?: string;
}

export interface CoverOverspendingResult {
  state: BudgetState;
  coveredCents: number;
  isCreditDebtCovered: boolean;
}

export function coverOverspending(params: CoverOverspendingParams): CoverOverspendingResult {
  const { state, targetCategoryId, sourceCategoryId, amountCents, creditPaymentCategoryId } = params;

  if (amountCents <= 0) {
    throw new LedgerDomainError('Transfer amount must be positive');
  }

  if (targetCategoryId === sourceCategoryId) {
    throw new LedgerDomainError('Source and target category cannot be the same');
  }

  const sourceCategory = state.categories[sourceCategoryId];
  if (!sourceCategory) {
    throw new LedgerDomainError(`Source category not found: ${sourceCategoryId}`);
  }

  const targetCategory = state.categories[targetCategoryId];
  if (!targetCategory) {
    throw new LedgerDomainError(`Target category not found: ${targetCategoryId}`);
  }

  if (sourceCategory.availableCents < amountCents) {
    throw new LedgerDomainError(
      `Insufficient available funds in source category '${sourceCategory.name}' (${sourceCategory.availableCents} < ${amountCents})`
    );
  }

  const updatedCategories: Record<string, Category> = {
    ...state.categories,
    [sourceCategoryId]: {
      ...sourceCategory,
      availableCents: sourceCategory.availableCents - amountCents,
      assignedCents: sourceCategory.assignedCents - amountCents,
    },
  };

  const isCreditDebt = (targetCategory.unfundedDebtCents ?? 0) > 0;

  if (isCreditDebt) {
    // SCEN-035: Credit Card Debt Coverage
    const resolvedPaymentCategoryId =
      creditPaymentCategoryId ??
      Object.values(state.categories).find((cat) => cat.isCreditPayment)?.id;

    if (!resolvedPaymentCategoryId) {
      throw new LedgerDomainError('Credit card payment category not found to reserve debt coverage funds');
    }

    const paymentCategory = state.categories[resolvedPaymentCategoryId];
    if (!paymentCategory) {
      throw new LedgerDomainError(`Payment category not found: ${resolvedPaymentCategoryId}`);
    }

    const currentDebt = targetCategory.unfundedDebtCents ?? 0;
    const debtReduction = Math.min(currentDebt, amountCents);

    updatedCategories[targetCategoryId] = {
      ...targetCategory,
      unfundedDebtCents: currentDebt - debtReduction,
    };

    updatedCategories[resolvedPaymentCategoryId] = {
      ...paymentCategory,
      availableCents: paymentCategory.availableCents + amountCents,
      assignedCents: paymentCategory.assignedCents + amountCents,
    };
  } else {
    // SCEN-034: Standard Cash Overspending Coverage
    updatedCategories[targetCategoryId] = {
      ...targetCategory,
      availableCents: targetCategory.availableCents + amountCents,
      assignedCents: targetCategory.assignedCents + amountCents,
    };
  }

  return {
    state: {
      ...state,
      categories: updatedCategories,
    },
    coveredCents: amountCents,
    isCreditDebtCovered: isCreditDebt,
  };
}
