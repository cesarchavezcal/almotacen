import { describe, it, expect } from '@jest/globals';
import {
  calculateNetCashflow,
  calculateBurnRatePercent,
  calculateLinearBudgetPace,
  calculateBlendedEomProjection,
  evaluateIncomeCeilingStatus,
  buildDailyTrajectorySeries,
} from './cashflowCalculations';
import { Transaction, Category } from '../ledger/types';

describe('Cash Flow Trajectory Calculations (SCEN-016..SCEN-019)', () => {
  describe('SCEN-016: Net Cash Flow & Titanium Hero Card Metrics', () => {
    it('computes net cash flow as inflows minus outflows with positive sign', () => {
      const inflowCents = 485000; // $4,850.00
      const outflowCents = 342450; // $3,424.50
      const net = calculateNetCashflow(inflowCents, outflowCents);
      expect(net).toBe(142550); // +$1,425.50
    });

    it('computes negative net cash flow when outflows exceed inflows', () => {
      const inflowCents = 200000; // $2,000.00
      const outflowCents = 250000; // $2,500.00
      const net = calculateNetCashflow(inflowCents, outflowCents);
      expect(net).toBe(-50000); // -$500.00
    });

    it('computes burn rate percentage of planned monthly budget', () => {
      const outflowCents = 342450; // $3,424.50
      const plannedBudgetCents = 400000; // $4,000.00
      const percent = calculateBurnRatePercent(outflowCents, plannedBudgetCents);
      // (342450 / 400000) * 100 = 85.6125 -> 86%
      expect(percent).toBe(86);
    });

    it('returns 0% burn rate when planned budget is 0 to avoid division by zero', () => {
      expect(calculateBurnRatePercent(10000, 0)).toBe(0);
    });
  });

  describe('SCEN-017: Cumulative Daily Spend & Linear Budget Pace Curve', () => {
    it('calculates exact linear budget pace for mid-month day', () => {
      const plannedBudgetCents = 300000; // $3,000.00
      const currentDay = 15;
      const totalDaysInMonth = 30;
      const pace = calculateLinearBudgetPace(plannedBudgetCents, currentDay, totalDaysInMonth);
      expect(pace).toBe(150000); // $1,500.00 exactly
    });

    it('calculates linear budget pace on Day 1 and last day', () => {
      const plannedBudgetCents = 310000; // $3,100.00 in 31-day month
      expect(calculateLinearBudgetPace(plannedBudgetCents, 1, 31)).toBe(10000); // $100.00
      expect(calculateLinearBudgetPace(plannedBudgetCents, 31, 31)).toBe(310000); // $3,100.00
    });

    it('handles leap year 29-day February and 28-day February cleanly', () => {
      const plannedBudgetCents = 280000;
      expect(calculateLinearBudgetPace(plannedBudgetCents, 14, 28)).toBe(140000);
      expect(calculateLinearBudgetPace(plannedBudgetCents, 28, 28)).toBe(280000);
    });
  });

  describe('SCEN-018: Blended EOM Velocity Forecasting', () => {
    it('projects EOM spend combining discretionary velocity and remaining fixed commitments', () => {
      // SCEN-018: Day 10 of 30, $600 spent discretionary ($60/day), $1,200 remaining fixed commitments
      const actualDiscretionarySpendCents = 60000; // $600.00
      const committedFixedCents = 120000; // $1,200.00
      const currentDay = 10;
      const totalDaysInMonth = 30;

      const projected = calculateBlendedEomProjection({
        actualDiscretionarySpendCents,
        committedFixedCents,
        currentDay,
        totalDaysInMonth,
      });

      // Daily velocity: 60000 / 10 = 6000 cents/day
      // Remaining 20 days: 6000 * 20 = 120000 cents
      // Total projected EOM: 60000 + 120000 + 120000 = 300000 cents ($3,000.00)
      expect(projected).toBe(300000);
    });

    it('handles day 1 gracefully using day 1 spend as the baseline daily rate', () => {
      const projected = calculateBlendedEomProjection({
        actualDiscretionarySpendCents: 5000, // $50.00 on day 1
        committedFixedCents: 100000, // $1,000.00 fixed
        currentDay: 1,
        totalDaysInMonth: 30,
      });
      // 5000 + (5000 * 29) + 100000 = 5000 + 145000 + 100000 = 250000 ($2,500.00)
      expect(projected).toBe(250000);
    });

    it('handles last day of the month where remaining days is zero', () => {
      const projected = calculateBlendedEomProjection({
        actualDiscretionarySpendCents: 150000,
        committedFixedCents: 120000,
        currentDay: 30,
        totalDaysInMonth: 30,
      });
      expect(projected).toBe(270000);
    });
  });

  describe('SCEN-019: Horizontal Income Ceiling Threshold Evaluation', () => {
    it('flags EXCEEDS_INCOME when projected EOM spend exceeds total monthly income', () => {
      const projectedEomSpendCents = 340000; // $3,400.00
      const incomeCeilingCents = 320000; // $3,200.00
      const plannedBudgetCents = 300000; // $3,000.00

      const status = evaluateIncomeCeilingStatus(
        projectedEomSpendCents,
        incomeCeilingCents,
        plannedBudgetCents
      );
      expect(status).toBe('EXCEEDS_INCOME');
    });

    it('flags PACING_HIGH when projected spend exceeds budget pace but stays within income ceiling', () => {
      const projectedEomSpendCents = 310000; // $3,100.00
      const incomeCeilingCents = 350000; // $3,500.00
      const plannedBudgetCents = 300000; // $3,000.00

      const status = evaluateIncomeCeilingStatus(
        projectedEomSpendCents,
        incomeCeilingCents,
        plannedBudgetCents
      );
      expect(status).toBe('PACING_HIGH');
    });

    it('evaluates as ON_TRACK when projected spend is at or below planned budget', () => {
      const projectedEomSpendCents = 290000; // $2,900.00
      const incomeCeilingCents = 350000; // $3,500.00
      const plannedBudgetCents = 300000; // $3,000.00

      const status = evaluateIncomeCeilingStatus(
        projectedEomSpendCents,
        incomeCeilingCents,
        plannedBudgetCents
      );
      expect(status).toBe('ON_TRACK');
    });
  });

  describe('buildDailyTrajectorySeries: Integrated Aggregator', () => {
    const mockCategories: Record<string, Category> = {
      rent: {
        id: 'rent',
        groupId: 'fixed',
        name: 'Rent',
        targetCents: 150000,
        assignedCents: 150000,
        availableCents: 0,
      },
      groceries: {
        id: 'groceries',
        groupId: 'flexible',
        name: 'Groceries',
        targetCents: 60000,
        assignedCents: 60000,
        availableCents: 45000,
      },
      dining: {
        id: 'dining',
        groupId: 'flexible',
        name: 'Dining',
        targetCents: 40000,
        assignedCents: 40000,
        availableCents: 30000,
      },
    };

    const mockTransactions: Transaction[] = [
      {
        id: 'tx-1',
        accountId: 'acc-chk',
        categoryId: 'groceries',
        payee: 'Supermarket',
        amountCents: 8000, // Day 2: $80
        direction: 'outflow',
        occurredAt: '2026-09-02T12:00:00.000Z',
        syncStatus: 'synced',
      },
      {
        id: 'tx-2',
        accountId: 'acc-chk',
        categoryId: 'dining',
        payee: 'Cafe',
        amountCents: 2000, // Day 5: $20
        direction: 'outflow',
        occurredAt: '2026-09-05T15:00:00.000Z',
        syncStatus: 'synced',
      },
      {
        id: 'tx-inc',
        accountId: 'acc-chk',
        payee: 'Employer',
        amountCents: 350000, // Income: $3,500.00
        direction: 'inflow',
        occurredAt: '2026-09-01T09:00:00.000Z',
        syncStatus: 'synced',
      },
    ];

    it('builds a continuous 30-day series with cumulative outflows up to current day and forecasts beyond', () => {
      const metrics = buildDailyTrajectorySeries({
        transactions: mockTransactions,
        categories: mockCategories,
        currentDay: 10,
        totalDaysInMonth: 30,
        year: 2026,
        month: 9,
        incomeCeilingCents: 350000,
      });

      expect(metrics.dailyPoints).toHaveLength(30);

      // Day 1: 0 spent
      expect(metrics.dailyPoints[0].actualOutflowCents).toBe(0);
      // Day 2: 8000 spent
      expect(metrics.dailyPoints[1].actualOutflowCents).toBe(8000);
      // Day 5: 8000 + 2000 = 10000 spent
      expect(metrics.dailyPoints[4].actualOutflowCents).toBe(10000);
      // Day 10 (currentDay): 10000 spent
      expect(metrics.dailyPoints[9].actualOutflowCents).toBe(10000);

      // Future days (Day 11 onwards): actualOutflowCents should be null, projectedOutflowCents populated
      expect(metrics.dailyPoints[10].actualOutflowCents).toBeNull();
      expect(metrics.dailyPoints[10].projectedOutflowCents).toBeGreaterThan(10000);
      expect(metrics.dailyPoints[29].projectedOutflowCents).toBe(metrics.projectedEomSpendCents);

      // Net cash flow
      expect(metrics.totalInflowCents).toBe(350000);
      expect(metrics.totalOutflowCents).toBe(10000);
      expect(metrics.netCashflowCents).toBe(340000);
      expect(metrics.burnStatus).toBe('ON_TRACK');
    });

    it('SCEN-025: displays completed historical actuals without future projections when viewing past month', () => {
      // Historical month: August (31 days), currentDay = 31 (closed)
      const augustTransactions: Transaction[] = [
        {
          id: 'tx-aug-1',
          accountId: 'acc-checking',
          categoryId: 'cat-groceries',
          payee: 'Trader Joe',
          amountCents: 15000,
          direction: 'outflow',
          occurredAt: '2026-08-05T12:00:00.000Z',
          syncStatus: 'synced',
        },
        {
          id: 'tx-aug-2',
          accountId: 'acc-checking',
          categoryId: 'cat-rent',
          payee: 'Apartments',
          amountCents: 120000,
          direction: 'outflow',
          occurredAt: '2026-08-01T08:00:00.000Z',
          syncStatus: 'synced',
        },
        {
          id: 'tx-aug-inflow',
          accountId: 'acc-checking',
          payee: 'Employer',
          amountCents: 200000,
          direction: 'inflow',
          occurredAt: '2026-08-01T09:00:00.000Z',
          syncStatus: 'synced',
        },
      ];

      const metrics = buildDailyTrajectorySeries({
        transactions: augustTransactions,
        categories: mockCategories,
        currentDay: 31,
        totalDaysInMonth: 31,
        year: 2026,
        month: 8,
        incomeCeilingCents: 200000,
      });

      expect(metrics.dailyPoints).toHaveLength(31);

      // All points from 1 to 31 must have actualOutflowCents and null projectedOutflowCents
      for (const pt of metrics.dailyPoints) {
        expect(pt.actualOutflowCents).not.toBeNull();
        expect(pt.projectedOutflowCents).toBeNull();
      }

      // Day 31 cumulative actual equals total outflow ($1,350.00)
      expect(metrics.dailyPoints[30].actualOutflowCents).toBe(135000);
      expect(metrics.totalOutflowCents).toBe(135000);
      expect(metrics.totalInflowCents).toBe(200000);
      expect(metrics.netCashflowCents).toBe(65000); // +$650.00
      expect(metrics.projectedEomSpendCents).toBe(135000);
    });
  });
});

