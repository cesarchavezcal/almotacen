import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/src/theme';
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
