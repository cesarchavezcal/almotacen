import React from 'react';
import { useSettings } from '@/src/hooks/useSettings';
import { SettingsView } from '@/src/components/settings';

export default function SettingsScreen(): React.JSX.Element {
  const {
    diagnostics,
    handleClearTransactions,
    handleSeedDemoData,
    handleFactoryReset,
    navigateToAccounts,
    navigateToGroups,
    navigateToCategories,
  } = useSettings();

  return (
    <SettingsView
      diagnostics={diagnostics}
      onClearTransactions={handleClearTransactions}
      onSeedDemoData={handleSeedDemoData}
      onFactoryReset={handleFactoryReset}
      onNavigateToAccounts={navigateToAccounts}
      onNavigateToGroups={navigateToGroups}
      onNavigateToCategories={navigateToCategories}
    />
  );
}
