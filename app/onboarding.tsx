import React from 'react';
import { DatabaseAdapter } from '@/src/storage/types';
import { useOnboardingWizard } from '@/src/hooks/useOnboardingWizard';
import { OnboardingWizardView } from '@/src/components/onboarding/OnboardingWizardView';

export interface OnboardingScreenProps {
  testDb?: DatabaseAdapter;
}

export default function OnboardingScreen({
  testDb,
}: OnboardingScreenProps = {}): React.JSX.Element {
  const wizardProps = useOnboardingWizard(testDb);
  return <OnboardingWizardView {...wizardProps} />;
}
