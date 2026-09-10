import { Transaction } from '../ledger/types';
import { formatSignedCents, formatCentsToCurrency } from '../ledger/currency';

export interface FormattedPaceDelta {
  text: string;
  isAhead: boolean;
}

/**
 * Maps a horizontal touch coordinate to an integer calendar day (1..totalDaysInMonth)
 * and clamps coordinates outside the plot area strictly to month boundaries (SCEN-020).
 */
export function calculateScrubbedDay(
  touchX: number,
  chartWidth: number,
  paddingLeft: number,
  paddingRight: number,
  totalDaysInMonth: number
): number {
  if (totalDaysInMonth <= 1) {
    return 1;
  }

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  if (innerWidth <= 0) {
    return 1;
  }

  // Clamp raw touch coordinate to [paddingLeft, paddingLeft + innerWidth]
  const clampedX = Math.min(Math.max(paddingLeft, touchX), paddingLeft + innerWidth);
  const fraction = (clampedX - paddingLeft) / innerWidth;

  const dayIndex = Math.round(fraction * (totalDaysInMonth - 1)) + 1;
  return Math.min(Math.max(1, dayIndex), totalDaysInMonth);
}

/**
 * Computes pace delta: actual or projected cumulative spend minus linear budget pace in cents (SCEN-021).
 * - Negative delta: actual spend is below pace (ahead of pace).
 * - Positive delta: actual spend is above pace (behind pace).
 */
export function calculatePaceDeltaCents(
  spendCents: number,
  linearBudgetPaceCents: number
): number {
  return spendCents - linearBudgetPaceCents;
}

/**
 * Formats signed pace delta in integer cents into human-readable HUD microcopy (SCEN-021).
 */
export function formatPaceDelta(deltaCents: number): FormattedPaceDelta {
  if (deltaCents === 0) {
    return {
      text: `${formatCentsToCurrency(0)} on pace`,
      isAhead: true,
    };
  }

  const isAhead = deltaCents < 0;
  const formattedAmount = formatSignedCents(deltaCents);
  const statusLabel = isAhead ? 'ahead of pace' : 'behind pace';

  return {
    text: `${formattedAmount} ${statusLabel}`,
    isAhead,
  };
}

/**
 * Dynamically filters monthly transactions down to outflows for a specific calendar date (SCEN-022).
 * Returns matching outflow transactions sorted descending by timestamp.
 */
export function filterTransactionsByDate(
  transactions: Transaction[],
  dateStr: string
): Transaction[] {
  if (!transactions || !dateStr) {
    return [];
  }

  return transactions
    .filter((tx) => tx.direction === 'outflow' && tx.occurredAt.startsWith(dateStr))
    .slice()
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
}
