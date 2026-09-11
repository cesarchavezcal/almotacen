import { useMemo, useState, useCallback } from 'react';
import { useLedgerStore } from '../storage/useLedgerStore';
import {
  buildDailyTrajectorySeries,
  CashflowMetrics,
  DailyTrajectoryPoint,
} from '../domain/cashflow/cashflowCalculations';
import { filterTransactionsByDate } from '../domain/cashflow/scrubbingMath';
import { Transaction } from '../domain/ledger/types';

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export interface MonthNavigationState {
  year: number;
  month: number;
  totalDaysInMonth: number;
  effectiveCurrentDay: number;
  isPastMonth: boolean;
  isFutureMonth: boolean;
  isCurrentMonth: boolean;
  monthName: string;
  cycleTitle: string;
  monthLabel: string;
}

export function getMonthNavigationState(
  selectedDate: Date,
  referenceDate: Date = new Date()
): MonthNavigationState {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth() + 1; // 1-indexed

  const refYear = referenceDate.getFullYear();
  const refMonth = referenceDate.getMonth() + 1;

  const isPastMonth = year < refYear || (year === refYear && month < refMonth);
  const isFutureMonth = year > refYear || (year === refYear && month > refMonth);
  const isCurrentMonth = !isPastMonth && !isFutureMonth;

  const totalDaysInMonth = new Date(year, month, 0).getDate();
  const effectiveCurrentDay = isPastMonth
    ? totalDaysInMonth
    : isFutureMonth
      ? 0
      : referenceDate.getDate();

  const monthName = MONTH_NAMES[selectedDate.getMonth()];
  const cycleTitle = `${monthName} ${year}`;
  const monthLabel = `${monthName} Cash Flow`;

  return {
    year,
    month,
    totalDaysInMonth,
    effectiveCurrentDay,
    isPastMonth,
    isFutureMonth,
    isCurrentMonth,
    monthName,
    cycleTitle,
    monthLabel,
  };
}

export function shiftMonth(date: Date, offsetMonths: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + offsetMonths, 1);
}

export interface UseCashflowOptions {
  initialDate?: Date;
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
}

export interface UseCashflowResult {
  metrics: CashflowMetrics;
  recentOutflows: Transaction[];
  displayedOutflows: Transaction[];
  activeScrubDate: string | null;
  monthLabel: string;
  cycleTitle: string;
  currentDay: number;
  totalDaysInMonth: number;
  selectedDate: Date;
  isCurrentMonth: boolean;
  isPastMonth: boolean;
  isFutureMonth: boolean;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  goToCurrentMonth: () => void;
  handleScrubChange: (day: number | null, point: DailyTrajectoryPoint | null) => void;
  setActiveScrubDate: (date: string | null) => void;
}

export function useCashflow(dateOrOptions?: Date | UseCashflowOptions): UseCashflowResult {
  const { state } = useLedgerStore();

  const options: UseCashflowOptions =
    dateOrOptions instanceof Date
      ? { initialDate: dateOrOptions }
      : dateOrOptions || {};

  const [internalDate, setInternalDate] = useState<Date>(
    options.selectedDate ?? options.initialDate ?? new Date()
  );
  const [activeScrubDate, setActiveScrubDate] = useState<string | null>(null);

  const activeDate = options.selectedDate ?? internalDate;

  const updateDate = useCallback(
    (newDate: Date) => {
      setActiveScrubDate(null);
      if (options.onDateChange) {
        options.onDateChange(newDate);
      } else {
        setInternalDate(newDate);
      }
    },
    [options]
  );

  const goToPreviousMonth = useCallback(() => {
    updateDate(shiftMonth(activeDate, -1));
  }, [activeDate, updateDate]);

  const goToNextMonth = useCallback(() => {
    updateDate(shiftMonth(activeDate, 1));
  }, [activeDate, updateDate]);

  const goToCurrentMonth = useCallback(() => {
    updateDate(new Date());
  }, [updateDate]);

  const handleScrubChange = useCallback((_day: number | null, point: DailyTrajectoryPoint | null) => {
    setActiveScrubDate(point ? point.dateStr : null);
  }, []);

  const navState = useMemo(
    () => getMonthNavigationState(activeDate),
    [activeDate]
  );

  const { metrics, recentOutflows } = useMemo(() => {
    if (!state) {
      return {
        metrics: {
          totalInflowCents: 0,
          totalOutflowCents: 0,
          netCashflowCents: 0,
          totalBudgetPlannedCents: 0,
          burnRatePercent: 0,
          burnStatus: 'ON_TRACK' as const,
          linearPaceToDateCents: 0,
          projectedEomSpendCents: 0,
          incomeCeilingCents: 0,
          isIncomeCeilingBreached: false,
          dailyPoints: [],
        },
        recentOutflows: [],
      };
    }

    // Filter transactions for this month (YYYY-MM)
    const monthPrefix = `${navState.year}-${navState.month.toString().padStart(2, '0')}`;
    const monthTransactions = state.transactions.filter((tx) =>
      tx.occurredAt.startsWith(monthPrefix)
    );

    const calculatedMetrics = buildDailyTrajectorySeries({
      transactions: monthTransactions,
      categories: state.categories,
      currentDay: navState.effectiveCurrentDay,
      totalDaysInMonth: navState.totalDaysInMonth,
      year: navState.year,
      month: navState.month,
      incomeCeilingCents: state.totalInflowCents > 0 ? state.totalInflowCents : undefined,
    });

    // Month outflows sorted by occurredAt descending
    const outflows = monthTransactions
      .filter((tx) => tx.direction === 'outflow')
      .slice()
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
      .slice(0, 10);

    return {
      metrics: calculatedMetrics,
      recentOutflows: outflows,
    };
  }, [state, navState]);

  const displayedOutflows = useMemo(() => {
    if (!activeScrubDate) {
      return recentOutflows;
    }
    return filterTransactionsByDate(state?.transactions ?? [], activeScrubDate);
  }, [activeScrubDate, recentOutflows, state?.transactions]);

  return {
    metrics,
    recentOutflows,
    displayedOutflows,
    activeScrubDate,
    monthLabel: navState.monthLabel,
    cycleTitle: navState.cycleTitle,
    currentDay: navState.effectiveCurrentDay,
    totalDaysInMonth: navState.totalDaysInMonth,
    selectedDate: activeDate,
    isCurrentMonth: navState.isCurrentMonth,
    isPastMonth: navState.isPastMonth,
    isFutureMonth: navState.isFutureMonth,
    goToPreviousMonth,
    goToNextMonth,
    goToCurrentMonth,
    handleScrubChange,
    setActiveScrubDate,
  };
}
