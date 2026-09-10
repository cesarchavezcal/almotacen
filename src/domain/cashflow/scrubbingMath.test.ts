import { describe, it, expect } from '@jest/globals';
import {
  calculateScrubbedDay,
  calculatePaceDeltaCents,
  formatPaceDelta,
  filterTransactionsByDate,
} from './scrubbingMath';
import { Transaction } from '../ledger/types';

describe('Interactive Chart Scrubbing Math (SCEN-020..SCEN-023)', () => {
  describe('SCEN-020: Touch to Calendar Day Mapping & Boundary Clamping', () => {
    const chartWidth = 330;
    const paddingLeft = 15;
    const paddingRight = 15;
    const innerWidth = 300; // 330 - 30
    const totalDaysInMonth = 30;

    it('maps touch coordinate at exact start of inner width to day 1', () => {
      const day = calculateScrubbedDay(15, chartWidth, paddingLeft, paddingRight, totalDaysInMonth);
      expect(day).toBe(1);
    });

    it('maps touch coordinate at exact end of inner width to last day (30)', () => {
      const day = calculateScrubbedDay(315, chartWidth, paddingLeft, paddingRight, totalDaysInMonth);
      expect(day).toBe(30);
    });

    it('maps touch coordinate at exact midpoint to day 15 or 16', () => {
      // 15 + 150 = 165px
      const day = calculateScrubbedDay(165, chartWidth, paddingLeft, paddingRight, totalDaysInMonth);
      // fraction = 150 / 300 = 0.5 -> 0.5 * 29 = 14.5 -> round to 15 -> day 1 + 15 = 16
      expect(day).toBe(16);
    });

    it('clamps negative or left-overflow touch coordinates to day 1', () => {
      expect(calculateScrubbedDay(-50, chartWidth, paddingLeft, paddingRight, totalDaysInMonth)).toBe(1);
      expect(calculateScrubbedDay(0, chartWidth, paddingLeft, paddingRight, totalDaysInMonth)).toBe(1);
      expect(calculateScrubbedDay(10, chartWidth, paddingLeft, paddingRight, totalDaysInMonth)).toBe(1);
    });

    it('clamps far right overflow touch coordinates to last day of month', () => {
      expect(calculateScrubbedDay(350, chartWidth, paddingLeft, paddingRight, totalDaysInMonth)).toBe(30);
      expect(calculateScrubbedDay(1000, chartWidth, paddingLeft, paddingRight, totalDaysInMonth)).toBe(30);
    });

    it('handles 31-day and 28-day months cleanly', () => {
      // 31 days: midpoint 165px -> 0.5 * 30 = 15 -> 1 + 15 = 16
      expect(calculateScrubbedDay(165, chartWidth, paddingLeft, paddingRight, 31)).toBe(16);
      expect(calculateScrubbedDay(315, chartWidth, paddingLeft, paddingRight, 31)).toBe(31);

      // 28 days: end 315px -> 28
      expect(calculateScrubbedDay(315, chartWidth, paddingLeft, paddingRight, 28)).toBe(28);
    });
  });

  describe('SCEN-021: Pace Delta Calculation & Tooltip Formatting', () => {
    it('computes negative delta when actual spend is less than linear budget pace (ahead of pace)', () => {
      const actualSpendCents = 138000; // $1,380.00
      const linearPaceCents = 150000; // $1,500.00
      const delta = calculatePaceDeltaCents(actualSpendCents, linearPaceCents);
      expect(delta).toBe(-12000); // -$120.00

      const formatted = formatPaceDelta(delta);
      expect(formatted.isAhead).toBe(true);
      expect(formatted.text).toBe('-$120.00 ahead of pace');
    });

    it('computes positive delta when actual spend exceeds linear budget pace (behind pace)', () => {
      const actualSpendCents = 162000; // $1,620.00
      const linearPaceCents = 150000; // $1,500.00
      const delta = calculatePaceDeltaCents(actualSpendCents, linearPaceCents);
      expect(delta).toBe(12000); // +$120.00

      const formatted = formatPaceDelta(delta);
      expect(formatted.isAhead).toBe(false);
      expect(formatted.text).toBe('+$120.00 behind pace');
    });

    it('formats exact match as on pace', () => {
      const delta = calculatePaceDeltaCents(150000, 150000);
      expect(delta).toBe(0);

      const formatted = formatPaceDelta(delta);
      expect(formatted.isAhead).toBe(true);
      expect(formatted.text).toBe('$0.00 on pace');
    });
  });

  describe('SCEN-022: Dynamic Day Filter for Outflow Transactions', () => {
    const transactions: Transaction[] = [
      {
        id: 'tx-1',
        accountId: 'acc-chk',
        payee: "Trader Joe's",
        amountCents: 8420,
        direction: 'outflow',
        occurredAt: '2026-09-12T13:45:00.000Z',
        syncStatus: 'synced',
      },
      {
        id: 'tx-2',
        accountId: 'acc-chk',
        payee: 'Apple Store',
        amountCents: 12900,
        direction: 'outflow',
        occurredAt: '2026-09-12T16:00:00.000Z',
        syncStatus: 'synced',
      },
      {
        id: 'tx-3',
        accountId: 'acc-chk',
        payee: 'Blue Bottle Coffee',
        amountCents: 650,
        direction: 'outflow',
        occurredAt: '2026-09-06T09:30:00.000Z',
        syncStatus: 'synced',
      },
      {
        id: 'tx-inflow',
        accountId: 'acc-chk',
        payee: 'Paycheck',
        amountCents: 200000,
        direction: 'inflow',
        occurredAt: '2026-09-12T08:00:00.000Z',
        syncStatus: 'synced',
      },
    ];

    it('filters only outflow transactions occurring on the exact calendar day', () => {
      const filtered = filterTransactionsByDate(transactions, '2026-09-12');
      expect(filtered).toHaveLength(2);
      expect(filtered[0].id).toBe('tx-2'); // Sorted descending by occurredAt
      expect(filtered[1].id).toBe('tx-1');
      expect(filtered.some((tx) => tx.direction === 'inflow')).toBe(false);
    });

    it('returns empty array when no outflows occurred on that day', () => {
      const filtered = filterTransactionsByDate(transactions, '2026-09-15');
      expect(filtered).toHaveLength(0);
    });
  });
});
