import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, Pressable } from 'react-native';
import { colors, typography, radius, shadows, spacing } from '@/src/theme';

import { formatCentsToCurrency } from '../domain/ledger/currency';
import { QuickFillAction, getEnvelopeBadge } from '../domain/ledger/budgetViewHelpers';

export interface EnvelopePassFaceProps {
  name: string;
  group?: string;
  assignedCents: number;
  activityCents: number;
  availableCents: number;
  unfundedDebtCents?: number;
  accentColor?: string;
  style?: StyleProp<ViewStyle>;
  isExpanded?: boolean;
  accessible?: boolean;
  accessibilityLabel?: string;
  onToggleExpand?: () => void;
  onAllocateQuickFill?: (action: QuickFillAction) => void;
  onCoverOverspending?: () => void;
}

export function EnvelopePassFace({
  name,
  group,
  assignedCents,
  activityCents,
  availableCents,
  unfundedDebtCents,
  accentColor = colors.systemBlue,
  style,
  isExpanded,
  accessible = true,
  accessibilityLabel,
  onToggleExpand,
  onAllocateQuickFill,
  onCoverOverspending,
}: EnvelopePassFaceProps): React.JSX.Element {
  const badge = getEnvelopeBadge({
    availableCents,
    unfundedDebtCents,
  });

  const isOverspent = availableCents < 0;
  const isDepleted = availableCents === 0 && !unfundedDebtCents;
  const hasDeficit = isOverspent || (unfundedDebtCents !== undefined && unfundedDebtCents > 0);
  const spentPercent = assignedCents > 0
    ? Math.min(100, Math.round((Math.abs(activityCents) / assignedCents) * 100))
    : 0;

  let statusBg = 'rgba(48,209,88,0.15)';
  let statusColor: string = colors.success;

  if (badge.type === 'credit_debt') {
    statusBg = 'rgba(255,159,10,0.15)';
    statusColor = colors.warning;
  } else if (badge.type === 'cash_overspent') {
    statusBg = 'rgba(255,69,58,0.15)';
    statusColor = colors.error;
  } else if (badge.type === 'depleted') {
    statusBg = colors.surface2;
    statusColor = colors.textTertiary;
  }

  const defaultLabel = `Envelope ${name}${group ? `, ${group}` : ''}, Available Balance ${formatCentsToCurrency(
    availableCents
  )}, Status ${badge.label}`;

  return (
    <View
      accessible={accessible}
      accessibilityLabel={accessibilityLabel || defaultLabel}
      style={[styles.shadow, style]}
    >
      <View style={[styles.frame, isExpanded && styles.frameExpanded]}>
        {/* Top Section */}
        <Pressable
          onPress={onToggleExpand}
          style={styles.topSection}
          accessibilityRole="button"
        >
          <View style={styles.headerLeft}>
            {group ? <Text style={styles.groupLabel}>{group.toUpperCase()}</Text> : null}
            <Text style={[typography.headline, { color: colors.textPrimary }]} numberOfLines={1}>
              {name}
            </Text>
          </View>
          {hasDeficit && onCoverOverspending ? (
            <Pressable
              onPress={() => onCoverOverspending()}
              style={[styles.statusPill, { backgroundColor: statusBg }]}
              accessibilityRole="button"
              accessibilityLabel={`Cover ${badge.label}`}
            >
              <Text style={[styles.statusText, { color: statusColor }]}>
                {badge.label} ↗
              </Text>
            </Pressable>
          ) : (
            <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{badge.label}</Text>
            </View>
          )}
        </Pressable>

        {/* Perforated Divider with Cutout Notches */}
        <View style={styles.notchContainer}>
          <View style={styles.leftNotch} />
          <View style={styles.dashedDivider} />
          <View style={styles.rightNotch} />
        </View>

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          <View style={styles.balanceRow}>
            <View>
              <Text style={styles.availableLabel}>Available Balance</Text>
              <Text
                style={[
                  typography.title,
                  styles.availableAmount,
                  { color: isOverspent ? colors.error : colors.textPrimary },
                ]}
              >
                {formatCentsToCurrency(availableCents)}
              </Text>
            </View>
            <View style={styles.statsCol}>
              <Text style={styles.statDetail}>
                Assigned: <Text style={styles.statBold}>{formatCentsToCurrency(assignedCents)}</Text>
              </Text>
              <Text style={styles.statDetail}>
                Activity: <Text style={[styles.statBold, { color: colors.outflow }]}>{formatCentsToCurrency(activityCents)}</Text>
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${spentPercent}%`,
                  backgroundColor: isOverspent ? colors.error : isDepleted ? colors.textTertiary : accentColor,
                },
              ]}
            />
          </View>
          <View style={styles.progressFooter}>
            <Text style={styles.progressText}>{spentPercent}% spent</Text>
            <Text style={styles.progressText}>Zero-Based Envelope</Text>
          </View>

          {/* 1-Tap Quick-Fill Pills (SCEN-014) */}
          {onAllocateQuickFill && isExpanded && (
            <View style={styles.quickFillSection}>
              <Text style={styles.quickFillHeader}>QUICK ALLOCATE</Text>
              <View style={styles.quickFillRow}>
                <Pressable
                  style={styles.quickFillPill}
                  onPress={() => onAllocateQuickFill('add_50')}
                >
                  <Text style={styles.quickFillText}>+$50</Text>
                </Pressable>
                <Pressable
                  style={styles.quickFillPill}
                  onPress={() => onAllocateQuickFill('add_100')}
                >
                  <Text style={styles.quickFillText}>+$100</Text>
                </Pressable>
                <Pressable
                  style={[styles.quickFillPill, styles.quickFillFillAll]}
                  onPress={() => onAllocateQuickFill('fill_remaining')}
                >
                  <Text style={[styles.quickFillText, styles.quickFillFillAllText]}>
                    Fill Remaining
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.quickFillPill, styles.quickFillSub]}
                  onPress={() => onAllocateQuickFill('sub_50')}
                >
                  <Text style={styles.quickFillText}>-$50</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        <View style={styles.innerHighlight} pointerEvents="none" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    ...shadows.hero,
    marginHorizontal: spacing.md,
  },
  frame: {
    height: 220,
    borderRadius: radius.card,
    borderCurve: 'continuous',
    overflow: 'hidden',
    backgroundColor: colors.surface1,
    borderWidth: 0.5,
    borderColor: colors.hairline,
  },
  topSection: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
    marginRight: 10,
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  notchContainer: {
    height: 20,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftNotch: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.canvas,
    marginLeft: -10,
  },
  rightNotch: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.canvas,
    marginRight: -10,
  },
  dashedDivider: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderStyle: 'dashed',
    marginHorizontal: 4,
  },
  bottomSection: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 16,
    justifyContent: 'space-between',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  availableLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  availableAmount: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  statsCol: {
    alignItems: 'flex-end',
    gap: 2,
  },
  statDetail: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statBold: {
    fontWeight: '600',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surface2,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  progressText: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  quickFillSection: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: colors.hairline,
    gap: 8,
  },
  quickFillHeader: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.textTertiary,
  },
  quickFillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  quickFillPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.surface2,
    borderWidth: 0.5,
    borderColor: colors.hairline,
  },
  quickFillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  quickFillFillAll: {
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
    borderColor: 'rgba(48, 209, 88, 0.3)',
  },
  quickFillFillAllText: {
    color: colors.success,
    fontWeight: '700',
  },
  quickFillSub: {
    backgroundColor: 'rgba(255, 69, 58, 0.12)',
    borderColor: 'rgba(255, 69, 58, 0.25)',
  },
  frameExpanded: {
    minHeight: 280,
  },
  innerHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 0.5,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
});
