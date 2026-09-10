import { Transaction, Category } from '../ledger/types';

export type BurnStatus = 'ON_TRACK' | 'PACING_HIGH' | 'EXCEEDS_INCOME';

export interface DailyTrajectoryPoint {
  day: number;
  dateStr: string;
  actualOutflowCents: number | null;
  projectedOutflowCents: number | null;
  linearBudgetPaceCents: number;
}

export interface CashflowMetrics {
  totalInflowCents: number;
  totalOutflowCents: number;
  netCashflowCents: number;
  totalBudgetPlannedCents: number;
  burnRatePercent: number;
  burnStatus: BurnStatus;
  linearPaceToDateCents: number;
  projectedEomSpendCents: number;
  incomeCeilingCents: number;
  isIncomeCeilingBreached: boolean;
  dailyPoints: DailyTrajectoryPoint[];
}

/**
 * Calculates net monthly cash flow: inflows minus outflows (SCEN-016).
 */
export function calculateNetCashflow(inflowCents: number, outflowCents: number): number {
  return inflowCents - outflowCents;
}

/**
 * Calculates burn rate percentage of planned monthly budget (SCEN-016).
 */
export function calculateBurnRatePercent(outflowCents: number, plannedBudgetCents: number): number {
  if (plannedBudgetCents <= 0) {
    return 0;
  }
  return Math.round((outflowCents / plannedBudgetCents) * 100);
}

/**
 * Calculates linear budget pace in cents for a given day in the month (SCEN-017).
 */
export function calculateLinearBudgetPace(
  plannedBudgetCents: number,
  currentDay: number,
  totalDaysInMonth: number
): number {
  if (totalDaysInMonth <= 0) return 0;
  const boundedDay = Math.min(Math.max(1, currentDay), totalDaysInMonth);
  return Math.round((plannedBudgetCents / totalDaysInMonth) * boundedDay);
}

/**
 * Calculates blended EOM velocity projection combining discretionary velocity
 * with remaining committed fixed expenses (SCEN-018).
 */
export function calculateBlendedEomProjection(params: {
  actualDiscretionarySpendCents: number;
  committedFixedCents: number;
  currentDay: number;
  totalDaysInMonth: number;
}): number {
  const { actualDiscretionarySpendCents, committedFixedCents, currentDay, totalDaysInMonth } =
    params;
  const safeDay = Math.max(1, currentDay);
  const remainingDays = Math.max(0, totalDaysInMonth - safeDay);

  const dailyDiscretionaryVelocity = Math.round(actualDiscretionarySpendCents / safeDay);
  const projectedDiscretionaryCents = dailyDiscretionaryVelocity * remainingDays;

  return actualDiscretionarySpendCents + projectedDiscretionaryCents + committedFixedCents;
}

/**
 * Evaluates whether projected spending breaches the income ceiling or budget pace (SCEN-019).
 */
export function evaluateIncomeCeilingStatus(
  projectedEomSpendCents: number,
  incomeCeilingCents: number,
  plannedBudgetCents: number
): BurnStatus {
  if (incomeCeilingCents > 0 && projectedEomSpendCents > incomeCeilingCents) {
    return 'EXCEEDS_INCOME';
  }
  if (projectedEomSpendCents > plannedBudgetCents) {
    return 'PACING_HIGH';
  }
  return 'ON_TRACK';
}

/**
 * Builds continuous daily series (Day 1..M) of actual outflows, linear pace,
 * and projected EOM forecast points (SCEN-016..SCEN-019).
 */
export function buildDailyTrajectorySeries(params: {
  transactions: Transaction[];
  categories: Record<string, Category>;
  currentDay: number;
  totalDaysInMonth: number;
  year: number;
  month: number;
  incomeCeilingCents?: number;
}): CashflowMetrics {
  const { transactions, categories, currentDay, totalDaysInMonth, year, month } = params;

  // 1. Calculate planned budget across categories (excluding credit payment envelopes)
  let totalBudgetPlannedCents = 0;
  let committedFixedCents = 0;

  for (const cat of Object.values(categories)) {
    if (cat.isCreditPayment) continue;
    const catBudget = cat.assignedCents > 0 ? cat.assignedCents : cat.targetCents;
    totalBudgetPlannedCents += catBudget;

    // Categorize fixed vs flexible obligations based on groupId
    if (cat.groupId === 'fixed' || cat.groupId === 'obligations') {
      committedFixedCents += catBudget;
    }
  }

  // 2. Bucket transactions by day and calculate totals
  const dailySpendMap = new Map<number, number>();
  let totalInflowCents = 0;
  let totalOutflowCents = 0;
  let actualDiscretionarySpendCents = 0;

  for (const tx of transactions) {
    if (tx.direction === 'inflow') {
      totalInflowCents += tx.amountCents;
      continue;
    }

    if (tx.direction === 'outflow') {
      totalOutflowCents += tx.amountCents;

      // Extract day from ISO string or Date
      const txDate = new Date(tx.occurredAt);
      const txDay = txDate.getDate();

      const existing = dailySpendMap.get(txDay) || 0;
      dailySpendMap.set(txDay, existing + tx.amountCents);

      // Check category type
      const cat = tx.categoryId ? categories[tx.categoryId] : undefined;
      if (!cat || (cat.groupId !== 'fixed' && cat.groupId !== 'obligations')) {
        actualDiscretionarySpendCents += tx.amountCents;
      }
    }
  }

  // 3. Inflow benchmark / Income Ceiling
  const effectiveIncomeCeiling =
    params.incomeCeilingCents !== undefined && params.incomeCeilingCents > 0
      ? params.incomeCeilingCents
      : totalInflowCents > 0
        ? totalInflowCents
        : totalBudgetPlannedCents;

  // 4. Net Cash Flow & Burn Pace
  const netCashflowCents = calculateNetCashflow(totalInflowCents, totalOutflowCents);
  const burnRatePercent = calculateBurnRatePercent(totalOutflowCents, totalBudgetPlannedCents);
  const linearPaceToDateCents = calculateLinearBudgetPace(
    totalBudgetPlannedCents,
    currentDay,
    totalDaysInMonth
  );

  // 5. Blended EOM Projection
  const projectedEomSpendCents = calculateBlendedEomProjection({
    actualDiscretionarySpendCents:
      actualDiscretionarySpendCents > 0 ? actualDiscretionarySpendCents : totalOutflowCents,
    committedFixedCents,
    currentDay,
    totalDaysInMonth,
  });

  const burnStatus = evaluateIncomeCeilingStatus(
    projectedEomSpendCents,
    effectiveIncomeCeiling,
    totalBudgetPlannedCents
  );
  const isIncomeCeilingBreached = burnStatus === 'EXCEEDS_INCOME';

  // 6. Generate day-by-day continuous series
  const dailyPoints: DailyTrajectoryPoint[] = [];
  let cumulativeActualCents = 0;

  for (let day = 1; day <= totalDaysInMonth; day++) {
    const dayPadded = day.toString().padStart(2, '0');
    const monthPadded = month.toString().padStart(2, '0');
    const dateStr = `${year}-${monthPadded}-${dayPadded}`;
    const linearBudgetPaceCents = calculateLinearBudgetPace(
      totalBudgetPlannedCents,
      day,
      totalDaysInMonth
    );

    const daySpend = dailySpendMap.get(day) || 0;

    if (day <= currentDay) {
      cumulativeActualCents += daySpend;
      dailyPoints.push({
        day,
        dateStr,
        actualOutflowCents: cumulativeActualCents,
        projectedOutflowCents: null,
        linearBudgetPaceCents,
      });
    } else {
      // Future day projection curve interpolating from cumulativeActual to projectedEomSpendCents
      const remainingDays = totalDaysInMonth - currentDay;
      const daysIntoFuture = day - currentDay;
      const forecastDelta = Math.max(0, projectedEomSpendCents - cumulativeActualCents);
      const projectedStep = Math.round(
        cumulativeActualCents + (forecastDelta / remainingDays) * daysIntoFuture
      );

      dailyPoints.push({
        day,
        dateStr,
        actualOutflowCents: null,
        projectedOutflowCents: projectedStep,
        linearBudgetPaceCents,
      });
    }
  }

  return {
    totalInflowCents,
    totalOutflowCents,
    netCashflowCents,
    totalBudgetPlannedCents,
    burnRatePercent,
    burnStatus,
    linearPaceToDateCents,
    projectedEomSpendCents,
    incomeCeilingCents: effectiveIncomeCeiling,
    isIncomeCeilingBreached,
    dailyPoints,
  };
}
