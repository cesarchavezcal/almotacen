import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, spacing, radius, shadows } from '@/src/theme';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'outline' | 'hero';
  style?: StyleProp<ViewStyle>;
  accessible?: boolean;
  accessibilityLabel?: string;
}

export function Card({
  children,
  variant = 'outline',
  style,
  accessible = true,
  accessibilityLabel,
}: CardProps): React.JSX.Element {
  return (
    <View
      accessible={accessible}
      accessibilityLabel={accessibilityLabel}
      style={[styles.base, variantStyles[variant], style]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.card,
    padding: spacing.md,
  },
});

const variantStyles: Record<'elevated' | 'outline' | 'hero', ViewStyle> = {
  hero: {
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.card,
    padding: spacing.lg,
    borderWidth: 0.5,
    borderColor: colors.hairline,
    ...shadows.hero,
  },
  outline: {
    backgroundColor: colors.surfaceCard,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: radius.card,
  },
  elevated: {
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.card,
    borderWidth: 0.5,
    borderColor: colors.hairline,
    ...shadows.card,
  },
};
