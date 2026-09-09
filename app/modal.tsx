import React, { useState } from 'react';
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

export default function QuickEntryModal() {
  const router = useRouter();

  const [amount, setAmount] = useState('42.50');
  const [payee, setPayee] = useState("Trader Joe's");
  const [category, setCategory] = useState('Groceries');
  const [account, setAccount] = useState('Primary Checking');
  const [submitted, setSubmitted] = useState(false);

  const categories = [
    'Groceries',
    'Dining Out',
    'Utilities',
    'Transportation',
    'Entertainment',
    'Health',
  ];
  const accounts = [
    'Primary Checking',
    'Sapphire Preferred',
    'Amex Everyday',
    'Cash',
  ];

  const handlePillSelect = (setter: (val: string) => void, val: string) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setter(val);
  };

  const handleSave = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    setSubmitted(true);
    setTimeout(() => {
      router.back();
    }, 450);
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
            Log outflow and sync zero-based ledger
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
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={colors.textTertiary}
          />
        </View>
      </View>

      {/* Payee / Merchant Input */}
      <View style={styles.inputGroup}>
        <Text style={[typography.sectionHdr, styles.inputLabel]}>MERCHANT / PAYEE</Text>
        <TextInput
          style={styles.textInput}
          value={payee}
          onChangeText={setPayee}
          placeholder="e.g. Supermarket, Coffee shop"
          placeholderTextColor={colors.textTertiary}
        />
      </View>

      {/* Category Selection */}
      <View style={styles.inputGroup}>
        <Text style={[typography.sectionHdr, styles.inputLabel]}>ENVELOPE CATEGORY</Text>
        <View style={styles.pillRow}>
          {categories.map((cat) => {
            const isSelected = category === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => handlePillSelect(setCategory, cat)}
                style={[styles.pill, isSelected && styles.pillActive]}
              >
                <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                  {cat}
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
            const isSelected = account === acct;
            return (
              <Pressable
                key={acct}
                onPress={() => handlePillSelect(setAccount, acct)}
                style={[styles.pill, isSelected && styles.pillActive]}
              >
                <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                  {acct}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

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
          {submitted ? '✓ Logged to Ledger' : 'Log Transaction'}
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
    gap: 20,
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
  submitButton: {
    height: 54,
    borderRadius: radius.sheet,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
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
