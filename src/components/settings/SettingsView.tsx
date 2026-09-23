import React from 'react';
import { ScrollView, StyleSheet, View, Text } from 'react-native';
import { colors, typography } from '@/src/theme';
import { DiagnosticsData } from '@/src/storage/types';
import { SettingsSection } from './SettingsSection';
import { SettingsRow } from './SettingsRow';

export interface SettingsViewProps {
  diagnostics: DiagnosticsData;
  onClearTransactions: () => void;
  onSeedDemoData: () => void;
  onFactoryReset: () => void;
  onNavigateToAccounts: () => void;
  onNavigateToGroups: () => void;
  onNavigateToCategories: () => void;
}

export function SettingsView({
  diagnostics,
  onClearTransactions,
  onSeedDemoData,
  onFactoryReset,
  onNavigateToAccounts,
  onNavigateToGroups,
  onNavigateToCategories,
}: SettingsViewProps): React.JSX.Element {
  return (
    <ScrollView
      testID="settings-scroll-view"
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <Text style={[typography.title, styles.title]}>Settings</Text>
      </View>

      {/* Section 1: Entities Management */}
      <SettingsSection title="ENTITIES" testID="settings-section-entities">
        <SettingsRow
          testID="settings-row-accounts"
          iconName="card-outline"
          iconBgColor="rgba(10, 132, 255, 0.15)"
          iconColor={colors.systemBlue}
          label="Accounts"
          value={diagnostics.accountCount}
          onPress={onNavigateToAccounts}
        />
        <SettingsRow
          testID="settings-row-groups"
          iconName="folder-outline"
          iconBgColor="rgba(255, 159, 10, 0.15)"
          iconColor={colors.warning}
          label="Category Groups"
          value={diagnostics.categoryGroupCount}
          onPress={onNavigateToGroups}
        />
        <SettingsRow
          testID="settings-row-categories"
          iconName="pricetag-outline"
          iconBgColor="rgba(48, 209, 88, 0.15)"
          iconColor={colors.success}
          label="Categories"
          value={diagnostics.categoryCount}
          onPress={onNavigateToCategories}
          isLast={true}
        />
      </SettingsSection>

      {/* Section 2: Data Management & Resets */}
      <SettingsSection
        title="DATA MANAGEMENT"
        footer="Factory Reset wipes all ledger data, envelopes, and returns to onboarding."
        testID="settings-section-data"
      >
        <SettingsRow
          testID="settings-row-clear-transactions"
          iconName="trash-bin-outline"
          iconBgColor="rgba(255, 159, 10, 0.15)"
          iconColor={colors.warning}
          label="Clear Transactions Only"
          subtitle="Re-anchors envelopes to cash balance"
          onPress={onClearTransactions}
          showChevron={true}
        />
        <SettingsRow
          testID="settings-row-seed-demo"
          iconName="refresh-outline"
          iconBgColor="rgba(10, 132, 255, 0.15)"
          iconColor={colors.systemBlue}
          label="Load Demo Starter Data"
          subtitle="Seeds archetype accounts and envelopes"
          onPress={onSeedDemoData}
          showChevron={true}
        />
        <SettingsRow
          testID="settings-row-factory-reset"
          iconName="warning-outline"
          iconBgColor="rgba(255, 69, 58, 0.15)"
          iconColor={colors.error}
          label="Reset All Data (Factory Reset)"
          isDestructive={true}
          onPress={onFactoryReset}
          showChevron={true}
          isLast={true}
        />
      </SettingsSection>

      {/* Section 3: Diagnostics & System */}
      <SettingsSection
        title="DIAGNOSTICS & SYSTEM"
        testID="settings-section-diagnostics"
      >
        <SettingsRow
          testID="settings-row-diag-schema"
          iconName="code-slash-outline"
          label="Schema Version"
          value={`v${diagnostics.schemaVersion}`}
        />
        <SettingsRow
          testID="settings-row-diag-transactions"
          iconName="receipt-outline"
          label="Total Transactions"
          value={diagnostics.transactionCount}
        />
        <SettingsRow
          testID="settings-row-diag-accounts"
          iconName="wallet-outline"
          label="Total Accounts"
          value={diagnostics.accountCount}
        />
        <SettingsRow
          testID="settings-row-diag-categories"
          iconName="albums-outline"
          label="Total Categories"
          value={diagnostics.categoryCount}
        />
        <SettingsRow
          testID="settings-row-diag-driver"
          iconName="server-outline"
          label="Database Driver"
          value="SQLite (local)"
          isLast={true}
        />
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
    paddingTop: 12,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
    marginTop: 8,
  },
  title: {
    color: colors.textPrimary,
  },
});
