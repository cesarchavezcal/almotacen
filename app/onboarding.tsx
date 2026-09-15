import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { colors, spacing, typography } from '@/src/theme';

export default function OnboardingScreen(): React.JSX.Element {
  return (
    <View style={styles.container} testID="onboarding-screen">
      <Text style={styles.title}>Welcome to Almotacen</Text>
      <Text style={styles.subtitle}>
        Configure your cash flow and financial envelopes.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  title: {
    ...typography.headline,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.subhead,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
