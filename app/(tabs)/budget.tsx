import React, { useState, useMemo, useCallback } from 'react';
import { StyleSheet, ScrollView, View, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { radius } from '@/src/theme/radius';
import { EnvelopePassFace } from '@/src/components/EnvelopePassFace';
import { useLedgerStore } from '@/src/storage/useLedgerStore';
import { formatCentsToCurrency } from '@/src/domain/ledger/currency';
import {
  QuickFillAction,
  calculateQuickFillAllocation,
  getReadyToAssignBannerState,
  ReadyToAssignBannerState,
  BudgetDisplayGroup,
  buildBudgetDisplayGroups,
  calculateBudgetTotals,
} from '@/src/domain/ledger/budgetViewHelpers';
import { Category } from '@/src/domain/ledger/types';

/**
 * Executes haptic feedback safely. Discarded if platform lacks haptic hardware.
 */
async function safeHaptic(action: () => Promise<unknown>): Promise<void> {
  try {
    await action();
  } catch (err: unknown) {
    console.debug('[safeHaptic] feedback skipped:', err);
  }
}

export interface BudgetViewProps {
  readyToAssignCents: number;
  bannerState: ReadyToAssignBannerState;
  totalAssignedCents: number;
  totalAvailableCents: number;
  displayGroups: BudgetDisplayGroup[];
  expandedCategoryId: string | null;
  onToggleExpand: (id: string) => void;
  onAllocateQuickFill: (categoryId: string, action: QuickFillAction) => void;
}

export function BudgetView({
  readyToAssignCents,
  bannerState,
  totalAssignedCents,
  totalAvailableCents,
  displayGroups,
  expandedCategoryId,
  onToggleExpand,
  onAllocateQuickFill,
}: BudgetViewProps): React.JSX.Element {
  const isOverAssigned = bannerState.isOverAssigned;
  const isPositive = bannerState.status === 'positive';

  const bannerColor = isOverAssigned
    ? colors.error
    : isPositive
    ? colors.success
    : colors.textSecondary;

  const pillBg = isOverAssigned
    ? 'rgba(255, 69, 58, 0.15)'
    : isPositive
    ? 'rgba(48, 209, 88, 0.15)'
    : colors.surface2;

  const pillBorder = isOverAssigned
    ? 'rgba(255, 69, 58, 0.3)'
    : isPositive
    ? 'rgba(48, 209, 88, 0.3)'
    : colors.hairline;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Ready to Assign PassKit Badge Header (SCEN-005 & SCEN-006) */}
      <View style={[styles.readyToAssignCard, isOverAssigned && styles.readyToAssignCardWarning]}>
        <View style={styles.readyToAssignTopRow}>
          <Text style={styles.readyToAssignSubtitle}>{bannerState.badgeText}</Text>
          <View style={[styles.zeroPill, { backgroundColor: pillBg, borderColor: pillBorder }]}>
            <Text style={[styles.zeroPillText, { color: bannerColor }]}>
              {bannerState.badgeText}
            </Text>
          </View>
        </View>

        <Text style={[typography.balanceHero, styles.readyToAssignAmount, { color: bannerColor }]}>
          {formatCentsToCurrency(readyToAssignCents)}
        </Text>
        <Text style={styles.readyToAssignDescription}>{bannerState.description}</Text>
      </View>

      {/* Summary Totals Row */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { marginRight: 6 }]}>
          <Text style={styles.summaryLabel}>TOTAL ASSIGNED</Text>
          <Text style={[typography.title, styles.summaryValue, { color: colors.textPrimary }]}>
            {formatCentsToCurrency(totalAssignedCents)}
          </Text>
        </View>
        <View style={[styles.summaryCard, { marginLeft: 6 }]}>
          <Text style={styles.summaryLabel}>TOTAL AVAILABLE</Text>
          <Text
            style={[
              typography.title,
              styles.summaryValue,
              { color: totalAvailableCents < 0 ? colors.error : colors.success },
            ]}
          >
            {formatCentsToCurrency(totalAvailableCents)}
          </Text>
        </View>
      </View>

      {/* Category Groups rendered with EnvelopePassFace cards */}
      {displayGroups.map((group) => (
        <View key={group.id} style={styles.groupSection}>
          <Text style={[typography.sectionHdr, styles.groupHeader]}>
            {group.name}
          </Text>
          <View style={styles.passesColumn}>
            {group.items.map((item) => (
              <EnvelopePassFace
                key={item.id}
                name={item.name}
                group={group.name}
                assignedCents={item.assignedCents}
                activityCents={item.activityCents}
                availableCents={item.availableCents}
                unfundedDebtCents={item.unfundedDebtCents}
                isExpanded={expandedCategoryId === item.id}
                onToggleExpand={() => onToggleExpand(item.id)}
                onAllocateQuickFill={(action) => onAllocateQuickFill(item.id, action)}
                style={styles.envelopePass}
              />
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

// Container Component
export default function BudgetScreen(): React.JSX.Element {
  const { state, groups, allocateEnvelope } = useLedgerStore();
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);

  const bannerState = useMemo(
    () => getReadyToAssignBannerState(state.readyToAssignCents),
    [state.readyToAssignCents]
  );

  // Group and sort categories using domain helper (SCEN-005 & SCEN-015)
  const displayGroups = useMemo(
    () => buildBudgetDisplayGroups(state.categories, groups),
    [state.categories, groups]
  );

  // Totals calculations in integer cents using domain helper
  const { totalAssignedCents, totalAvailableCents } = useMemo(
    () => calculateBudgetTotals(state.categories),
    [state.categories]
  );

  const handleToggleExpand = useCallback((id: string) => {
    void safeHaptic(() => Haptics.selectionAsync());
    setExpandedCategoryId((prev) => (prev === id ? null : id));
  }, []);

  const handleAllocateQuickFill = useCallback(
    (categoryId: string, action: QuickFillAction) => {
      const targetCat: Category | undefined = state.categories[categoryId];
      if (!targetCat) return;

      const newAssignedCents = calculateQuickFillAllocation(
        targetCat.assignedCents,
        state.readyToAssignCents,
        action
      );

      allocateEnvelope({
        categoryId,
        amountCents: newAssignedCents,
      });

      void safeHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
    },
    [state.categories, state.readyToAssignCents, allocateEnvelope]
  );

  return (
    <BudgetView
      readyToAssignCents={state.readyToAssignCents}
      bannerState={bannerState}
      totalAssignedCents={totalAssignedCents}
      totalAvailableCents={totalAvailableCents}
      displayGroups={displayGroups}
      expandedCategoryId={expandedCategoryId}
      onToggleExpand={handleToggleExpand}
      onAllocateQuickFill={handleAllocateQuickFill}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 18,
    paddingBottom: 40,
  },
  readyToAssignCard: {
    backgroundColor: colors.surface1,
    borderRadius: radius.card,
    padding: 20,
    borderWidth: 0.5,
    borderColor: colors.hairline,
    shadowColor: colors.canvas,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  readyToAssignCardWarning: {
    borderColor: colors.error,
  },
  readyToAssignTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  readyToAssignSubtitle: {
    ...typography.sectionHdr,
    color: colors.textSecondary,
    letterSpacing: 0.8,
  },
  zeroPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 0.5,
  },
  zeroPillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  readyToAssignAmount: {
    marginTop: 6,
    marginBottom: 4,
  },
  readyToAssignDescription: {
    ...typography.footnote,
    color: colors.textSecondary,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: radius.card,
    backgroundColor: colors.surface1,
    borderWidth: 0.5,
    borderColor: colors.hairline,
  },
  summaryLabel: {
    ...typography.sectionHdr,
    fontSize: 11,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 20,
    marginTop: 6,
    fontVariant: ['tabular-nums'],
  },
  groupSection: {
    gap: 12,
  },
  groupHeader: {
    paddingHorizontal: 4,
    color: colors.textSecondary,
  },
  passesColumn: {
    gap: 14,
  },
  envelopePass: {
    marginHorizontal: 0,
  },
});
