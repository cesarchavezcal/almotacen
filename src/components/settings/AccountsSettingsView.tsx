import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { Account } from '@/src/domain/ledger/types';
import { formatCentsToCurrency } from '@/src/domain/ledger/currency';
import { colors } from '@/src/theme';
import { SettingsSection } from './SettingsSection';
import { SettingsRow } from './SettingsRow';
import { SettingsHeaderRow } from './SettingsHeaderRow';

export interface AccountsSettingsViewProps {
  accounts: Account[];
  totalBalanceCents: number;
  onAddAccount?: () => void;
  onSelectAccount?: (account: Account) => void;
}

export function AccountsSettingsView({
  accounts,
  totalBalanceCents,
  onAddAccount,
  onSelectAccount,
}: AccountsSettingsViewProps): React.JSX.Element {
  return (
    <ScrollView
      testID="settings-accounts-screen"
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <SettingsHeaderRow
        subtitle="TOTAL BALANCE"
        title={formatCentsToCurrency(totalBalanceCents)}
        addLabel="Add Account"
        onAdd={onAddAccount}
        testID="btn-add-account"
      />

      <SettingsSection
        title={`ACCOUNTS (${accounts.length})`}
        testID="section-accounts-list"
      >
        {accounts.length === 0 ? (
          <SettingsRow
            label="No Accounts Configured"
            subtitle="Tap '+ Add Account' above to create one"
            showChevron={false}
            isLast={true}
          />
        ) : (
          accounts.map((account, index) => {
            const isLast = index === accounts.length - 1;
            const isCredit = account.accountType === 'credit';
            return (
              <SettingsRow
                key={account.id}
                testID={`account-row-${account.id}`}
                iconName={isCredit ? 'card' : 'wallet-outline'}
                iconColor={isCredit ? colors.warning : colors.systemBlue}
                iconBgColor={isCredit ? 'rgba(255, 159, 10, 0.15)' : 'rgba(10, 132, 255, 0.15)'}
                label={account.name}
                subtitle={account.accountType.toUpperCase()}
                value={formatCentsToCurrency(account.balanceCents)}
                showChevron={true}
                onPress={onSelectAccount ? () => onSelectAccount(account) : undefined}
                isLast={isLast}
              />
            );
          })
        )}
      </SettingsSection>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
});
