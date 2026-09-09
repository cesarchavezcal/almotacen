import React, { useState, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  View,
  Text,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { radius } from '@/src/theme/radius';
import { useLedgerStore } from '@/src/storage/useLedgerStore';
import { useSmartPayeeMemory, parseCurrencyToCents } from '@/src/hooks/useSmartPayeeMemory';

export default function QuickEntryModal() {
  const router = useRouter();
  const { state, postOutflow } = useLedgerStore();
  const { recentPayees, suggestForPayee } = useSmartPayeeMemory(state.transactions);

  // Accounts list (checking, credit, cash, savings)
  const accounts = useMemo(() => Object.values(state.accounts), [state.accounts]);

  // Categories list (excluding internal credit card payment envelopes)
  const categories = useMemo(
    () => Object.values(state.categories).filter((c) => !c.isCreditPayment),
    [state.categories]
  );

  const [amount, setAmount] = useState('');
  const [payee, setPayee] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categories[0]?.id || '');
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Keep defaults updated if categories/accounts load
  useEffect(() => {
    if (!selectedCategoryId && categories.length > 0) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  useEffect(() => {
    if (!selectedAccountId && accounts.length > 0) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  // Handle Payee Change and Smart Memory Lookup (SCEN-012)
  const handlePayeeChange = (text: string) => {
    setPayee(text);
    setErrorMsg(null);
    const suggestion = suggestForPayee(text);
    if (suggestion) {
      if (suggestion.categoryId && state.categories[suggestion.categoryId]) {
        setSelectedCategoryId(suggestion.categoryId);
      }
      if (suggestion.accountId && state.accounts[suggestion.accountId]) {
        setSelectedAccountId(suggestion.accountId);
      }
    }
  };

  const handlePayeePillTap = (p: string) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    handlePayeeChange(p);
  };

  const handleCategorySelect = (id: string) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setSelectedCategoryId(id);
    setErrorMsg(null);
  };

  const handleAccountSelect = (id: string) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setSelectedAccountId(id);
    setErrorMsg(null);
  };

  // Live Envelope Balance Calculation (SCEN-013 & Req 4.2)
  const selectedCategory = state.categories[selectedCategoryId];
  const parsedCents = parseCurrencyToCents(amount);
  const currentAvailableCents = selectedCategory?.availableCents ?? 0;
  const remainingAvailableCents = currentAvailableCents - parsedCents;
  const isOverspent = remainingAvailableCents < 0;

  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  };

  const handleSave = () => {
    if (parsedCents <= 0) {
      setErrorMsg('Please enter an amount greater than $0.00');
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch {}
      return;
    }

    if (!selectedCategoryId) {
      setErrorMsg('Please select an envelope category');
      return;
    }

    if (!selectedAccountId) {
      setErrorMsg('Please select a payment account');
      return;
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    postOutflow({
      accountId: selectedAccountId,
      categoryId: selectedCategoryId,
      amountCents: parsedCents,
      payee: payee.trim() || 'Outflow',
    });

    setSubmitted(true);
    setTimeout(() => {
      router.back();
    }, 350);
  };

  const handleClose = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    router.back();
  };

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
        <Pressable onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={20} color="#FFFFFF" />
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
            onChangeText={(text) => {
              setAmount(text);
              setErrorMsg(null);
            }}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={colors.textTertiary}
            autoFocus={true}
          />
        </View>
      </View>

      {/* Live Category Balance Impact Preview (Req 4.2) */}
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
              {formatCurrency(currentAvailableCents)}
            </Text>
            <Text style={styles.previewArrow}>➔</Text>
            <Text
              style={[
                styles.previewRemaining,
                isOverspent && styles.previewRemainingOverspent,
              ]}
            >
              {formatCurrency(remainingAvailableCents)}
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
          onChangeText={handlePayeeChange}
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
                  onPress={() => handlePayeePillTap(p)}
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
                onPress={() => handleCategorySelect(cat.id)}
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
                onPress={() => handleAccountSelect(acct.id)}
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
        onPress={handleSave}
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
    color: '#FFFFFF',
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
    color: '#FFFFFF',
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
    borderColor: 'rgba(255, 159, 10, 0.4)',
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
    color: '#FF9F0A',
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
    color: '#FF9F0A',
  },
  textInput: {
    backgroundColor: colors.surface1,
    borderRadius: radius.card,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
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
    color: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDone: {
    backgroundColor: colors.success,
  },
  submitButtonText: {
    color: '#000000',
    fontWeight: '700',
  },
  submitButtonTextDone: {
    color: '#FFFFFF',
  },
});
