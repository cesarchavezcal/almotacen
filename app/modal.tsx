import React, { useState } from 'react';
import { StyleSheet, TextInput, Pressable, ScrollView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function QuickEntryModal() {
  const router = useRouter();
  const colorScheme = useColorScheme();

  const [amount, setAmount] = useState('42.50');
  const [payee, setPayee] = useState('Trader Joe\'s');
  const [category, setCategory] = useState('Groceries');
  const [account, setAccount] = useState('Primary Checking');
  const [submitted, setSubmitted] = useState(false);

  const categories = ['Groceries', 'Dining Out', 'Utilities', 'Transportation', 'Entertainment'];
  const accounts = ['Primary Checking', 'Sapphire Preferred', 'Cash'];

  const handleSave = () => {
    setSubmitted(true);
    setTimeout(() => {
      router.back();
    }, 400);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Quick Expense Entry</Text>
      <Text style={styles.subtitle}>Log an outflow and sync across cash flow & envelopes</Text>

      {/* Amount Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Amount ($)</Text>
        <TextInput
          style={[styles.textInput, styles.amountInput]}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor="#64748B"
        />
      </View>

      {/* Payee Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Payee / Merchant</Text>
        <TextInput
          style={styles.textInput}
          value={payee}
          onChangeText={setPayee}
          placeholder="e.g. Supermarket"
          placeholderTextColor="#64748B"
        />
      </View>

      {/* Category Selection */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Envelope Category</Text>
        <View style={styles.pillRow}>
          {categories.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => setCategory(cat)}
              style={[styles.pill, category === cat && styles.pillActive]}
            >
              <Text style={[styles.pillText, category === cat && styles.pillTextActive]}>{cat}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Account Selection */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Account</Text>
        <View style={styles.pillRow}>
          {accounts.map((acct) => (
            <Pressable
              key={acct}
              onPress={() => setAccount(acct)}
              style={[styles.pill, account === acct && styles.pillActive]}
            >
              <Text style={[styles.pillText, account === acct && styles.pillTextActive]}>{acct}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Submit Button */}
      <Pressable
        style={[styles.submitButton, submitted && styles.submitButtonDone]}
        onPress={handleSave}
      >
        <Text style={styles.submitButtonText}>
          {submitted ? '✓ Logged to Ledger' : 'Log Transaction'}
        </Text>
      </Pressable>

      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: -10,
  },
  inputGroup: {
    gap: 8,
    backgroundColor: 'transparent',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
  },
  amountInput: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2563EB',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: 'transparent',
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
    backgroundColor: 'rgba(148, 163, 184, 0.08)',
  },
  pillActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
  },
  pillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  submitButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonDone: {
    backgroundColor: '#10B981',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
