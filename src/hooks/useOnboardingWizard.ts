import { useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { DatabaseAdapter } from '../storage/types';
import { getDatabase } from '../storage/database';
import { seedDemoData } from '../storage/schema';
import { createOnboardingRepository } from '../storage/onboardingRepository';
import {
  ArchetypePresetId,
  CommitOnboardingConfigParams,
} from '../domain/onboarding/types';
import {
  getArchetypeTemplate,
  calculateInitialAllocation,
} from '../domain/onboarding/archetypes';
import {
  commitOnboardingConfig,
  OnboardingValidationError,
} from '../domain/onboarding/onboardingService';
import { parseCurrencyToCents } from '../domain/ledger/currency';
import {
  WizardStep,
  OnboardingWizardViewProps,
} from '../components/onboarding/OnboardingWizardView';

export interface CommitWizardInputs {
  checkingName: string;
  checkingBalanceText: string;
  hasCreditCard: boolean;
  creditCardName: string;
  creditCardDebtText: string;
  selectedArchetypeId: ArchetypePresetId;
}

function nextWizardStep(current: WizardStep): WizardStep {
  switch (current) {
    case 1:
      return 2;
    case 2:
      return 3;
    case 3:
      return 4;
    case 4:
      return 4;
  }
}

function prevWizardStep(current: WizardStep): WizardStep {
  switch (current) {
    case 4:
      return 3;
    case 3:
      return 2;
    case 2:
      return 1;
    case 1:
      return 1;
  }
}

export function executeExploreDemo(
  db: DatabaseAdapter,
  onSuccessNavigate: () => void
): void {
  seedDemoData(db);
  void Haptics.notificationAsync?.(Haptics.NotificationFeedbackType.Success);
  onSuccessNavigate();
}

export function executeCommitOnboarding(
  db: DatabaseAdapter,
  inputs: CommitWizardInputs,
  onSuccessNavigate: () => void
): void {
  const checkingName = inputs.checkingName.trim();
  if (!checkingName) {
    throw new OnboardingValidationError('Please provide a name for your checking account.');
  }

  const startingCashCents = parseCurrencyToCents(inputs.checkingBalanceText);
  if (startingCashCents < 0) {
    throw new OnboardingValidationError('Starting checking balance cannot be negative.');
  }

  const creditCardDebtCents = parseCurrencyToCents(inputs.creditCardDebtText);
  const creditCardName = inputs.creditCardName.trim();
  if (inputs.hasCreditCard && !creditCardName) {
    throw new OnboardingValidationError('Please provide a name for your credit card.');
  }

  const template = getArchetypeTemplate(inputs.selectedArchetypeId);
  const allocationResult = calculateInitialAllocation(
    startingCashCents,
    template.categories
  );

  const repo = createOnboardingRepository(db);
  const params: CommitOnboardingConfigParams = {
    depositoryAccount: {
      name: checkingName,
      startingBalanceCents: startingCashCents,
    },
    creditCardAccount: inputs.hasCreditCard
      ? {
          name: creditCardName,
          startingDebtCents: creditCardDebtCents,
        }
      : undefined,
    template,
    allocations: allocationResult.allocations,
    remainingReadyToAssignCents: allocationResult.remainingReadyToAssignCents,
  };

  commitOnboardingConfig(repo, params);
  void Haptics.notificationAsync?.(Haptics.NotificationFeedbackType.Success);
  onSuccessNavigate();
}

export function useOnboardingWizard(
  customDb?: DatabaseAdapter
): OnboardingWizardViewProps {
  const router = useRouter();
  const db = customDb ?? getDatabase();

  const [step, setStep] = useState<WizardStep>(1);
  const [checkingName, setCheckingName] = useState<string>('Primary Checking');
  const [checkingBalanceText, setCheckingBalanceText] = useState<string>('2000.00');
  const [hasCreditCard, setHasCreditCard] = useState<boolean>(false);
  const [creditCardName, setCreditCardName] = useState<string>('Credit Card');
  const [creditCardDebtText, setCreditCardDebtText] = useState<string>('0.00');
  const [selectedArchetypeId, setSelectedArchetypeId] =
    useState<ArchetypePresetId>('STANDARD_BALANCED');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const template = useMemo(
    () => getArchetypeTemplate(selectedArchetypeId),
    [selectedArchetypeId]
  );

  const startingCashCents = useMemo(
    () => parseCurrencyToCents(checkingBalanceText),
    [checkingBalanceText]
  );

  const creditCardDebtCents = useMemo(
    () => parseCurrencyToCents(creditCardDebtText),
    [creditCardDebtText]
  );

  const allocationResult = useMemo(
    () => calculateInitialAllocation(startingCashCents, template.categories),
    [startingCashCents, template.categories]
  );

  const handleNextStep = (): void => {
    setErrorMessage(null);

    if (step === 2) {
      if (!checkingName.trim()) {
        setErrorMessage('Please provide a name for your checking account.');
        return;
      }
      if (startingCashCents < 0) {
        setErrorMessage('Starting checking balance cannot be negative.');
        return;
      }
      if (hasCreditCard && !creditCardName.trim()) {
        setErrorMessage('Please provide a name for your credit card.');
        return;
      }
    }

    if (step < 4) {
      setStep(nextWizardStep);
    }
  };

  const handlePrevStep = (): void => {
    setErrorMessage(null);
    if (step > 1) {
      setStep(prevWizardStep);
    }
  };

  const handleExploreDemo = (): void => {
    try {
      executeExploreDemo(db, () => {
        router.replace('/(tabs)');
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Failed to seed demo data: ${message}`);
    }
  };

  const handleCommit = (): void => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      executeCommitOnboarding(
        db,
        {
          checkingName,
          checkingBalanceText,
          hasCreditCard,
          creditCardName,
          creditCardDebtText,
          selectedArchetypeId,
        },
        () => {
          router.replace('/(tabs)');
        }
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Failed to configure onboarding: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    step,
    checkingName,
    checkingBalanceText,
    hasCreditCard,
    creditCardName,
    creditCardDebtText,
    selectedArchetypeId,
    template,
    allocations: allocationResult.allocations,
    startingCashCents,
    totalAssignedCents: allocationResult.totalAssignedCents,
    remainingReadyToAssignCents: allocationResult.remainingReadyToAssignCents,
    errorMessage,
    isSubmitting,
    onNextStep: handleNextStep,
    onPrevStep: handlePrevStep,
    onExploreDemo: handleExploreDemo,
    onChangeCheckingName: setCheckingName,
    onChangeCheckingBalanceText: setCheckingBalanceText,
    onToggleCreditCard: setHasCreditCard,
    onChangeCreditCardName: setCreditCardName,
    onChangeCreditCardDebtText: setCreditCardDebtText,
    onSelectArchetype: setSelectedArchetypeId,
    onCommit: handleCommit,
  };
}
