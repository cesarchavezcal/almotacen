import { Account, Category, CategoryGroup, CreateAccountInput } from './types';
import { EntityIntegrityError, ProtectedEntityError, ValidationError } from './errors';

export interface EntityMutationPlan {
  deleteAccountIds: string[];
  deleteCategoryIds: string[];
  deleteCategoryGroupIds: string[];
  readyToAssignAdjustmentCents: number;
}

export interface PlanAccountDeletionParams {
  account: Account;
  transactionCount: number;
  linkedPaymentCategory?: Category;
  linkedPaymentCategoryTransactionCount?: number;
}

export interface PlanCategoryDeletionParams {
  category: Category;
  transactionCount: number;
}

export interface PlanCategoryGroupDeletionParams {
  groupId: string;
  childCategoryCount: number;
}

export interface AccountCreationPlan {
  account: Account;
  linkedPaymentCategory?: Category;
  linkedCategoryGroup?: CategoryGroup;
  readyToAssignInflowCents: number;
}

export class EntityManager {
  /**
   * Plans the atomic deletion of an account and determines whether its linked
   * credit card payment category can be cascaded.
   */
  static planAccountDeletion(params: PlanAccountDeletionParams): EntityMutationPlan {
    const { account, transactionCount, linkedPaymentCategory, linkedPaymentCategoryTransactionCount = 0 } = params;

    if (transactionCount > 0) {
      throw new EntityIntegrityError('Cannot delete account with existing transactions.');
    }

    const deleteAccountIds = [account.id];
    const deleteCategoryIds: string[] = [];

    if (linkedPaymentCategory) {
      // Linked payment category can be pruned only if zero funds and zero transactions
      if (linkedPaymentCategory.availableCents === 0 && linkedPaymentCategoryTransactionCount === 0) {
        deleteCategoryIds.push(linkedPaymentCategory.id);
      }
    }

    return {
      deleteAccountIds,
      deleteCategoryIds,
      deleteCategoryGroupIds: [],
      readyToAssignAdjustmentCents: 0,
    };
  }

  /**
   * Plans the atomic deletion of an envelope category, verifying integrity guards.
   */
  static planCategoryDeletion(params: PlanCategoryDeletionParams): EntityMutationPlan {
    const { category, transactionCount } = params;

    if (category.isCreditPayment) {
      throw new ProtectedEntityError('Credit payment categories cannot be deleted directly.');
    }

    if (category.availableCents !== 0 || transactionCount > 0) {
      throw new EntityIntegrityError('Cannot delete category with available funds or active transactions.');
    }

    return {
      deleteAccountIds: [],
      deleteCategoryIds: [category.id],
      deleteCategoryGroupIds: [],
      readyToAssignAdjustmentCents: 0,
    };
  }

  /**
   * Plans the atomic deletion of a category group, verifying it contains zero child categories.
   */
  static planCategoryGroupDeletion(params: PlanCategoryGroupDeletionParams): EntityMutationPlan {
    const { groupId, childCategoryCount } = params;

    if (childCategoryCount > 0) {
      throw new EntityIntegrityError('Cannot delete category group containing categories.');
    }

    return {
      deleteAccountIds: [],
      deleteCategoryIds: [],
      deleteCategoryGroupIds: [groupId],
      readyToAssignAdjustmentCents: 0,
    };
  }

  /**
   * Plans the atomic creation of an account, normalizing credit liabilities and auto-provisioning
   * credit card payment categories when needed.
   */
  static planAccountCreation(input: CreateAccountInput): AccountCreationPlan {
    const trimmedName = input.name ? input.name.trim() : '';
    if (!trimmedName) {
      throw new ValidationError('Account name cannot be empty');
    }

    const id = input.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `acc-${Date.now()}`);

    if (input.accountType === 'credit') {
      const balanceCents = input.balanceCents;
      const paymentCategoryId = `cat-cc-${id}`;
      const paymentGroupId = 'grp-payments';

      const linkedCategoryGroup: CategoryGroup = {
        id: paymentGroupId,
        name: 'Credit Card Payments',
        sortOrder: 0,
      };

      const linkedPaymentCategory: Category = {
        id: paymentCategoryId,
        groupId: paymentGroupId,
        name: `${trimmedName} Payment`,
        targetCents: 0,
        targetType: 'NEEDED_FOR_SPENDING',
        assignedCents: 0,
        availableCents: 0,
        isCreditPayment: true,
        unfundedDebtCents: Math.abs(input.balanceCents),
      };

      const account: Account = {
        id,
        name: trimmedName,
        accountType: 'credit',
        balanceCents,
        creditPaymentCategoryId: paymentCategoryId,
      };

      return {
        account,
        linkedPaymentCategory,
        linkedCategoryGroup,
        readyToAssignInflowCents: 0,
      };
    }

    const balanceCents = input.balanceCents;
    const readyToAssignInflowCents = balanceCents > 0 ? balanceCents : 0;

    const account: Account = {
      id,
      name: trimmedName,
      accountType: input.accountType,
      balanceCents,
      creditPaymentCategoryId: undefined,
    };

    return {
      account,
      readyToAssignInflowCents,
    };
  }
}
