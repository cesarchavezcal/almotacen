import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  Switch,
  Pressable,
} from 'react-native';
import { colors, spacing, radius, typography, shadows } from '@/src/theme';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { ArchetypePresetId, ArchetypeTemplate } from '@/src/domain/onboarding/types';
import { ARCHETYPE_PRESET_IDS, getArchetypeTemplate } from '@/src/domain/onboarding/archetypes';
import { formatCentsToCurrency } from '@/src/domain/ledger/currency';

export type WizardStep = 1 | 2 | 3 | 4;

export interface OnboardingWizardViewProps {
  step: WizardStep;
  checkingName: string;
  checkingBalanceText: string;
  hasCreditCard: boolean;
  creditCardName: string;
  creditCardDebtText: string;
  selectedArchetypeId: ArchetypePresetId;
  template: ArchetypeTemplate;
  allocations: Record<string, number>;
  startingCashCents: number;
  totalAssignedCents: number;
  remainingReadyToAssignCents: number;
  errorMessage: string | null;
  isSubmitting: boolean;
  onNextStep: () => void;
  onPrevStep: () => void;
  onExploreDemo: () => void;
  onChangeCheckingName: (text: string) => void;
  onChangeCheckingBalanceText: (text: string) => void;
  onToggleCreditCard: (enabled: boolean) => void;
  onChangeCreditCardName: (text: string) => void;
  onChangeCreditCardDebtText: (text: string) => void;
  onSelectArchetype: (id: ArchetypePresetId) => void;
  onCommit: () => void;
}

export function OnboardingWizardView(props: OnboardingWizardViewProps): React.JSX.Element {
  const { step } = props;

  return (
    <View style={styles.container} testID="onboarding-wizard-view">
      {/* Step Header Indicator */}
      <View style={styles.headerIndicator}>
        <Text style={styles.stepCounterText}>Step {step} of 4</Text>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${(step / 4) * 100}%` },
            ]}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {props.errorMessage ? (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{props.errorMessage}</Text>
          </Card>
        ) : null}

        {step === 1 && renderStep1(props)}
        {step === 2 && renderStep2(props)}
        {step === 3 && renderStep3(props)}
        {step === 4 && renderStep4(props)}
      </ScrollView>
    </View>
  );
}

function renderStep1(props: OnboardingWizardViewProps): React.JSX.Element {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.heroTitle}>Welcome to Almotacen</Text>
      <Text style={styles.heroSubtitle}>
        Dual-ledger cash flow and proactive envelope budgeting engineered for clarity.
      </Text>

      <Card style={styles.valuePropsCard}>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitDot}>•</Text>
          <View style={styles.benefitTextGroup}>
            <Text style={styles.benefitTitle}>Zero-Based Allocation</Text>
            <Text style={styles.benefitDescription}>
              Give every dollar a job before spending it, preventing cash shortfalls.
            </Text>
          </View>
        </View>

        <View style={styles.benefitItem}>
          <Text style={styles.benefitDot}>•</Text>
          <View style={styles.benefitTextGroup}>
            <Text style={styles.benefitTitle}>Automatic Credit Reserve</Text>
            <Text style={styles.benefitDescription}>
              Credit outflows instantly reserve cash for your next card payment.
            </Text>
          </View>
        </View>

        <View style={styles.benefitItem}>
          <Text style={styles.benefitDot}>•</Text>
          <View style={styles.benefitTextGroup}>
            <Text style={styles.benefitTitle}>Tailored Financial Archetypes</Text>
            <Text style={styles.benefitDescription}>
              Pick a baseline that matches your priorities: balanced living, debt snowball, or minimalist.
            </Text>
          </View>
        </View>
      </Card>

      <View style={styles.actionsContainer}>
        <Button
          testID="start-setup-button"
          title="Start Guided Setup"
          size="lg"
          onPress={props.onNextStep}
          style={styles.primaryActionButton}
        />
        <Button
          testID="explore-demo-button"
          title="Explore with Demo Data"
          variant="secondary"
          size="md"
          onPress={props.onExploreDemo}
          style={styles.secondaryActionButton}
        />
      </View>
    </View>
  );
}

function renderStep2(props: OnboardingWizardViewProps): React.JSX.Element {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.sectionTitle}>Connect Your Accounts</Text>
      <Text style={styles.sectionSubtitle}>
        Set up your primary spending account and optional credit card debt.
      </Text>

      {/* Checking Account Form */}
      <Card style={styles.formCard}>
        <Text style={styles.inputLabel}>Checking Account Name</Text>
        <TextInput
          testID="checking-name-input"
          style={styles.textInput}
          value={props.checkingName}
          onChangeText={props.onChangeCheckingName}
          placeholder="e.g. Primary Checking"
          placeholderTextColor={colors.textTertiary}
          accessibilityLabel="Checking Account Name"
        />

        <Text style={[styles.inputLabel, styles.inputSpacing]}>Starting Checking Balance ($)</Text>
        <TextInput
          testID="checking-balance-input"
          style={styles.textInput}
          value={props.checkingBalanceText}
          onChangeText={props.onChangeCheckingBalanceText}
          placeholder="0.00"
          placeholderTextColor={colors.textTertiary}
          keyboardType="decimal-pad"
          accessibilityLabel="Starting Checking Balance"
        />
      </Card>

      {/* Credit Card Account Toggle */}
      <Card style={[styles.formCard, styles.inputSpacing]}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleTextContainer}>
            <Text style={styles.toggleTitle}>Include an existing credit card</Text>
            <Text style={styles.toggleSubtitle}>Track card debt and set up automatic payment envelopes.</Text>
          </View>
          <Switch
            testID="credit-card-toggle"
            value={props.hasCreditCard}
            onValueChange={props.onToggleCreditCard}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        {props.hasCreditCard ? (
          <View style={styles.creditCardForm}>
            <Text style={[styles.inputLabel, styles.inputSpacing]}>Credit Card Name</Text>
            <TextInput
              testID="credit-card-name-input"
              style={styles.textInput}
              value={props.creditCardName}
              onChangeText={props.onChangeCreditCardName}
              placeholder="e.g. Apple Card"
              placeholderTextColor={colors.textTertiary}
              accessibilityLabel="Credit Card Name"
            />

            <Text style={[styles.inputLabel, styles.inputSpacing]}>Starting Statement Debt ($)</Text>
            <TextInput
              testID="credit-card-debt-input"
              style={styles.textInput}
              value={props.creditCardDebtText}
              onChangeText={props.onChangeCreditCardDebtText}
              placeholder="0.00"
              placeholderTextColor={colors.textTertiary}
              keyboardType="decimal-pad"
              accessibilityLabel="Starting Statement Debt"
            />
          </View>
        ) : null}
      </Card>

      <View style={styles.wizardNavRow}>
        <Button
          testID="step2-back-button"
          title="Back"
          variant="secondary"
          size="md"
          onPress={props.onPrevStep}
          style={styles.navButtonHalf}
        />
        <Button
          testID="step2-continue-button"
          title="Continue"
          size="md"
          onPress={props.onNextStep}
          style={styles.navButtonHalf}
        />
      </View>
    </View>
  );
}

function renderStep3(props: OnboardingWizardViewProps): React.JSX.Element {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.sectionTitle}>Choose Financial Archetype</Text>
      <Text style={styles.sectionSubtitle}>
        Select a starting envelope tree. You can customize targets and categories anytime.
      </Text>

      <View style={styles.archetypeList}>
        {ARCHETYPE_PRESET_IDS.map((presetId) => {
          const preset = getArchetypeTemplate(presetId);
          const isSelected = props.selectedArchetypeId === presetId;

          return (
            <Pressable
              key={preset.id}
              testID={`archetype-card-${preset.id}`}
              onPress={() => props.onSelectArchetype(preset.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              style={[
                styles.archetypeCard,
                isSelected && styles.archetypeCardSelected,
              ]}
            >
              <View style={styles.archetypeHeader}>
                <Text style={styles.archetypeName}>{preset.name}</Text>
                {isSelected ? (
                  <View style={styles.selectedBadge}>
                    <Text style={styles.selectedBadgeText}>Selected</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.archetypeDescription}>{preset.description}</Text>

              <View style={styles.categoryPillsRow}>
                {preset.categories.slice(0, 4).map((cat) => (
                  <View key={cat.id} style={styles.categoryPill}>
                    <Text style={styles.categoryPillText}>{cat.name}</Text>
                  </View>
                ))}
                {preset.categories.length > 4 ? (
                  <View style={styles.categoryPill}>
                    <Text style={styles.categoryPillText}>+{preset.categories.length - 4} more</Text>
                  </View>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.wizardNavRow}>
        <Button
          testID="step3-back-button"
          title="Back"
          variant="secondary"
          size="md"
          onPress={props.onPrevStep}
          style={styles.navButtonHalf}
        />
        <Button
          testID="step3-continue-button"
          title="Review Allocations"
          size="md"
          onPress={props.onNextStep}
          style={styles.navButtonHalf}
        />
      </View>
    </View>
  );
}

function renderStep4(props: OnboardingWizardViewProps): React.JSX.Element {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.sectionTitle}>Review & Fund Envelopes</Text>
      <Text style={styles.sectionSubtitle}>
        Starting cash is sequentially assigned to high-priority targets.
      </Text>

      {/* Balance Reconciliation Card */}
      <Card style={styles.reconciliationCard}>
        <View style={styles.reconRow}>
          <Text style={styles.reconLabel}>Total Starting Cash</Text>
          <Text style={styles.reconValue}>{formatCentsToCurrency(props.startingCashCents)}</Text>
        </View>
        <View style={styles.reconDivider} />
        <View style={styles.reconRow}>
          <Text style={styles.reconLabel}>Assigned to Envelopes</Text>
          <Text style={[styles.reconValue, { color: colors.primary }]}>
            {formatCentsToCurrency(props.totalAssignedCents)}
          </Text>
        </View>
        <View style={styles.reconDivider} />
        <View style={styles.reconRow}>
          <Text style={styles.reconLabel}>Leftover Ready to Assign</Text>
          <Text style={[styles.reconValue, { color: colors.success }]}>
            {formatCentsToCurrency(props.remainingReadyToAssignCents)}
          </Text>
        </View>
      </Card>

      {/* Envelopes Preview List */}
      <Text style={[styles.inputLabel, styles.inputSpacing]}>Envelopes Funded on Day 1</Text>
      <Card style={styles.envelopesListCard}>
        {props.template.categories.map((cat) => {
          const allocated = props.allocations[cat.id] ?? 0;
          return (
            <View key={cat.id} style={styles.envelopeRow}>
              <View style={styles.envelopeInfo}>
                <Text style={styles.envelopeName}>{cat.name}</Text>
                <Text style={styles.envelopeTarget}>
                  Target: {formatCentsToCurrency(cat.targetCents)}
                </Text>
              </View>
              <Text
                style={[
                  styles.envelopeAllocated,
                  allocated > 0 ? styles.envelopeFunded : styles.envelopeUnfunded,
                ]}
              >
                {formatCentsToCurrency(allocated)}
              </Text>
            </View>
          );
        })}
      </Card>

      <View style={styles.wizardNavRow}>
        <Button
          testID="step4-back-button"
          title="Back"
          variant="secondary"
          size="md"
          onPress={props.onPrevStep}
          disabled={props.isSubmitting}
          style={styles.navButtonHalf}
        />
        <Button
          testID="launch-budget-button"
          title="Launch Budget"
          size="md"
          loading={props.isSubmitting}
          disabled={props.isSubmitting}
          onPress={props.onCommit}
          style={styles.navButtonHalf}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  headerIndicator: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  stepCounterText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: colors.surfaceCardSubtle,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  stepContainer: {
    paddingTop: spacing.md,
  },
  heroTitle: {
    ...typography.largeTitle,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  sectionTitle: {
    ...typography.sheetTitle,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    ...typography.subhead,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  valuePropsCard: {
    padding: spacing.lg,
    marginBottom: spacing.xl,
    backgroundColor: colors.surfaceCard,
  },
  benefitItem: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  benefitDot: {
    color: colors.primary,
    fontSize: 20,
    lineHeight: 22,
    marginRight: spacing.sm,
  },
  benefitTextGroup: {
    flex: 1,
  },
  benefitTitle: {
    ...typography.headline,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  benefitDescription: {
    ...typography.footnote,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  actionsContainer: {
    gap: spacing.sm,
  },
  primaryActionButton: {
    width: '100%',
  },
  secondaryActionButton: {
    width: '100%',
  },
  formCard: {
    padding: spacing.md,
    backgroundColor: colors.surfaceCard,
  },
  inputLabel: {
    ...typography.subhead,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  inputSpacing: {
    marginTop: spacing.md,
  },
  textInput: {
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.textPrimary,
    fontSize: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleTextContainer: {
    flex: 1,
    paddingRight: spacing.md,
  },
  toggleTitle: {
    ...typography.headline,
    color: colors.textPrimary,
  },
  toggleSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  creditCardForm: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
    marginTop: spacing.md,
    paddingTop: spacing.xs,
  },
  wizardNavRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  navButtonHalf: {
    flex: 1,
  },
  archetypeList: {
    gap: spacing.md,
  },
  archetypeCard: {
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
  },
  archetypeCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.surface2,
    ...shadows.card,
  },
  archetypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  archetypeName: {
    ...typography.headline,
    color: colors.textPrimary,
  },
  selectedBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  selectedBadgeText: {
    ...typography.caption,
    color: colors.onPrimary,
    fontWeight: '700',
  },
  archetypeDescription: {
    ...typography.footnote,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  categoryPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  categoryPill: {
    backgroundColor: colors.surfaceCardSubtle,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  categoryPillText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  reconciliationCard: {
    padding: spacing.md,
    backgroundColor: colors.surfaceCard,
    marginBottom: spacing.md,
  },
  reconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  reconLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  reconValue: {
    ...typography.headline,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  reconDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.hairline,
    marginVertical: spacing.xs,
  },
  envelopesListCard: {
    backgroundColor: colors.surfaceCard,
    padding: spacing.md,
  },
  envelopeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  envelopeInfo: {
    flex: 1,
  },
  envelopeName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  envelopeTarget: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  envelopeAllocated: {
    ...typography.headline,
    fontWeight: '700',
  },
  envelopeFunded: {
    color: colors.success,
  },
  envelopeUnfunded: {
    color: colors.textTertiary,
  },
  errorCard: {
    backgroundColor: colors.surfaceCard,
    borderColor: colors.error,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.footnote,
    color: colors.error,
    fontWeight: '600',
  },
});
