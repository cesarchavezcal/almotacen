import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface AccountItem {
  id: string;
  name: string;
  institution: string;
  balance: number;
  type: 'depository' | 'credit' | 'investment';
  lastSynced: string;
}

interface AccountGroup {
  type: string;
  total: number;
  accounts: AccountItem[];
}

const ACCOUNT_GROUPS: AccountGroup[] = [
  {
    type: 'Cash & Depository',
    total: 8250.75,
    accounts: [
      { id: 'chk1', name: 'Primary Checking', institution: 'Chase', balance: 3250.75, type: 'depository', lastSynced: 'Just now' },
      { id: 'sav1', name: 'High-Yield Emergency Fund', institution: 'Marcus', balance: 5000.0, type: 'depository', lastSynced: 'Today' },
    ],
  },
  {
    type: 'Credit Cards (Liabilities)',
    total: -1420.30,
    accounts: [
      { id: 'cc1', name: 'Sapphire Preferred', institution: 'Chase', balance: -1120.30, type: 'credit', lastSynced: 'Today' },
      { id: 'cc2', name: 'Blue Cash Everyday', institution: 'Amex', balance: -300.0, type: 'credit', lastSynced: 'Yesterday' },
    ],
  },
  {
    type: 'Investments & Retirement',
    total: 34500.0,
    accounts: [
      { id: 'inv1', name: 'Total Stock Market ETF', institution: 'Vanguard', balance: 22500.0, type: 'investment', lastSynced: 'Yesterday' },
      { id: 'inv2', name: 'Roth IRA Target 2060', institution: 'Fidelity', balance: 12000.0, type: 'investment', lastSynced: '2 days ago' },
    ],
  },
];

export default function AccountsScreen() {
  const colorScheme = useColorScheme();

  const netWorth = ACCOUNT_GROUPS.reduce((acc, group) => acc + group.total, 0);
  const totalLiquid = ACCOUNT_GROUPS.find((g) => g.type.includes('Depository'))?.total ?? 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Net Worth Hero Card */}
      <View style={styles.heroCard}>
        <Text style={styles.heroSubtitle}>Total Net Worth</Text>
        <Text style={styles.heroAmount}>${netWorth.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
        <Text style={styles.heroSub}>
          Liquid Cash: ${totalLiquid.toLocaleString('en-US', { minimumFractionDigits: 2 })} &bull; Debt: $1,420.30
        </Text>
      </View>

      {/* Account Groups */}
      {ACCOUNT_GROUPS.map((group) => (
        <View key={group.type} style={styles.groupSection}>
          <View style={styles.groupHeader}>
            <Text style={styles.groupTitle}>{group.type}</Text>
            <Text
              style={[
                styles.groupTotal,
                { color: group.total < 0 ? '#EF4444' : '#10B981' },
              ]}
            >
              {group.total < 0 ? `-$${Math.abs(group.total).toFixed(2)}` : `+$${group.total.toFixed(2)}`}
            </Text>
          </View>

          <View style={styles.groupCard}>
            {group.accounts.map((acct, index) => (
              <View key={acct.id} style={[styles.accountRow, index > 0 && styles.accountBorder]}>
                <View style={styles.accountInfo}>
                  <Text style={styles.accountName}>{acct.name}</Text>
                  <Text style={styles.institutionText}>
                    {acct.institution} &bull; Synced {acct.lastSynced}
                  </Text>
                </View>

                <View style={styles.balanceCol}>
                  <Text
                    style={[
                      styles.balanceText,
                      { color: acct.balance < 0 ? '#EF4444' : Colors[colorScheme].text },
                    ]}
                  >
                    {acct.balance < 0
                      ? `-$${Math.abs(acct.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                      : `$${acct.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  heroCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  heroAmount: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 6,
  },
  heroSub: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 6,
  },
  groupSection: {
    gap: 8,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 4,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  groupTotal: {
    fontSize: 14,
    fontWeight: '700',
  },
  groupCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    overflow: 'hidden',
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  accountBorder: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.15)',
  },
  accountInfo: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  accountName: {
    fontSize: 15,
    fontWeight: '600',
  },
  institutionText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  balanceCol: {
    alignItems: 'flex-end',
    backgroundColor: 'transparent',
  },
  balanceText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
