import {
  CommitOnboardingConfigParams,
  ValidatedOnboardingConfig,
  OnboardingRepository,
} from './types';

export class OnboardingValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OnboardingValidationError';
  }
}

export function validateOnboardingConfig(
  params: CommitOnboardingConfigParams
): ValidatedOnboardingConfig {
  const depositoryName = params.depositoryAccount.name.trim();
  if (!depositoryName) {
    throw new OnboardingValidationError('Depository account name cannot be empty.');
  }

  const depositoryBalance = Math.floor(params.depositoryAccount.startingBalanceCents);
  if (depositoryBalance < 0) {
    throw new OnboardingValidationError('Starting checking balance cannot be negative.');
  }

  let creditCardAccount: ValidatedOnboardingConfig['creditCardAccount'] | undefined = undefined;
  if (params.creditCardAccount) {
    const creditCardName = params.creditCardAccount.name.trim();
    if (!creditCardName) {
      throw new OnboardingValidationError('Credit card account name cannot be empty.');
    }
    const creditCardDebt = Math.floor(params.creditCardAccount.startingDebtCents);
    if (creditCardDebt < 0) {
      throw new OnboardingValidationError('Credit card starting debt cannot be negative.');
    }
    creditCardAccount = {
      id: params.creditCardAccount.id ?? 'acc-credit',
      name: creditCardName,
      startingDebtCents: creditCardDebt,
    };
  }

  const remainingReadyToAssignCents = Math.floor(params.remainingReadyToAssignCents);
  if (remainingReadyToAssignCents < 0) {
    throw new OnboardingValidationError('Remaining Ready to Assign cannot be negative.');
  }

  const totalAllocated = Object.values(params.allocations).reduce(
    (sum, val) => sum + Math.max(0, Math.floor(val)),
    0
  );

  if (totalAllocated + remainingReadyToAssignCents !== depositoryBalance) {
    throw new OnboardingValidationError(
      `Zero-based cash invariant violated: sum of allocated cents (${totalAllocated}) plus remaining ready-to-assign (${remainingReadyToAssignCents}) must equal starting checking balance (${depositoryBalance}).`
    );
  }

  return {
    depositoryAccount: {
      id: params.depositoryAccount.id ?? 'acc-checking',
      name: depositoryName,
      startingBalanceCents: depositoryBalance,
    },
    creditCardAccount,
    template: params.template,
    allocations: params.allocations,
    remainingReadyToAssignCents: remainingReadyToAssignCents,
  };
}

export function commitOnboardingConfig(
  repo: OnboardingRepository,
  params: CommitOnboardingConfigParams
): void {
  const validated = validateOnboardingConfig(params);
  repo.commitOnboardingConfig(validated);
}
