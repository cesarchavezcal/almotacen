import { describe, it, expect } from '@jest/globals';
import { getMonthNavigationState, shiftMonth } from './useCashflow';

describe('Month Navigation State & Paging (SCEN-024 & SCEN-025)', () => {
  // Reference date: September 10, 2026
  const referenceDate = new Date(2026, 8, 10); // month 8 is September (0-indexed)

  it('SCEN-024: correctly identifies the active current month and current day', () => {
    const activeDate = new Date(2026, 8, 10);
    const nav = getMonthNavigationState(activeDate, referenceDate);

    expect(nav.isCurrentMonth).toBe(true);
    expect(nav.isPastMonth).toBe(false);
    expect(nav.isFutureMonth).toBe(false);
    expect(nav.year).toBe(2026);
    expect(nav.month).toBe(9);
    expect(nav.cycleTitle).toBe('September 2026');
    expect(nav.monthLabel).toBe('September Cash Flow');
    expect(nav.totalDaysInMonth).toBe(30);
    expect(nav.effectiveCurrentDay).toBe(10);
  });

  it('SCEN-025: sets effectiveCurrentDay to totalDaysInMonth when navigating to a past month', () => {
    // August 2026 has 31 days
    const pastDate = new Date(2026, 7, 1); // August
    const nav = getMonthNavigationState(pastDate, referenceDate);

    expect(nav.isCurrentMonth).toBe(false);
    expect(nav.isPastMonth).toBe(true);
    expect(nav.isFutureMonth).toBe(false);
    expect(nav.year).toBe(2026);
    expect(nav.month).toBe(8);
    expect(nav.cycleTitle).toBe('August 2026');
    expect(nav.totalDaysInMonth).toBe(31);
    // When past month, effective current day is the full month (31)
    expect(nav.effectiveCurrentDay).toBe(31);
  });

  it('sets effectiveCurrentDay to 0 when navigating to a future month', () => {
    const futureDate = new Date(2026, 9, 1); // October
    const nav = getMonthNavigationState(futureDate, referenceDate);

    expect(nav.isCurrentMonth).toBe(false);
    expect(nav.isPastMonth).toBe(false);
    expect(nav.isFutureMonth).toBe(true);
    expect(nav.year).toBe(2026);
    expect(nav.month).toBe(10);
    expect(nav.cycleTitle).toBe('October 2026');
    expect(nav.effectiveCurrentDay).toBe(0);
  });

  it('SCEN-024: shifts months forward and backward cleanly across year boundaries', () => {
    const dateJan2027 = new Date(2027, 0, 15);
    const dateDec2026 = shiftMonth(dateJan2027, -1);
    expect(dateDec2026.getFullYear()).toBe(2026);
    expect(dateDec2026.getMonth()).toBe(11); // December

    const dateFeb2027 = shiftMonth(dateJan2027, 1);
    expect(dateFeb2027.getFullYear()).toBe(2027);
    expect(dateFeb2027.getMonth()).toBe(1); // February
  });
});
