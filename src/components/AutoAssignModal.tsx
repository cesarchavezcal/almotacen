import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, typography } from '@/src/theme';
import { Button } from './Button';
import { Category, CategoryGroup } from '@/src/domain/ledger/types';
import { formatCentsToCurrency } from '@/src/domain/ledger/currency';
import {
  buildAutoAssignPreview,
  AutoAssignPreviewItem,
} from '@/src/domain/ledger/budgetViewHelpers';

export interface AutoAssignModalProps {
  visible: boolean;
  readyToAssignCents: number;
  categories: Record<string, Category>;
  groups: CategoryGroup[];
  onConfirm: () => void;
  onClose: () => void;
}

async function safeHaptic(action: () => Promise<unknown>): Promise<void> {
  try {
    await action();
  } catch (err: unknown) {
    console.debug('[safeHaptic] feedback skipped:', err);
  }
}

export function AutoAssignModal({
  visible,
  readyToAssignCents,
  categories,
  groups,
  onConfirm,
  onClose,
}: AutoAssignModalProps): React.JSX.Element {
  const preview = useMemo(
    () => buildAutoAssignPreview(readyToAssignCents, categories, groups),
    [readyToAssignCents, categories, groups]
  );

  const handleConfirm = async (): Promise<void> => {
    await safeHaptic(() =>
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    );
    onConfirm();
  };

  const handleClose = async (): Promise<void> => {
    await safeHaptic(() => Haptics.selectionAsync());
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <View style={styles.sheet}>
          {/* Top Grab Handle */}
          <View style={styles.grabHandle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={[typography.sheetTitle, styles.title]}>
              Auto-Assign Payday
            </Text>
            <Text style={[typography.footnote, styles.subtitle]}>
              Prioritizes overspent envelopes, immediate bills, and upcoming due dates.
            </Text>
          </View>

          {/* Balance Hero Card */}
          <View style={styles.heroCard}>
            <View style={styles.heroRow}>
              <View>
                <Text style={styles.heroLabel}>READY TO ASSIGN</Text>
                <Text style={[typography.balanceHero, styles.heroAmount]}>
                  {formatCentsToCurrency(readyToAssignCents)}
                </Text>
              </View>
              <View style={styles.pillContainer}>
                <View style={styles.assignedPill}>
                  <Text style={styles.assignedPillText}>
                    Allocating {formatCentsToCurrency(preview.totalAllocatedCents)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Breakdown List */}
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[typography.sectionHdr, styles.sectionHeader]}>
              PROPOSED ALLOCATIONS ({preview.items.length})
            </Text>

            {preview.items.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={[typography.body, styles.emptyText]}>
                  {readyToAssignCents <= 0
                    ? 'No funds available to assign.'
                    : 'All category targets are already fully funded! 🎉'}
                </Text>
              </View>
            ) : (
              preview.items.map((item: AutoAssignPreviewItem) => (
                <View key={item.categoryId} style={styles.allocationRow}>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.groupName}>{item.groupName}</Text>
                    <Text style={[typography.bodyMedium, styles.categoryName]}>
                      {item.categoryName}
                    </Text>
                    {item.targetDueDay ? (
                      <Text style={styles.targetDueText}>
                        Due on day {item.targetDueDay}
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.amountInfo}>
                    <Text style={[typography.action, styles.allocatedAmount]}>
                      +{formatCentsToCurrency(item.allocatedCents)}
                    </Text>
                    <Text style={styles.newBalanceText}>
                      New: {formatCentsToCurrency(item.newAvailableCents)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footer}>
            <Button
              title={
                preview.totalAllocatedCents > 0
                  ? `Assign ${formatCentsToCurrency(preview.totalAllocatedCents)}`
                  : 'Done'
              }
              onPress={handleConfirm}
              disabled={preview.totalAllocatedCents === 0}
              size="lg"
              style={styles.confirmButton}
            />
            <Button
              title="Cancel"
              variant="ghost"
              onPress={handleClose}
              size="md"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: colors.surface1,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    borderWidth: 0.5,
    borderColor: colors.hairline,
    maxHeight: '85%',
    paddingBottom: spacing.lg,
  },
  grabHandle: {
    width: 36,
    height: 5,
    borderRadius: radius.full,
    backgroundColor: colors.surface2,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
  },
  subtitle: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  heroCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface2,
    borderRadius: radius.card,
    borderWidth: 0.5,
    borderColor: colors.hairline,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLabel: {
    ...typography.sectionHdr,
    color: colors.textSecondary,
    fontSize: 11,
  },
  heroAmount: {
    fontSize: 28,
    lineHeight: 34,
    color: colors.success,
  },
  pillContainer: {
    alignItems: 'flex-end',
  },
  assignedPill: {
    backgroundColor: colors.inflowBg,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 0.5,
    borderColor: 'rgba(48, 209, 88, 0.3)',
  },
  assignedPillText: {
    ...typography.footnote,
    fontWeight: '600',
    color: colors.success,
  },
  list: {
    maxHeight: 280,
    paddingHorizontal: spacing.lg,
  },
  listContent: {
    paddingBottom: spacing.md,
  },
  sectionHeader: {
    marginBottom: spacing.sm,
    color: colors.textTertiary,
  },
  emptyState: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
  allocationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.hairline,
  },
  categoryInfo: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  groupName: {
    ...typography.caption,
    color: colors.textTertiary,
    textTransform: 'uppercase',
  },
  categoryName: {
    color: colors.textPrimary,
    marginTop: 1,
  },
  targetDueText: {
    ...typography.caption,
    color: colors.warning,
    marginTop: 2,
  },
  amountInfo: {
    alignItems: 'flex-end',
  },
  allocatedAmount: {
    color: colors.success,
    fontSize: 16,
  },
  newBalanceText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.xs,
  },
  confirmButton: {
    backgroundColor: colors.systemBlue,
  },
});
