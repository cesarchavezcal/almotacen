import React, { useMemo, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useLedgerStore } from '@/src/storage/useLedgerStore';
import { calculateNetWorthTotals } from '@/src/domain/ledger/accountViewHelpers';
import { AccountsSettingsView, AccountModal } from '@/src/components/settings';
import { Account } from '@/src/domain/ledger/types';
import { formatCentsToCurrency, parseCurrencyToCents } from '@/src/domain/ledger/currency';

export default function AccountsSettingsScreen(): React.JSX.Element {
  const { state, createAccount, updateAccount, deleteAccount } = useLedgerStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState<Account['accountType']>('checking');
  const [balanceInput, setBalanceInput] = useState('$0.00');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const accountList = useMemo(() => {
    return Object.values(state.accounts).sort((a, b) => a.name.localeCompare(b.name));
  }, [state.accounts]);

  const { liquidCents } = useMemo(() => {
    return calculateNetWorthTotals(accountList);
  }, [accountList]);

  const handleOpenAdd = useCallback(() => {
    setEditingAccount(null);
    setName('');
    setAccountType('checking');
    setBalanceInput('$0.00');
    setErrorMessage(null);
    setModalVisible(true);
  }, []);

  const handleOpenEdit = useCallback((account: Account) => {
    setEditingAccount(account);
    setName(account.name);
    setAccountType(account.accountType);
    setBalanceInput(formatCentsToCurrency(Math.abs(account.balanceCents)));
    setErrorMessage(null);
    setModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    setEditingAccount(null);
    setErrorMessage(null);
  }, []);

  const handleSaveAccount = useCallback(() => {
    const trimmed = name.trim();
    if (!trimmed) {
      setErrorMessage('Account name cannot be empty.');
      return;
    }

    const trimmedBalance = balanceInput.trim();
    if (!trimmedBalance) {
      setErrorMessage('Starting balance cannot be empty.');
      return;
    }

    const numericOnly = trimmedBalance.replace(/[$,\s-]/g, '');
    if (numericOnly.length > 0 && isNaN(Number(numericOnly))) {
      setErrorMessage('Please enter a valid balance amount.');
      return;
    }

    const rawCents = parseCurrencyToCents(balanceInput);
    const balanceCents = accountType === 'credit' ? -Math.abs(rawCents) : rawCents;

    try {
      if (editingAccount) {
        updateAccount({
          id: editingAccount.id,
          name: trimmed,
          balanceCents,
        });
      } else {
        createAccount({
          name: trimmed,
          accountType,
          balanceCents,
        });
      }
      handleCloseModal();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save account.');
    }
  }, [name, balanceInput, accountType, editingAccount, createAccount, updateAccount, handleCloseModal]);

  const handleDeleteAccount = useCallback(() => {
    if (!editingAccount) return;
    const accountToDeleteId = editingAccount.id;
    const accountName = editingAccount.name;

    Alert.alert(
      'Delete Account?',
      `Are you sure you want to delete "${accountName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Deletion',
              'This cannot be undone. Are you sure you want to permanently delete this account?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Permanently Delete',
                  style: 'destructive',
                  onPress: () => {
                    try {
                      deleteAccount(accountToDeleteId);
                      handleCloseModal();
                    } catch (err: unknown) {
                      setErrorMessage(err instanceof Error ? err.message : 'Cannot delete account.');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  }, [editingAccount, deleteAccount, handleCloseModal]);

  return (
    <>
      <AccountsSettingsView
        accounts={accountList}
        totalBalanceCents={liquidCents}
        onAddAccount={handleOpenAdd}
        onSelectAccount={handleOpenEdit}
      />
      <AccountModal
        visible={modalVisible}
        isEditing={Boolean(editingAccount)}
        name={name}
        accountType={accountType}
        balanceInput={balanceInput}
        errorMessage={errorMessage}
        onNameChange={(text) => {
          setName(text);
          if (errorMessage) setErrorMessage(null);
        }}
        onAccountTypeChange={(type) => {
          setAccountType(type);
          if (errorMessage) setErrorMessage(null);
        }}
        onBalanceChange={(text) => {
          setBalanceInput(text);
          if (errorMessage) setErrorMessage(null);
        }}
        onDismissError={() => setErrorMessage(null)}
        onSave={handleSaveAccount}
        onDelete={editingAccount ? handleDeleteAccount : undefined}
        onClose={handleCloseModal}
      />
    </>
  );
}
