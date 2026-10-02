import React from 'react';
import {
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  View,
  Text,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { radius } from '@/src/theme/radius';
import { formatCentsToCurrency } from '@/src/domain/ledger/currency';
import { Account, Category } from '@/src/domain/ledger/types';

export interface QuickEntryViewProps {
  amount: string;
  setAmount: (val: string) => void;
  payee: string;
  onPayeeChange: (val: string) => void;
  onPayeePillTap: (val: string) => void;
  recentPayees: string[];
  categories: Category[];
  selectedCategoryId: string;
  onCategorySelect: (id: string) => void;
  accounts: Account[];
  selectedAccountId: string;
  onAccountSelect: (id: string) => void;
  selectedCategory?: Category;
  currentAvailableCents: number;
  remainingAvailableCents: number;
  isOverspent: boolean;
  submitted: boolean;
  errorMsg: string | null;
  onSave: () => void;
  onClose: () => void;
}

export function QuickEntryView({
  amount,
  setAmount,
  payee,
  onPayeeChange,
  onPayeePillTap,
  recentPayees,
  categories,
  selectedCategoryId,
  onCategorySelect,
  accounts,
  selectedAccountId,
  onAccountSelect,
  selectedCategory,
  currentAvailableCents,
  remainingAvailableCents,
  isOverspent,
  submitted,
  errorMsg,
  onSave,
  onClose,
}: QuickEntryViewProps): React.JSX.Element {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Sheet Grab Handle & Header */}
      <View style={styles.sheetHandle} />

      <View style={styles.headerRow}>
        <View>
          <Text style={[typography.sheetTitle, styles.title]}>Quick Expense</Text>
          <Text style={[typography.footnote, styles.subtitle]}>
            Sub-3-second point-of-sale capture
          </Text>
        </View>
        <Pressable onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={20} color={colors.textPrimary} />
        </Pressable>
      </View>

      {/* Amount Input */}
      <View style={styles.inputGroup}>
        <Text style={[typography.sectionHdr, styles.inputLabel]}>AMOUNT ($)</Text>
        <View style={styles.amountInputRow}>
          <Text style={styles.dollarSign}>$</Text>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={colors.textTertiary}
            autoFocus={true}
          />
        </View>
      </View>

      {/* Live Category Balance Impact Preview */}
      {selectedCategory && (
        <View style={[styles.previewCard, isOverspent && styles.previewCardWarning]}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewLabel}>
              {selectedCategory.name.toUpperCase()} IMPACT
            </Text>
            {isOverspent && (
              <View style={styles.warningBadge}>
                <Text style={styles.warningBadgeText}>OVERSPENT</Text>
              </View>
            )}
          </View>
          <View style={styles.previewBalanceRow}>
            <Text style={styles.previewCurrent}>
              {formatCentsToCurrency(currentAvailableCents)}
            </Text>
            <Text style={styles.previewArrow}>➔</Text>
            <Text
              style={[
                styles.previewRemaining,
                isOverspent && styles.previewRemainingOverspent,
              ]}
            >
              {formatCentsToCurrency(remainingAvailableCents)}
            </Text>
          </View>
        </View>
      )}

      {/* Payee / Merchant Input with Smart Memory Suggestions */}
      <View style={styles.inputGroup}>
        <Text style={[typography.sectionHdr, styles.inputLabel]}>MERCHANT / PAYEE</Text>
        <TextInput
          style={styles.textInput}
          value={payee}
          onChangeText={onPayeeChange}
          placeholder="e.g. Whole Foods, Blue Bottle Coffee"
          placeholderTextColor={colors.textTertiary}
        />
        {recentPayees.length > 0 && (
          <View style={styles.recentPayeeRow}>
            <Text style={styles.recentPayeeLabel}>Recent:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentPayeeList}>
              {recentPayees.map((p) => (
                <Pressable
                  key={p}
                  onPress={() => onPayeePillTap(p)}
                  style={styles.recentPayeePill}
                >
                  <Text style={styles.recentPayeeText}>{p}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Category Selection */}
      <View style={styles.inputGroup}>
        <Text style={[typography.sectionHdr, styles.inputLabel]}>ENVELOPE CATEGORY</Text>
        <View style={styles.pillRow}>
          {categories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => onCategorySelect(cat.id)}
                style={[styles.pill, isSelected && styles.pillActive]}
              >
                <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                  {cat.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Account Selection */}
      <View style={styles.inputGroup}>
        <Text style={[typography.sectionHdr, styles.inputLabel]}>PAYMENT SOURCE / ACCOUNT</Text>
        <View style={styles.pillRow}>
          {accounts.map((acct) => {
            const isSelected = selectedAccountId === acct.id;
            return (
              <Pressable
                key={acct.id}
                onPress={() => onAccountSelect(acct.id)}
                style={[styles.pill, isSelected && styles.pillActive]}
              >
                <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                  {acct.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {errorMsg && <Text style={styles.errorMessage}>{errorMsg}</Text>}

      {/* Submit Button */}
      <Pressable
        style={[
          styles.submitButton,
          submitted && styles.submitButtonDone,
        ]}
        onPress={onSave}
      >
        <Text
          style={[
            typography.action,
            styles.submitButtonText,
            submitted && styles.submitButtonTextDone,
          ]}
        >
          {submitted ? '✓ Saved to Local Ledger' : 'Save Outflow'}
        </Text>
      </Pressable>

      <StatusBar style="light" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 18,
  },
  sheetHandle: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.surface2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    color: colors.textPrimary,
  },
  subtitle: {
    color: colors.textSecondary,
    marginTop: 4,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface1,
    borderRadius: radius.card,
    borderWidth: 0.5,
    borderColor: colors.hairline,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  dollarSign: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textSecondary,
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  previewCard: {
    backgroundColor: colors.surface1,
    borderRadius: radius.card,
    padding: 14,
    borderWidth: 0.5,
    borderColor: colors.hairline,
    gap: 6,
  },
  previewCardWarning: {
    borderColor: colors.warning,
    backgroundColor: 'rgba(255, 159, 10, 0.08)',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  warningBadge: {
    backgroundColor: 'rgba(255, 159, 10, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  warningBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.warning,
    letterSpacing: 0.5,
  },
  previewBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewCurrent: {
    ...typography.body,
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  previewArrow: {
    color: colors.textTertiary,
    fontSize: 14,
  },
  previewRemaining: {
    ...typography.body,
    color: colors.success,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  previewRemainingOverspent: {
    color: colors.warning,
  },
  textInput: {
    backgroundColor: colors.surface1,
    borderRadius: radius.card,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 0.5,
    borderColor: colors.hairline,
  },
  recentPayeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  recentPayeeLabel: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  recentPayeeList: {
    flexDirection: 'row',
    gap: 6,
  },
  recentPayeePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.surface2,
  },
  recentPayeeText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.surface1,
    borderWidth: 0.5,
    borderColor: colors.hairline,
  },
  pillActive: {
    backgroundColor: colors.systemBlue,
    borderColor: colors.systemBlue,
  },
  pillText: {
    ...typography.footnote,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  pillTextActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  errorMessage: {
    ...typography.footnote,
    color: colors.error,
    textAlign: 'center',
  },
  submitButton: {
    height: 54,
    borderRadius: radius.sheet,
    backgroundColor: colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: colors.canvas,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDone: {
    backgroundColor: colors.success,
  },
  submitButtonText: {
    color: colors.canvas,
    fontWeight: '700',
  },
  submitButtonTextDone: {
    color: colors.textPrimary,
  },
});
