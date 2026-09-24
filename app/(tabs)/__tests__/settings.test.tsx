import React from 'react';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { Alert } from 'react-native';
import {
  SettingsRow,
  SettingsSection,
  SettingsView,
} from '@/src/components/settings';
import { DiagnosticsData } from '@/src/storage/types';
import { fromAny } from '@total-typescript/shoehorn';
import { createCleanTestDatabase } from '@/src/storage/testDatabase';
import { SQLiteLedgerRepository } from '@/src/storage/ledgerRepository';
import { DatabaseAdapter } from '@/src/storage/types';
import {
  promptFactoryReset,
  promptClearTransactions,
  promptSeedDemoData,
} from '@/src/hooks/useSettings';

interface AlertButtonOption {
  text?: string;
  style?: string;
  onPress?: () => void;
}

// Provide Alert mock on the mocked react-native module for testing
const reactNativeMock = fromAny<{
  Alert?: { alert: (title: string, message?: string, buttons?: AlertButtonOption[]) => void };
}, unknown>(require('react-native'));
if (!reactNativeMock.Alert) {
  reactNativeMock.Alert = { alert: jest.fn() };
}

describe('Settings Navigation & Layout (SCEN-001)', () => {
  let db: DatabaseAdapter;
  let repo: SQLiteLedgerRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    db = createCleanTestDatabase();
    repo = new SQLiteLedgerRepository(db);
  });

  afterEach(() => {
    db?.closeSync?.();
  });

  describe('Presentational Components: SettingsRow & SettingsSection', () => {
    it('SettingsRow renders label, value, and handles press', () => {
      const onPressMock = jest.fn();
      const element = SettingsRow({
        label: 'Accounts',
        value: 5,
        onPress: onPressMock,
        showChevron: true,
      });

      expect(element.props.testID).toBeUndefined();
      expect(element.props.accessibilityRole).toBe('button');
      expect(element.props.accessibilityLabel).toBe('Accounts');

      // Trigger onPress
      element.props.onPress();
      expect(onPressMock).toHaveBeenCalledTimes(1);
    });

    it('SettingsRow renders destructive styling without chevron by default', () => {
      const onPressMock = jest.fn();
      const element = SettingsRow({
        label: 'Reset All Data',
        isDestructive: true,
        onPress: onPressMock,
      });

      expect(element.props.accessibilityRole).toBe('button');
      element.props.onPress();
      expect(onPressMock).toHaveBeenCalledTimes(1);
    });

    it('SettingsSection renders header title and footer', () => {
      const child = SettingsRow({ label: 'Sample' });
      const section = SettingsSection({
        title: 'TEST SECTION',
        footer: 'Test footer explanation',
        children: child,
      });

      expect(section.props.children[0].props.children).toBe('TEST SECTION');
      expect(section.props.children[2].props.children).toBe('Test footer explanation');
    });
  });

  describe('SCEN-001: SettingsView 3-Section Grouped Layout', () => {
    const mockDiagnostics: DiagnosticsData = {
      schemaVersion: 2,
      accountCount: 3,
      categoryGroupCount: 4,
      categoryCount: 12,
      transactionCount: 42,
    };

    it('renders all 3 grouped sections: Entities, Data Management, Diagnostics', () => {
      const onClearTransactions = jest.fn();
      const onSeedDemoData = jest.fn();
      const onFactoryReset = jest.fn();
      const onNavigateToAccounts = jest.fn();
      const onNavigateToGroups = jest.fn();
      const onNavigateToCategories = jest.fn();

      const view = SettingsView({
        diagnostics: mockDiagnostics,
        onClearTransactions,
        onSeedDemoData,
        onFactoryReset,
        onNavigateToAccounts,
        onNavigateToGroups,
        onNavigateToCategories,
      });

      expect(view.props.testID).toBe('settings-scroll-view');

      // Children inside ScrollView: Header View, Section 1, Section 2, Section 3
      const children = view.props.children;
      expect(children).toHaveLength(4);

      // Section 1: ENTITIES
      const section1 = children[1];
      expect(section1.props.testID).toBe('settings-section-entities');
      expect(section1.props.title).toBe('ENTITIES');
      const s1Rows = section1.props.children;
      expect(s1Rows).toHaveLength(3);
      expect(s1Rows[0].props.testID).toBe('settings-row-accounts');
      expect(s1Rows[0].props.value).toBe(3);
      expect(s1Rows[1].props.testID).toBe('settings-row-groups');
      expect(s1Rows[1].props.value).toBe(4);
      expect(s1Rows[2].props.testID).toBe('settings-row-categories');
      expect(s1Rows[2].props.value).toBe(12);

      // Section 2: DATA MANAGEMENT
      const section2 = children[2];
      expect(section2.props.testID).toBe('settings-section-data');
      expect(section2.props.title).toBe('DATA MANAGEMENT');
      const s2Rows = section2.props.children;
      expect(s2Rows).toHaveLength(3);
      expect(s2Rows[0].props.testID).toBe('settings-row-clear-transactions');
      expect(s2Rows[1].props.testID).toBe('settings-row-seed-demo');
      expect(s2Rows[2].props.testID).toBe('settings-row-factory-reset');
      expect(s2Rows[2].props.isDestructive).toBe(true);

      // Section 3: DIAGNOSTICS & SYSTEM
      const section3 = children[3];
      expect(section3.props.testID).toBe('settings-section-diagnostics');
      expect(section3.props.title).toBe('DIAGNOSTICS & SYSTEM');
      const s3Rows = section3.props.children;
      expect(s3Rows).toHaveLength(5);
      expect(s3Rows[0].props.testID).toBe('settings-row-diag-schema');
      expect(s3Rows[0].props.value).toBe('v2');
      expect(s3Rows[1].props.testID).toBe('settings-row-diag-transactions');
      expect(s3Rows[1].props.value).toBe(42);
      expect(s3Rows[2].props.testID).toBe('settings-row-diag-accounts');
      expect(s3Rows[2].props.value).toBe(3);
      expect(s3Rows[3].props.testID).toBe('settings-row-diag-categories');
      expect(s3Rows[3].props.value).toBe(12);
      expect(s3Rows[4].props.testID).toBe('settings-row-diag-driver');
      expect(s3Rows[4].props.value).toBe('SQLite (local)');
    });

    it('triggers entity navigation callbacks when rows are tapped', () => {
      const onNavigateToAccounts = jest.fn();
      const onNavigateToGroups = jest.fn();
      const onNavigateToCategories = jest.fn();

      const view = SettingsView({
        diagnostics: mockDiagnostics,
        onClearTransactions: jest.fn(),
        onSeedDemoData: jest.fn(),
        onFactoryReset: jest.fn(),
        onNavigateToAccounts,
        onNavigateToGroups,
        onNavigateToCategories,
      });

      const s1Rows = view.props.children[1].props.children;
      s1Rows[0].props.onPress();
      expect(onNavigateToAccounts).toHaveBeenCalledTimes(1);

      s1Rows[1].props.onPress();
      expect(onNavigateToGroups).toHaveBeenCalledTimes(1);

      s1Rows[2].props.onPress();
      expect(onNavigateToCategories).toHaveBeenCalledTimes(1);
    });

    it('triggers data reset callbacks when rows are tapped', () => {
      const onClearTransactions = jest.fn();
      const onSeedDemoData = jest.fn();
      const onFactoryReset = jest.fn();

      const view = SettingsView({
        diagnostics: mockDiagnostics,
        onClearTransactions,
        onSeedDemoData,
        onFactoryReset,
        onNavigateToAccounts: jest.fn(),
        onNavigateToGroups: jest.fn(),
        onNavigateToCategories: jest.fn(),
      });

      const s2Rows = view.props.children[2].props.children;
      s2Rows[0].props.onPress();
      expect(onClearTransactions).toHaveBeenCalledTimes(1);

      s2Rows[1].props.onPress();
      expect(onSeedDemoData).toHaveBeenCalledTimes(1);

      s2Rows[2].props.onPress();
      expect(onFactoryReset).toHaveBeenCalledTimes(1);
    });
  });

  describe('Settings Controller Actions & Alert Prompts', () => {
    it('prompts confirmation and executes factory reset with route transition', () => {
      repo.createAccount({ name: 'Checking', accountType: 'checking', balanceCents: 50000 });
      expect(repo.getDiagnostics().accountCount).toBe(1);

      const alertSpy = jest.spyOn(Alert, 'alert');
      const onConfirmMock = jest.fn();

      promptFactoryReset(onConfirmMock);

      expect(alertSpy).toHaveBeenCalledWith(
        'Reset All Data?',
        expect.stringContaining('permanently erases'),
        expect.any(Array)
      );

      const alertButtons = fromAny<AlertButtonOption[], unknown>(alertSpy.mock.calls[0]?.[2] ?? []);
      const destructiveBtn = alertButtons.find((btn) => btn.style === 'destructive');
      expect(destructiveBtn).toBeDefined();

      // Trigger confirm
      destructiveBtn?.onPress?.();
      expect(onConfirmMock).toHaveBeenCalledTimes(1);

      // Execute factory reset
      repo.factoryReset();
      expect(repo.getDiagnostics().accountCount).toBe(0);
      expect(repo.getBudgetState().readyToAssignCents).toBe(0);
    });

    it('prompts confirmation and executes clear transactions only', () => {
      repo.createAccount({ name: 'Savings', accountType: 'savings', balanceCents: 100000 });
      const grp = repo.createCategoryGroup({ name: 'Living' });
      repo.createCategory({ groupId: grp.id, name: 'Groceries', targetCents: 0 });

      const alertSpy = jest.spyOn(Alert, 'alert');
      const onConfirmMock = jest.fn();

      promptClearTransactions(onConfirmMock);

      expect(alertSpy).toHaveBeenCalledWith(
        'Clear Transactions Only?',
        expect.stringContaining('re-anchor to your cash balance'),
        expect.any(Array)
      );

      const alertButtons = fromAny<AlertButtonOption[], unknown>(alertSpy.mock.calls[0]?.[2] ?? []);
      const destructiveBtn = alertButtons.find((btn) => btn.style === 'destructive');
      destructiveBtn?.onPress?.();
      expect(onConfirmMock).toHaveBeenCalledTimes(1);

      repo.clearTransactionsOnly();
      expect(repo.getDiagnostics().accountCount).toBe(1);
      expect(repo.getDiagnostics().categoryCount).toBe(1);
    });

    it('prompts confirmation and executes seed demo data', () => {
      repo.factoryReset();
      expect(repo.getDiagnostics().accountCount).toBe(0);

      const alertSpy = jest.spyOn(Alert, 'alert');
      const onConfirmMock = jest.fn();

      promptSeedDemoData(onConfirmMock);

      expect(alertSpy).toHaveBeenCalledWith(
        'Load Demo Starter Data?',
        expect.stringContaining('replace your current data'),
        expect.any(Array)
      );

      const alertButtons = fromAny<AlertButtonOption[], unknown>(alertSpy.mock.calls[0]?.[2] ?? []);
      const loadBtn = alertButtons.find((btn) => btn.text === 'Load Demo Data');
      loadBtn?.onPress?.();
      expect(onConfirmMock).toHaveBeenCalledTimes(1);

      repo.seedDemoData();
      expect(repo.getDiagnostics().accountCount).toBeGreaterThan(0);
      expect(repo.getDiagnostics().categoryCount).toBeGreaterThan(0);
    });
  });
});
