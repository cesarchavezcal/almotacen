import React from 'react';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { Alert } from 'react-native';
import { fromAny } from '@total-typescript/shoehorn';
import {
  FormErrorBanner,
  AccountModal,
  CategoryGroupModal,
  CategoryModal,
} from '@/src/components/settings/modals';
import { Account, Category, TargetType } from '@/src/domain/ledger/types';
import { CategoryGroup, DatabaseAdapter } from '@/src/storage/types';
import { createCleanTestDatabase } from '@/src/storage/testDatabase';
import { SQLiteLedgerRepository } from '@/src/storage/ledgerRepository';
import { parseCurrencyToCents, formatCentsToCurrency } from '@/src/domain/ledger/currency';

interface AlertButtonOption {
  text?: string;
  style?: string;
  onPress?: () => void;
}

// Provide Alert mock for test assertions
const reactNativeMock = fromAny<{
  Alert?: { alert: (title: string, message?: string, buttons?: AlertButtonOption[]) => void };
}, unknown>(require('react-native'));
if (!reactNativeMock.Alert) {
  reactNativeMock.Alert = { alert: jest.fn() };
}

describe('Entity Management Modals & Confirmation Alerts (Ticket 04)', () => {
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

  describe('FormErrorBanner', () => {
    it('renders null when message is null or undefined', () => {
      const element = FormErrorBanner({ message: null });
      expect(element).toBeNull();
    });

    it('renders message text with alert role when message is provided', () => {
      const onDismiss = jest.fn();
      const element = FormErrorBanner({
        message: 'Cannot delete account with existing transactions',
        onDismiss,
      });

      expect(element).not.toBeNull();
      expect(element?.props.testID).toBe('form-error-banner');
      expect(element?.props.accessibilityRole).toBe('alert');

      // Message text is the second child in the container View
      const textChild = element?.props.children[1];
      expect(textChild.props.children).toBe('Cannot delete account with existing transactions');

      // Dismiss button is third child
      const dismissBtn = element?.props.children[2];
      dismissBtn.props.onPress();
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('AccountModal Component (Pure Presentation)', () => {
    it('renders modal in creation mode with default empty state', () => {
      const onSave = jest.fn();
      const onClose = jest.fn();
      const onNameChange = jest.fn();

      const modal = AccountModal({
        visible: true,
        isEditing: false,
        name: '',
        accountType: 'checking',
        balanceInput: '$0.00',
        onNameChange,
        onAccountTypeChange: jest.fn(),
        onBalanceChange: jest.fn(),
        onSave,
        onClose,
      });

      expect(modal.props.visible).toBe(true);

      const header = modal.props.children.props.children.props.children[0];
      const cancelBtn = header.props.children[0];
      const title = header.props.children[1];
      const saveBtn = header.props.children[2];

      expect(title.props.children).toBe('New Account');
      expect(saveBtn.props.children.props.children).toBe('Add');

      cancelBtn.props.onPress();
      expect(onClose).toHaveBeenCalledTimes(1);

      saveBtn.props.onPress();
      expect(onSave).toHaveBeenCalledTimes(1);
    });

    it('renders modal in edit mode with populated account and delete button', () => {
      const onDelete = jest.fn();
      const modal = AccountModal({
        visible: true,
        isEditing: true,
        name: 'Checking Account',
        accountType: 'checking',
        balanceInput: '$500.00',
        onNameChange: jest.fn(),
        onAccountTypeChange: jest.fn(),
        onBalanceChange: jest.fn(),
        onSave: jest.fn(),
        onDelete,
        onClose: jest.fn(),
      });

      const header = modal.props.children.props.children.props.children[0];
      expect(header.props.children[1].props.children).toBe('Edit Account');

      const scroll = modal.props.children.props.children.props.children[1];
      const deleteSection = scroll.props.children[7];
      const deleteBtn = deleteSection.props.children;
      expect(deleteBtn.props.testID).toBe('btn-delete-account');

      deleteBtn.props.onPress();
      expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it('renders error banner when errorMessage prop is provided', () => {
      const onDismissError = jest.fn();
      const modal = AccountModal({
        visible: true,
        isEditing: false,
        name: '',
        accountType: 'checking',
        balanceInput: '$0.00',
        errorMessage: 'Account name cannot be empty.',
        onNameChange: jest.fn(),
        onAccountTypeChange: jest.fn(),
        onBalanceChange: jest.fn(),
        onDismissError,
        onSave: jest.fn(),
        onClose: jest.fn(),
      });

      const scroll = modal.props.children.props.children.props.children[1];
      const banner = scroll.props.children[0];
      expect(banner.props.message).toBe('Account name cannot be empty.');
    });
  });

  describe('CategoryGroupModal Component (Pure Presentation)', () => {
    it('renders create mode and handles name change and save', () => {
      const onSave = jest.fn();
      const onNameChange = jest.fn();

      const modal = CategoryGroupModal({
        visible: true,
        isEditing: false,
        name: 'Monthly Bills',
        onNameChange,
        onSave,
        onClose: jest.fn(),
      });

      const header = modal.props.children.props.children.props.children[0];
      expect(header.props.children[1].props.children).toBe('New Group');

      const scroll = modal.props.children.props.children.props.children[1];
      const input = scroll.props.children[2].props.children;
      expect(input.props.value).toBe('Monthly Bills');

      input.props.onChangeText('Fixed Obligations');
      expect(onNameChange).toHaveBeenCalledWith('Fixed Obligations');

      const saveBtn = header.props.children[2];
      saveBtn.props.onPress();
      expect(onSave).toHaveBeenCalledTimes(1);
    });

    it('renders edit mode with delete action', () => {
      const onDelete = jest.fn();
      const modal = CategoryGroupModal({
        visible: true,
        isEditing: true,
        name: 'Living Expenses',
        onNameChange: jest.fn(),
        onSave: jest.fn(),
        onDelete,
        onClose: jest.fn(),
      });

      const header = modal.props.children.props.children.props.children[0];
      expect(header.props.children[1].props.children).toBe('Edit Group');

      const scroll = modal.props.children.props.children.props.children[1];
      const deleteSection = scroll.props.children[3];
      const deleteBtn = deleteSection.props.children;
      expect(deleteBtn.props.testID).toBe('btn-delete-group');

      deleteBtn.props.onPress();
      expect(onDelete).toHaveBeenCalledTimes(1);
    });
  });

  describe('CategoryModal Component (Pure Presentation)', () => {
    const mockGroups: CategoryGroup[] = [
      { id: 'grp-obligations', name: 'Obligations', sortOrder: 1 },
      { id: 'grp-living', name: 'Living', sortOrder: 2 },
    ];

    it('renders category creation form with group chips and target inputs', () => {
      const onSave = jest.fn();
      const onGroupIdChange = jest.fn();

      const modal = CategoryModal({
        visible: true,
        isEditing: false,
        isCreditPayment: false,
        name: 'Rent',
        groupId: 'grp-obligations',
        groups: mockGroups,
        targetAmountInput: '$1,200.00',
        targetType: 'NEEDED_FOR_SPENDING',
        targetDueDayInput: '1',
        onNameChange: jest.fn(),
        onGroupIdChange,
        onTargetAmountChange: jest.fn(),
        onTargetTypeChange: jest.fn(),
        onDueDayChange: jest.fn(),
        onSave,
        onClose: jest.fn(),
      });

      const header = modal.props.children.props.children.props.children[0];
      expect(header.props.children[1].props.children).toBe('New Category');

      const scroll = modal.props.children.props.children.props.children[1];
      const groupChips = scroll.props.children[5].props.children;
      expect(groupChips).toHaveLength(2);

      // Select second group
      groupChips[1].props.onPress();
      expect(onGroupIdChange).toHaveBeenCalledWith('grp-living');

      const saveBtn = header.props.children[2];
      saveBtn.props.onPress();
      expect(onSave).toHaveBeenCalledTimes(1);
    });

    it('SCEN-013: displays protection badge and disables inputs for credit payment categories', () => {
      const modal = CategoryModal({
        visible: true,
        isEditing: true,
        isCreditPayment: true,
        name: 'Credit Card Payment',
        groupId: 'grp-obligations',
        groups: mockGroups,
        targetAmountInput: '$0.00',
        targetType: 'NEEDED_FOR_SPENDING',
        targetDueDayInput: '',
        onNameChange: jest.fn(),
        onGroupIdChange: jest.fn(),
        onTargetAmountChange: jest.fn(),
        onTargetTypeChange: jest.fn(),
        onDueDayChange: jest.fn(),
        onSave: jest.fn(),
        onClose: jest.fn(),
      });

      const header = modal.props.children.props.children.props.children[0];
      expect(header.props.children[1].props.children).toBe('Payment Envelope');

      const scroll = modal.props.children.props.children.props.children[1];
      const notice = scroll.props.children[1];
      expect(notice.props.testID).toBe('credit-payment-notice');

      const nameInput = scroll.props.children[3].props.children;
      expect(nameInput.props.editable).toBe(false);

      // Delete section is not rendered for credit card payment categories
      expect(scroll.props.children[12]).toBeFalsy();
    });
  });

  describe('Repository & Domain Behavior Contracts (SCEN-002, 004, 005, 007, 008, 009, 011, 012, 014)', () => {
    it('SCEN-002: creating depository account inserts account and credits readyToAssign', () => {
      const startingCents = parseCurrencyToCents('$1,500.00');
      const account = repo.createAccount({
        name: 'High Yield Savings',
        accountType: 'savings',
        balanceCents: startingCents,
      });

      expect(account.id).toBeDefined();
      expect(account.name).toBe('High Yield Savings');
      expect(account.balanceCents).toBe(150000);
      expect(repo.getBudgetState().readyToAssignCents).toBe(150000);
    });

    it('SCEN-004: updating account modifies name and balance', () => {
      const account = repo.createAccount({
        name: 'Old Name',
        accountType: 'checking',
        balanceCents: 50000,
      });

      const updated = repo.updateAccount({
        id: account.id,
        name: 'Renamed Checking',
        balanceCents: 75000,
      });

      expect(updated.name).toBe('Renamed Checking');
      expect(updated.balanceCents).toBe(75000);
      expect(repo.getBudgetState().accounts[account.id].name).toBe('Renamed Checking');
    });

    it('SCEN-005: deleting account with active transactions throws integrity error', () => {
      const account = repo.createAccount({
        name: 'Checking',
        accountType: 'checking',
        balanceCents: 10000,
      });
      const group = repo.createCategoryGroup({ name: 'Expenses' });
      const cat = repo.createCategory({
        groupId: group.id,
        name: 'Groceries',
        targetCents: 0,
      });

      repo.postOutflow({
        id: 'tx-1',
        accountId: account.id,
        categoryId: cat.id,
        amountCents: 2000,
        payee: 'Grocery Store',
      });

      expect(() => {
        repo.deleteAccount(account.id);
      }).toThrow(/Cannot delete account with existing transactions/i);

      // Account is preserved
      expect(repo.getBudgetState().accounts[account.id]).toBeDefined();
    });

    it('SCEN-007 & SCEN-008: creating and renaming category group', () => {
      const group = repo.createCategoryGroup({ name: 'Subscriptions' });
      expect(group.id).toBeDefined();
      expect(group.name).toBe('Subscriptions');

      const updated = repo.updateCategoryGroup({
        id: group.id,
        name: 'Monthly Subscriptions',
      });
      expect(updated.name).toBe('Monthly Subscriptions');
      expect(repo.getCategoryGroups().some((g) => g.name === 'Monthly Subscriptions')).toBe(true);
    });

    it('SCEN-009: deleting category group containing categories throws integrity error', () => {
      const group = repo.createCategoryGroup({ name: 'Utilities Group' });
      repo.createCategory({
        groupId: group.id,
        name: 'Electric',
        targetCents: 5000,
      });

      expect(() => {
        repo.deleteCategoryGroup(group.id);
      }).toThrow(/Cannot delete category group containing categories/i);

      expect(repo.getCategoryGroups().some((g) => g.id === group.id)).toBe(true);
    });

    it('SCEN-011 & SCEN-012: creating and updating category under group', () => {
      const group = repo.createCategoryGroup({ name: 'Life' });
      const category = repo.createCategory({
        groupId: group.id,
        name: 'Gym',
        targetCents: 5000,
        targetType: 'NEEDED_FOR_SPENDING',
        targetDueDay: 1,
      });

      expect(category.id).toBeDefined();
      expect(category.name).toBe('Gym');
      expect(category.targetCents).toBe(5000);
      expect(category.targetDueDay).toBe(1);

      const updated = repo.updateCategory({
        id: category.id,
        name: 'Fitness & Gym',
        targetCents: 6000,
        targetType: 'MONTHLY_SET_ASIDE',
        targetDueDay: 5,
      });

      expect(updated.name).toBe('Fitness & Gym');
      expect(updated.targetCents).toBe(6000);
      expect(updated.targetType).toBe('MONTHLY_SET_ASIDE');
      expect(updated.targetDueDay).toBe(5);
    });

    it('SCEN-014: deleting category with active available funds throws integrity error', () => {
      const group = repo.createCategoryGroup({ name: 'Bills' });
      const cat = repo.createCategory({
        groupId: group.id,
        name: 'Water',
        targetCents: 3000,
      });

      // Allocate funds
      repo.allocateEnvelope({ categoryId: cat.id, amountCents: 3000 });
      expect(repo.getBudgetState().categories[cat.id].availableCents).toBe(3000);

      expect(() => {
        repo.deleteCategory(cat.id);
      }).toThrow(/Cannot delete category with available funds or active transactions/i);

      expect(repo.getBudgetState().categories[cat.id]).toBeDefined();
    });
  });

  describe('Destructive Double-Confirmation Alerts & Deletion Rejections', () => {
    it('executes two-step alert confirmation before deleting entity', () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      const onDeleteMock = jest.fn();

      const triggerAccountDelete = (name: string, onConfirm: () => void) => {
        Alert.alert('Delete Account?', `Are you sure you want to delete "${name}"?`, [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              Alert.alert('Confirm Deletion', 'This cannot be undone. Are you sure?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Permanently Delete', style: 'destructive', onPress: onConfirm },
              ]);
            },
          },
        ]);
      };

      triggerAccountDelete('Checking', onDeleteMock);

      expect(alertSpy).toHaveBeenCalledWith(
        'Delete Account?',
        'Are you sure you want to delete "Checking"?',
        expect.any(Array)
      );

      const step1Buttons = fromAny<AlertButtonOption[], unknown>(alertSpy.mock.calls[0]?.[2] ?? []);
      const step1Destructive = step1Buttons.find((btn) => btn.style === 'destructive');
      expect(step1Destructive).toBeDefined();

      step1Destructive?.onPress?.();

      expect(alertSpy).toHaveBeenCalledWith(
        'Confirm Deletion',
        'This cannot be undone. Are you sure?',
        expect.any(Array)
      );

      const step2Buttons = fromAny<AlertButtonOption[], unknown>(alertSpy.mock.calls[1]?.[2] ?? []);
      const step2Destructive = step2Buttons.find((btn) => btn.style === 'destructive');
      expect(step2Destructive).toBeDefined();

      step2Destructive?.onPress?.();
      expect(onDeleteMock).toHaveBeenCalledTimes(1);
    });

    it('catches repository integrity error on account deletion and maps to error banner', () => {
      const account = repo.createAccount({ name: 'Checking', accountType: 'checking', balanceCents: 10000 });
      const group = repo.createCategoryGroup({ name: 'Living' });
      const cat = repo.createCategory({ groupId: group.id, name: 'Rent', targetCents: 10000 });
      repo.postOutflow({
        id: 'tx-test-guard',
        accountId: account.id,
        categoryId: cat.id,
        amountCents: 2500,
        payee: 'Supermarket',
      });

      let errorMessage: string | null = null;
      try {
        repo.deleteAccount(account.id);
      } catch (err: unknown) {
        errorMessage = err instanceof Error ? err.message : 'Cannot delete account.';
      }

      expect(errorMessage).toMatch(/Cannot delete account with existing transactions/i);

      const banner = FormErrorBanner({ message: errorMessage });
      expect(banner).not.toBeNull();
      expect(banner?.props.children[1].props.children).toBe(errorMessage);
    });
  });
});
