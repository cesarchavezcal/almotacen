import { useState, useMemo, useEffect, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { useLedgerStore } from '../storage/useLedgerStore';
import { useSmartPayeeMemory } from './useSmartPayeeMemory';
import { ExpenseIntake, ExpenseImpactPreview } from '../domain/ledger/expenseIntake';
import { Account, Category } from '../domain/ledger/types';

export interface UseExpenseIntakeResult {
  amount: string;
  setAmount: (val: string) => void;
  payee: string;
  setPayee: (val: string) => void;
  onPayeeChange: (val: string) => void;
  onPayeePillTap: (val: string) => void;
  recentPayees: string[];
  categories: Category[];
  selectedCategoryId: string;
  onCategorySelect: (id: string) => void;
  accounts: Account[];
  selectedAccountId: string;
  onAccountSelect: (id: string) => void;
  selectedCategory: Category | undefined;
  preview: ExpenseImpactPreview;
  submitted: boolean;
  errorMsg: string | null;
  submit: () => Promise<boolean>;
}

async function safeHaptic(action: () => Promise<unknown>): Promise<void> {
  try {
    await action();
  } catch (err: unknown) {
    console.debug('[safeHaptic] feedback skipped:', err);
  }
}

export function useExpenseIntake(): UseExpenseIntakeResult {
  const { state, postOutflow } = useLedgerStore();
  const { recentPayees, suggestForPayee } = useSmartPayeeMemory(state.transactions);

  const accounts = useMemo(() => Object.values(state.accounts), [state.accounts]);
  const categories = useMemo(
    () => Object.values(state.categories).filter((c) => !c.isCreditPayment),
    [state.categories]
  );

  const [amount, setAmount] = useState('');
  const [payee, setPayee] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categories[0]?.id || '');
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedCategoryId && categories.length > 0) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  useEffect(() => {
    if (!selectedAccountId && accounts.length > 0) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  const onPayeeChange = useCallback(
    (text: string) => {
      setPayee(text);
      setErrorMsg(null);
      const suggestion = suggestForPayee(text);
      if (suggestion) {
        if (suggestion.categoryId && state.categories[suggestion.categoryId]) {
          setSelectedCategoryId(suggestion.categoryId);
        }
        if (suggestion.accountId && state.accounts[suggestion.accountId]) {
          setSelectedAccountId(suggestion.accountId);
        }
      }
    },
    [suggestForPayee, state.categories, state.accounts]
  );

  const onPayeePillTap = useCallback(
    (p: string) => {
      void safeHaptic(() => Haptics.selectionAsync());
      onPayeeChange(p);
    },
    [onPayeeChange]
  );

  const onCategorySelect = useCallback((id: string) => {
    void safeHaptic(() => Haptics.selectionAsync());
    setSelectedCategoryId(id);
    setErrorMsg(null);
  }, []);

  const onAccountSelect = useCallback((id: string) => {
    void safeHaptic(() => Haptics.selectionAsync());
    setSelectedAccountId(id);
    setErrorMsg(null);
  }, []);

  const selectedCategory = state.categories[selectedCategoryId];

  const preview = useMemo(() => {
    return ExpenseIntake.previewImpact({
      category: selectedCategory,
      amountText: amount,
    });
  }, [selectedCategory, amount]);

  const submit = useCallback(async (): Promise<boolean> => {
    try {
      const built = ExpenseIntake.validateAndBuildOutflow({
        amountText: amount,
        payeeText: payee,
        categoryId: selectedCategoryId,
        accountId: selectedAccountId,
      });

      postOutflow(built);
      await safeHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
      setSubmitted(true);
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to record transaction in local ledger';
      setErrorMsg(message);
      await safeHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
      return false;
    }
  }, [amount, payee, selectedCategoryId, selectedAccountId, postOutflow]);

  return {
    amount,
    setAmount: (val: string) => {
      setAmount(val);
      setErrorMsg(null);
    },
    payee,
    setPayee,
    onPayeeChange,
    onPayeePillTap,
    recentPayees,
    categories,
    selectedCategoryId,
    onCategorySelect,
    accounts,
    selectedAccountId,
    onAccountSelect,
    selectedCategory,
    preview,
    submitted,
    errorMsg,
    submit,
  };
}
