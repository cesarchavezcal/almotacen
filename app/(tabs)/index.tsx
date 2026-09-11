import React, { useState, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { CashFlowView } from '@/src/components/CashFlowView';
import { useCashflow } from '@/src/hooks/useCashflow';
import { useLedgerStore } from '@/src/storage/useLedgerStore';

export default function CashFlowScreen(): React.JSX.Element {
  const {
    metrics,
    displayedOutflows,
    monthLabel,
    cycleTitle,
    isCurrentMonth,
    currentDay,
    totalDaysInMonth,
    activeScrubDate,
    handleScrubChange,
    goToPreviousMonth,
    goToNextMonth,
    goToCurrentMonth,
  } = useCashflow();

  const { state } = useLedgerStore();
  const [isScrollLocked, setIsScrollLocked] = useState<boolean>(false);

  const handleScrollLockChange = useCallback((isLocked: boolean) => {
    setIsScrollLocked(isLocked);
  }, []);

  const handleLogPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch((err: unknown) => {
      console.warn('Failed to trigger haptic feedback on quick log press:', err);
    });
  }, []);

  return (
    <CashFlowView
      metrics={metrics}
      recentOutflows={displayedOutflows}
      categories={state?.categories ?? {}}
      monthLabel={monthLabel}
      cycleTitle={cycleTitle}
      isCurrentMonth={isCurrentMonth}
      currentDay={currentDay}
      totalDaysInMonth={totalDaysInMonth}
      isScrollLocked={isScrollLocked}
      activeScrubDate={activeScrubDate}
      onScrubChange={handleScrubChange}
      onScrollLockChange={handleScrollLockChange}
      onLogPress={handleLogPress}
      onPrevMonth={goToPreviousMonth}
      onNextMonth={goToNextMonth}
      onCurrentMonth={goToCurrentMonth}
    />
  );
}
