import React, { forwardRef } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  StyleProp,
  TextStyle,
  View,
  PressableProps,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, radius, typography } from '@/src/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const sizeStyles: Record<ButtonSize, ViewStyle> = {
  sm: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    minHeight: 32,
  },
  md: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    minHeight: 44,
  },
  lg: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 52,
  },
};

const sizeTextStyles: Record<ButtonSize, TextStyle> = {
  sm: {
    fontSize: typography.footnote.fontSize,
    lineHeight: 16,
  },
  md: {
    fontSize: typography.body.fontSize,
    lineHeight: 22,
  },
  lg: {
    fontSize: 18,
    lineHeight: 24,
  },
};

const variantStyles: Record<ButtonVariant, ViewStyle> = {
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.surfaceCardSubtle,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
};

const pressedVariantStyles: Record<ButtonVariant, ViewStyle> = {
  primary: {
    backgroundColor: colors.primaryDark,
    opacity: 0.9,
  },
  secondary: {
    backgroundColor: colors.pressedOverlay,
  },
  ghost: {
    opacity: 0.6,
  },
};

const variantTextStyles: Record<ButtonVariant, TextStyle> = {
  primary: {
    color: colors.onPrimary,
  },
  secondary: {
    color: colors.label,
  },
  ghost: {
    color: colors.primary,
  },
};

export const Button = forwardRef<View, ButtonProps>(function Button(
  {
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    style,
    textStyle,
    accessibilityLabel,
    ...rest
  },
  ref
) {
  const isInactive = Boolean(disabled || loading);

  return (
    <Pressable
      ref={ref}
      onPress={isInactive ? undefined : onPress}
      disabled={isInactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: isInactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        variantStyles[variant],
        pressed && !isInactive && pressedVariantStyles[variant],
        isInactive && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variantTextStyles[variant].color}
          style={styles.spinner}
        />
      ) : null}
      <Text
        style={[
          styles.baseText,
          sizeTextStyles[size],
          variantTextStyles[variant],
          loading && styles.hiddenText,
          textStyle,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  baseText: {
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.5,
  },
  spinner: {
    marginRight: spacing.xs,
  },
  hiddenText: {
    opacity: 0.7,
  },
});
