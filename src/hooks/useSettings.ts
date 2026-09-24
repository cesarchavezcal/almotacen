import { useMemo, useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useLedgerStore } from '@/src/storage/useLedgerStore';
import { DiagnosticsData } from '@/src/storage/types';

export interface UseSettingsResult {
  diagnostics: DiagnosticsData;
  handleFactoryReset: () => void;
  handleClearTransactions: () => void;
  handleSeedDemoData: () => void;
  navigateToAccounts: () => void;
  navigateToGroups: () => void;
  navigateToCategories: () => void;
}

export function promptFactoryReset(onConfirm: () => void): void {
  Alert.alert(
    'Reset All Data?',
    'This permanently erases all transactions, accounts, and envelopes. You will be returned to onboarding.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Erase All Data',
        style: 'destructive',
        onPress: onConfirm,
      },
    ]
  );
}

export function promptClearTransactions(onConfirm: () => void): void {
  Alert.alert(
    'Clear Transactions Only?',
    'This will delete all transactions and reset envelope balances to zero. Accounts, groups, and categories will be kept, and Ready to Assign will re-anchor to your cash balance.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear Transactions',
        style: 'destructive',
        onPress: onConfirm,
      },
    ]
  );
}

export function promptSeedDemoData(onConfirm: () => void): void {
  Alert.alert(
    'Load Demo Starter Data?',
    'This will replace your current data with default starter demo accounts, categories, and transactions.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Load Demo Data',
        onPress: onConfirm,
      },
    ]
  );
}

export function useSettings(): UseSettingsResult {
  const router = useRouter();
  const {
    state,
    groups,
    factoryReset,
    clearTransactionsOnly,
    seedDemoData,
    getDiagnostics,
  } = useLedgerStore();

  const diagnostics = useMemo<DiagnosticsData>(() => {
    return getDiagnostics();
  }, [getDiagnostics, state, groups]);

  const handleFactoryReset = useCallback(() => {
    promptFactoryReset(() => {
      factoryReset();
      router.replace('/onboarding');
    });
  }, [factoryReset, router]);

  const handleClearTransactions = useCallback(() => {
    promptClearTransactions(() => {
      clearTransactionsOnly();
    });
  }, [clearTransactionsOnly]);

  const handleSeedDemoData = useCallback(() => {
    promptSeedDemoData(() => {
      seedDemoData();
    });
  }, [seedDemoData]);

  const navigateToAccounts = useCallback(() => {
    router.push('/settings/accounts');
  }, [router]);

  const navigateToGroups = useCallback(() => {
    router.push('/settings/groups');
  }, [router]);

  const navigateToCategories = useCallback(() => {
    router.push('/settings/categories');
  }, [router]);

  return {
    diagnostics,
    handleFactoryReset,
    handleClearTransactions,
    handleSeedDemoData,
    navigateToAccounts,
    navigateToGroups,
    navigateToCategories,
  };
}
