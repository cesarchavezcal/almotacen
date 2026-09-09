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
} from 'react-native';
import { colors, spacing, radius } from '@/src/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const sizeStyles: Record<ButtonSize, ViewStyle> = {
  sm: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  md: {
    paddingVertical: spacing.md - 2,
    paddingHorizontal: spacing.md,
  },
  lg: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
};

const sizeTextStyles: Record<ButtonSize, TextStyle> = {
  sm: {
    fontSize: 13,
  },
  md: {
    fontSize: 16,
  },
  lg: {
    fontSize: 18,
  },
};

const variantStyles: Record<ButtonVariant, ViewStyle> = {
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.surfaceCardSubtle,
    borderWidth: 1,
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
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
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
    style,
    textStyle,
    ...rest
  },
  ref
) {
  return (
    <Pressable
      ref={ref}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        variantStyles[variant],
        pressed && pressedVariantStyles[variant],
        disabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      <Text
        style={[
          styles.baseText,
          sizeTextStyles[size],
          variantTextStyles[variant],
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
});
