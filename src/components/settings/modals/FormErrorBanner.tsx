import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { radius } from '@/src/theme/radius';

export interface FormErrorBannerProps {
  message?: string | null;
  onDismiss?: () => void;
  testID?: string;
}

export function FormErrorBanner({
  message,
  onDismiss,
  testID = 'form-error-banner',
}: FormErrorBannerProps): React.JSX.Element | null {
  if (!message) return null;

  return (
    <View testID={testID} accessibilityRole="alert" style={styles.container}>
      <Ionicons name="alert-circle" size={20} color={colors.error} style={styles.icon} />
      <Text style={styles.messageText}>{message}</Text>
      {onDismiss && (
        <Pressable
          testID={`${testID}-dismiss`}
          accessibilityRole="button"
          accessibilityLabel="Dismiss error"
          onPress={onDismiss}
          style={({ pressed }) => [styles.dismissButton, pressed && styles.dismissButtonPressed]}
        >
          <Ionicons name="close" size={16} color={colors.textSecondary} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.outflowBg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.error,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },
  icon: {
    marginRight: 2,
  },
  messageText: {
    ...typography.footnote,
    color: colors.error,
    flex: 1,
    lineHeight: 18,
  },
  dismissButton: {
    padding: 4,
  },
  dismissButtonPressed: {
    opacity: 0.6,
  },
});
