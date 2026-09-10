import { useMemo } from 'react';
import { useLedgerStore } from '../storage/useLedgerStore';
import {
  buildDailyTrajectorySeries,
  CashflowMetrics,
} from '../domain/cashflow/cashflowCalculations';
import { Transaction } from '../domain/ledger/types';

export interface UseCashflowResult {
  metrics: CashflowMetrics;
  recentOutflows: Transaction[];
  monthLabel: string;
  currentDay: number;
  totalDaysInMonth: number;
}

const MONTH_NAMES = [
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
];

export function useCashflow(customDate?: Date): UseCashflowResult {
  const { state } = useLedgerStore();
  const date = customDate ?? new Date();

  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-indexed
  const currentDay = date.getDate();

  // Days in month: day 0 of next month gives total days in current month
  const totalDaysInMonth = new Date(year, month, 0).getDate();
  const monthName = MONTH_NAMES[date.getMonth()];
  const monthLabel = `${monthName} Cash Flow`;

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

    // Filter transactions for this month
    const monthPrefix = `${year}-${month.toString().padStart(2, '0')}`;
    const monthTransactions = state.transactions.filter((tx) =>
      tx.occurredAt.startsWith(monthPrefix)
    );

    const calculatedMetrics = buildDailyTrajectorySeries({
      transactions: monthTransactions,
      categories: state.categories,
      currentDay,
      totalDaysInMonth,
      year,
      month,
      incomeCeilingCents: state.totalInflowCents > 0 ? state.totalInflowCents : undefined,
    });

    // Recent outflows sorted by occurredAt descending
    const outflows = state.transactions
      .filter((tx) => tx.direction === 'outflow')
      .slice()
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
      .slice(0, 10);

    return {
      metrics: calculatedMetrics,
      recentOutflows: outflows,
    };
  }, [state, year, month, currentDay, totalDaysInMonth]);

  return {
    metrics,
    recentOutflows,
    monthLabel,
    currentDay,
    totalDaysInMonth,
  };
}
