import React, { useMemo, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useLedgerStore } from '@/src/storage/useLedgerStore';
import { calculateNetWorthTotals } from '@/src/domain/ledger/accountViewHelpers';
import { AccountsView } from '@/src/components/AccountsView';

export default function AccountsScreen(): React.JSX.Element {
  const router = useRouter();
  const { state } = useLedgerStore();

  const accountsList = useMemo(() => {
    return Object.values(state.accounts);
  }, [state.accounts]);

  const totals = useMemo(() => {
    return calculateNetWorthTotals(accountsList);
  }, [accountsList]);

  const handleAddAccount = useCallback(() => {
    router.push('/settings/accounts' as const);
  }, [router]);

  return (
    <AccountsView
      accounts={accountsList}
      totals={totals}
      onAddAccount={handleAddAccount}
    />
  );
}
