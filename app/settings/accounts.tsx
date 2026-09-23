import React, { useMemo, useCallback } from 'react';
import { Alert } from 'react-native';
import { useLedgerStore } from '@/src/storage/useLedgerStore';
import { calculateNetWorthTotals } from '@/src/domain/ledger/accountViewHelpers';
import { AccountsSettingsView } from '@/src/components/settings';

export default function AccountsSettingsScreen(): React.JSX.Element {
  const { state } = useLedgerStore();

  const accountList = useMemo(() => {
    return Object.values(state.accounts).sort((a, b) => a.name.localeCompare(b.name));
  }, [state.accounts]);

  const { liquidCents } = useMemo(() => {
    return calculateNetWorthTotals(accountList);
  }, [accountList]);

  const handleAddAccount = useCallback(() => {
    Alert.alert('New Account', 'Account creation forms will be available in the upcoming release.');
  }, []);

  return (
    <AccountsSettingsView
      accounts={accountList}
      totalBalanceCents={liquidCents}
      onAddAccount={handleAddAccount}
    />
  );
}
