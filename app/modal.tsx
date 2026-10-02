import React from 'react';
import { useRouter } from 'expo-router';
import { useExpenseIntake } from '@/src/hooks/useExpenseIntake';
import { QuickEntryView } from '@/src/components/expense/QuickEntryView';

const NAV_DISMISS_DELAY_MS = 350;

export default function QuickEntryModal(): React.JSX.Element {
  const router = useRouter();
  const intake = useExpenseIntake();

  const handleSave = async (): Promise<void> => {
    const success = await intake.submit();
    if (success) {
      setTimeout(() => {
        router.back();
      }, NAV_DISMISS_DELAY_MS);
    }
  };

  const handleClose = (): void => {
    router.back();
  };

  return (
    <QuickEntryView
      amount={intake.amount}
      setAmount={intake.setAmount}
      payee={intake.payee}
      onPayeeChange={intake.onPayeeChange}
      onPayeePillTap={intake.onPayeePillTap}
      recentPayees={intake.recentPayees}
      categories={intake.categories}
      selectedCategoryId={intake.selectedCategoryId}
      onCategorySelect={intake.onCategorySelect}
      accounts={intake.accounts}
      selectedAccountId={intake.selectedAccountId}
      onAccountSelect={intake.onAccountSelect}
      selectedCategory={intake.selectedCategory}
      currentAvailableCents={intake.selectedCategory?.availableCents ?? 0}
      remainingAvailableCents={intake.preview.remainingAvailableCents}
      isOverspent={intake.preview.isOverspent}
      submitted={intake.submitted}
      errorMsg={intake.errorMsg}
      onSave={handleSave}
      onClose={handleClose}
    />
  );
}
