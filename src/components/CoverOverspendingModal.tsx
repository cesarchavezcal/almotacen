import React, { useState, useMemo } from 'react';
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
  getDonorCategories,
  getCategoryDeficit,
  DonorCategoryItem,
} from '@/src/domain/ledger/budgetViewHelpers';

export interface CoverOverspendingModalProps {
  visible: boolean;
  targetCategory: Category | null;
  categories: Record<string, Category>;
  groups: CategoryGroup[];
  onConfirm: (sourceCategoryId: string, amountCents: number) => void;
  onClose: () => void;
}

async function safeHaptic(action: () => Promise<unknown>): Promise<void> {
  try {
    await action();
  } catch (err: unknown) {
    console.debug('[safeHaptic] feedback skipped:', err);
  }
}

export function CoverOverspendingModal({
  visible,
  targetCategory,
  categories,
  groups,
  onConfirm,
  onClose,
}: CoverOverspendingModalProps): React.JSX.Element {
  const [selectedDonorId, setSelectedDonorId] = useState<string | null>(null);

  const deficit = useMemo(() => {
    if (!targetCategory) return { deficitCents: 0, isCreditDebt: false };
    return getCategoryDeficit(targetCategory);
  }, [targetCategory]);

  const donorCategories = useMemo(() => {
    if (!targetCategory) return [];
    return getDonorCategories(targetCategory.id, categories, groups);
  }, [targetCategory, categories, groups]);

  const selectedDonor = useMemo(() => {
    if (!selectedDonorId || !categories[selectedDonorId]) return null;
    return categories[selectedDonorId];
  }, [selectedDonorId, categories]);

  const transferAmountCents = useMemo(() => {
    if (!selectedDonor || deficit.deficitCents <= 0) return 0;
    return Math.min(selectedDonor.availableCents, deficit.deficitCents);
  }, [selectedDonor, deficit.deficitCents]);

  const handleSelectDonor = async (id: string): Promise<void> => {
    await safeHaptic(() => Haptics.selectionAsync());
    setSelectedDonorId(id);
  };

  const handleConfirm = async (): Promise<void> => {
    if (!selectedDonorId || transferAmountCents <= 0) return;
    await safeHaptic(() =>
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    );
    onConfirm(selectedDonorId, transferAmountCents);
    setSelectedDonorId(null);
  };

  const handleClose = async (): Promise<void> => {
    await safeHaptic(() => Haptics.selectionAsync());
    setSelectedDonorId(null);
    onClose();
  };

  if (!targetCategory) {
    return <></>;
  }

  const isCreditDebt = deficit.isCreditDebt;
  const badgeColor = isCreditDebt ? colors.warning : colors.error;
  const badgeBg = isCreditDebt
    ? 'rgba(255, 159, 10, 0.15)'
    : 'rgba(255, 69, 58, 0.15)';
  const badgeBorder = isCreditDebt
    ? 'rgba(255, 159, 10, 0.3)'
    : 'rgba(255, 69, 58, 0.3)';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <View style={styles.sheet}>
          {/* Grab Handle */}
          <View style={styles.grabHandle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={[typography.sheetTitle, styles.title]}>
              Cover Overspending
            </Text>
            <Text style={[typography.footnote, styles.subtitle]}>
              Rebalance funds from another envelope to restore this category.
            </Text>
          </View>

          {/* Target Category Deficit Card */}
          <View style={styles.deficitCard}>
            <View style={styles.deficitTopRow}>
              <View>
                <Text style={styles.categoryNameText}>{targetCategory.name}</Text>
                <Text style={styles.deficitSubtext}>Current Deficit</Text>
              </View>
              <View
                style={[
                  styles.badgePill,
                  { backgroundColor: badgeBg, borderColor: badgeBorder },
                ]}
              >
                <Text style={[styles.badgePillText, { color: badgeColor }]}>
                  {isCreditDebt ? 'CREDIT DEBT' : 'CASH OVERSPENT'}
                </Text>
              </View>
            </View>
            <Text style={[typography.title, styles.deficitAmount, { color: badgeColor }]}>
              -{formatCentsToCurrency(deficit.deficitCents)}
            </Text>
          </View>

          {/* Donor Selection List */}
          <ScrollView
            style={styles.donorList}
            contentContainerStyle={styles.donorListContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[typography.sectionHdr, styles.sectionHeader]}>
              SELECT DONOR ENVELOPE ({donorCategories.length})
            </Text>

            {donorCategories.length === 0 ? (
              <View style={styles.emptyDonors}>
                <Text style={[typography.body, styles.emptyText]}>
                  No envelopes currently have available funds to cover this deficit.
                </Text>
              </View>
            ) : (
              donorCategories.map((donor: DonorCategoryItem) => {
                const isSelected = selectedDonorId === donor.id;
                return (
                  <Pressable
                    key={donor.id}
                    onPress={() => void handleSelectDonor(donor.id)}
                    style={[
                      styles.donorRow,
                      isSelected && styles.donorRowSelected,
                    ]}
                  >
                    <View style={styles.donorInfo}>
                      <Text style={styles.donorGroup}>{donor.groupName}</Text>
                      <Text style={[typography.bodyMedium, styles.donorName]}>
                        {donor.name}
                      </Text>
                    </View>

                    <View style={styles.donorBalanceContainer}>
                      <Text style={[typography.action, styles.donorBalance]}>
                        {formatCentsToCurrency(donor.availableCents)}
                      </Text>
                      <Text style={styles.availableSubtext}>Available</Text>
                    </View>
                  </Pressable>
                );
              })
            )}
          </ScrollView>

          {/* Transfer Preview */}
          {selectedDonor && transferAmountCents > 0 ? (
            <View style={styles.previewCard}>
              <Text style={styles.previewTitle}>TRANSFER PREVIEW</Text>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Cover Amount:</Text>
                <Text style={styles.previewValue}>
                  {formatCentsToCurrency(transferAmountCents)}
                </Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>
                  {selectedDonor.name} After:
                </Text>
                <Text style={styles.previewValue}>
                  {formatCentsToCurrency(
                    selectedDonor.availableCents - transferAmountCents
                  )}
                </Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>
                  {targetCategory.name} After:
                </Text>
                <Text style={[styles.previewValue, { color: colors.success }]}>
                  {formatCentsToCurrency(
                    deficit.deficitCents - transferAmountCents === 0
                      ? 0
                      : -(deficit.deficitCents - transferAmountCents)
                  )}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Action Buttons */}
          <View style={styles.footer}>
            <Button
              title={
                transferAmountCents > 0
                  ? `Cover with ${selectedDonor?.name ?? 'Envelope'}`
                  : 'Select an Envelope'
              }
              onPress={handleConfirm}
              disabled={!selectedDonorId || transferAmountCents <= 0}
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
  deficitCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface2,
    borderRadius: radius.card,
    borderWidth: 0.5,
    borderColor: colors.hairline,
  },
  deficitTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryNameText: {
    ...typography.headline,
    color: colors.textPrimary,
  },
  deficitSubtext: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badgePill: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 0.5,
  },
  badgePillText: {
    ...typography.footnote,
    fontWeight: '700',
    fontSize: 11,
  },
  deficitAmount: {
    marginTop: spacing.xs,
  },
  donorList: {
    maxHeight: 220,
    paddingHorizontal: spacing.lg,
  },
  donorListContent: {
    paddingBottom: spacing.sm,
  },
  sectionHeader: {
    marginBottom: spacing.sm,
    color: colors.textTertiary,
  },
  emptyDonors: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
  donorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.surface2,
    marginBottom: spacing.xs + 2,
  },
  donorRowSelected: {
    borderColor: colors.systemBlue,
    backgroundColor: 'rgba(10, 132, 255, 0.12)',
  },
  donorInfo: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  donorGroup: {
    ...typography.caption,
    color: colors.textTertiary,
    textTransform: 'uppercase',
  },
  donorName: {
    color: colors.textPrimary,
    marginTop: 1,
  },
  donorBalanceContainer: {
    alignItems: 'flex-end',
  },
  donorBalance: {
    color: colors.textPrimary,
  },
  availableSubtext: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  previewCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xs,
    padding: spacing.sm + 4,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: radius.sm,
    borderWidth: 0.5,
    borderColor: colors.hairline,
  },
  previewTitle: {
    ...typography.sectionHdr,
    color: colors.textTertiary,
    fontSize: 11,
    marginBottom: spacing.xs,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  previewLabel: {
    ...typography.footnote,
    color: colors.textSecondary,
  },
  previewValue: {
    ...typography.footnote,
    fontWeight: '600',
    color: colors.textPrimary,
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
