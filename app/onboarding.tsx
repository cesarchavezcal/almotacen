import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/src/theme';
import { LedgerRepository } from '@/src/storage/types';
import { useOnboardingWizard } from '@/src/hooks/useOnboardingWizard';
import { OnboardingWizardView } from '@/src/components/onboarding/OnboardingWizardView';

export interface OnboardingScreenProps {
  testRepo?: LedgerRepository;
}

export default function OnboardingScreen({
  testRepo,
}: OnboardingScreenProps = {}): React.JSX.Element {
  const wizardProps = useOnboardingWizard(testRepo);
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <OnboardingWizardView {...wizardProps} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
});
