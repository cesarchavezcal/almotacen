import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { spacing } from '@/src/theme/spacing';
import { radius } from '@/src/theme/radius';

export interface MonthPagingHeaderProps {
  cycleTitle: string;
  isCurrentMonth: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onCurrentMonth?: () => void;
  isNextDisabled?: boolean;
}

export function MonthPagingHeader({
  cycleTitle,
  isCurrentMonth,
  onPrevMonth,
  onNextMonth,
  onCurrentMonth,
  isNextDisabled = false,
}: MonthPagingHeaderProps): React.JSX.Element {
  const handlePrev = (): void => {
    Haptics.selectionAsync().catch((err: unknown) => {
      console.warn('Haptic selection failed in MonthPagingHeader:', err);
    });
    onPrevMonth();
  };

  const handleNext = (): void => {
    if (isNextDisabled) return;
    Haptics.selectionAsync().catch((err: unknown) => {
      console.warn('Haptic selection failed in MonthPagingHeader:', err);
    });
    onNextMonth();
  };

  const handleCurrent = (): void => {
    if (onCurrentMonth) {
      Haptics.selectionAsync().catch((err: unknown) => {
        console.warn('Haptic selection failed in MonthPagingHeader:', err);
      });
      onCurrentMonth();
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.navButton}
        onPress={handlePrev}
        accessibilityRole="button"
        accessibilityLabel="Previous month"
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        activeOpacity={0.7}
      >
        <Text style={styles.chevronText}>‹</Text>
      </TouchableOpacity>

      <View style={styles.titleContainer}>
        <Text style={styles.cycleTitle} numberOfLines={1}>
          {cycleTitle}
        </Text>
        {!isCurrentMonth && onCurrentMonth && (
          <TouchableOpacity
            style={styles.currentBadge}
            onPress={handleCurrent}
            accessibilityRole="button"
            accessibilityLabel="Return to current month"
            activeOpacity={0.8}
          >
            <Text style={styles.currentBadgeText}>Current</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={[styles.navButton, isNextDisabled && styles.navButtonDisabled]}
        onPress={handleNext}
        disabled={isNextDisabled}
        accessibilityRole="button"
        accessibilityLabel="Next month"
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        activeOpacity={0.7}
      >
        <Text style={[styles.chevronText, isNextDisabled && styles.chevronDisabled]}>
          ›
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  cycleTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  currentBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: colors.surface2,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
  },
  currentBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    letterSpacing: 0.1,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.surface1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
  },
  navButtonDisabled: {
    opacity: 0.35,
  },
  chevronText: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 24,
    textAlign: 'center',
  },
  chevronDisabled: {
    color: colors.textTertiary,
  },
});
