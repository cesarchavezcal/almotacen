import React, { useMemo } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { colors, typography, radius } from '@/src/theme';
import { CardStack } from '@/src/components/CardStack';
import { CreditCardFace } from '@/src/components/CreditCardFace';
import { Account } from '@/src/domain/ledger/types';
import { NetWorthTotals } from '@/src/domain/ledger/accountViewHelpers';
import { formatCentsToCurrency } from '@/src/domain/ledger/currency';

export interface AccountsViewProps {
  accounts: Account[];
  totals: NetWorthTotals;
  onAddAccount?: () => void;
}

export function AccountsView({
  accounts,
  totals,
  onAddAccount,
}: AccountsViewProps): React.JSX.Element {
  const cards = useMemo(() => {
    return accounts.map((account) => {
      const isCredit = account.accountType === 'credit';
      const isSavings = account.accountType === 'savings';

      const gradient: [string, string] = isCredit
        ? [colors.chaseBlue, '#0E1B30']
        : isSavings
        ? ['#1E3A8A', '#0F172A']
        : [colors.visaNavy, '#0B1033'];

      const accountLabel = isCredit
        ? 'Credit Card Liability'
        : isSavings
        ? 'High-Yield Depository'
        : 'Cash & Depository';

      return (
        <CreditCardFace
          key={account.id}
          issuer={account.name}
          last4="••••"
          cardholder="Primary User"
          network="visa"
          accountType={accountLabel}
          balance={formatCentsToCurrency(account.balanceCents)}
          gradient={gradient}
          style={styles.cardItem}
        />
      );
    });
  }, [accounts]);

  return (
    <View style={styles.container}>
      {/* Net Worth Hero Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.headerSubtitle}>TOTAL NET WORTH</Text>
          {onAddAccount && (
            <Pressable
              testID="btn-add-account-shortcut"
              style={({ pressed }) => [
                styles.addShortcutPill,
                pressed && styles.addShortcutPillPressed,
              ]}
              onPress={onAddAccount}
            >
              <Text style={styles.addShortcutPillText}>+ Add Account</Text>
            </Pressable>
          )}
        </View>

        <Text style={[typography.balanceHero, styles.headerAmount]}>
          {formatCentsToCurrency(totals.netWorthCents)}
        </Text>

        <Text style={styles.headerSub}>
          Liquid: <Text style={styles.boldWhite}>{formatCentsToCurrency(totals.liquidCents)}</Text> • Debt: <Text style={[styles.boldWhite, { color: colors.error }]}>{formatCentsToCurrency(-totals.debtCents)}</Text>
        </Text>

        <Text style={styles.instructionText}>
          {cards.length > 0
            ? 'Tap any card to inspect and expand physical stack'
            : 'No active accounts. Tap + Add Account above to create one.'}
        </Text>
      </View>

      {/* Interactive Vertical Card Stack */}
      {cards.length > 0 && (
        <CardStack
          cards={cards}
          contentContainerStyle={styles.stackContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: colors.canvas,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.hairline,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addShortcutPill: {
    backgroundColor: 'rgba(10, 132, 255, 0.18)',
    borderColor: 'rgba(10, 132, 255, 0.4)',
    borderWidth: 0.5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  addShortcutPillPressed: {
    opacity: 0.7,
  },
  addShortcutPillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.systemBlue,
  },
  headerSubtitle: {
    ...typography.sectionHdr,
    color: colors.textSecondary,
    letterSpacing: 0.8,
  },
  headerAmount: {
    fontSize: 34,
    marginTop: 4,
    marginBottom: 4,
    color: '#FFFFFF',
  },
  headerSub: {
    ...typography.footnote,
    color: colors.textSecondary,
  },
  boldWhite: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  instructionText: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 6,
  },
  stackContent: {
    paddingTop: 8,
    paddingHorizontal: 0,
  },
  cardItem: {
    marginHorizontal: 16,
  },
});
