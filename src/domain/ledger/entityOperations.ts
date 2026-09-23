import { Account } from './types';
import { EntityIntegrityError, ProtectedEntityError } from './errors';

export interface PreparedCreditCardPaymentCategory {
  paymentGroupId: string;
  paymentGroupName: string;
  categoryId: string;
  categoryName: string;
  startingDebtCents: number;
}

/**
 * Pure domain logic to prepare the linked credit card payment category definition.
 */
export function prepareCreditCardPaymentCategory(
  accountName: string,
  accountId: string,
  balanceCents: number
): PreparedCreditCardPaymentCategory {
  return {
    paymentGroupId: 'grp-payments',
    paymentGroupName: 'Credit Card Payments',
    categoryId: `cat-cc-${accountId}`,
    categoryName: `${accountName} Payment`,
    startingDebtCents: Math.abs(balanceCents),
  };
}

/**
 * Pure domain logic to calculate the immediate ready-to-assign inflow addition on account creation.
 * Only non-credit accounts with positive starting balance credit the unassigned pool.
 */
export function calculateDepositoryInflowOnCreation(
  accountType: Account['accountType'],
  balanceCents: number
): number {
  if (accountType === 'credit') {
    return 0;
  }
  return balanceCents > 0 ? balanceCents : 0;
}

/**
 * Asserts referential integrity constraints for account deletion.
 */
export function assertCanDeleteAccount(transactionCount: number): void {
  if (transactionCount > 0) {
    throw new EntityIntegrityError('Cannot delete account with existing transactions.');
  }
}

/**
 * Asserts referential integrity constraints for category group deletion.
 */
export function assertCanDeleteCategoryGroup(childCategoryCount: number): void {
  if (childCategoryCount > 0) {
    throw new EntityIntegrityError('Cannot delete category group containing categories.');
  }
}

/**
 * Determines whether a linked credit card payment category can be automatically removed
 * when its parent credit card account is deleted.
 */
export function canCleanUpLinkedPaymentCategory(
  availableCents: number,
  transactionCount: number
): boolean {
  return availableCents === 0 && transactionCount === 0;
}

/**
 * Asserts referential integrity constraints for category envelope deletion.
 */
export function assertCanDeleteCategory(params: {
  isCreditPayment: boolean;
  availableCents: number;
  transactionCount: number;
}): void {
  if (params.isCreditPayment) {
    throw new ProtectedEntityError('Credit payment categories cannot be deleted directly.');
  }

  if (params.availableCents !== 0 || params.transactionCount > 0) {
    throw new EntityIntegrityError('Cannot delete category with available funds or active transactions.');
  }
}
