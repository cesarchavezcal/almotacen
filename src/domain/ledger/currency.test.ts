import { describe, it, expect } from '@jest/globals';
import {
  parseCurrencyToCents,
  formatCentsToCurrency,
  formatSignedCents,
  calculateDailyCashRewardCents,
} from './currency';

describe('currency domain utilities', () => {
  it('parses valid currency strings to integer cents', () => {
    expect(parseCurrencyToCents('42.50')).toBe(4250);
    expect(parseCurrencyToCents('$42.50')).toBe(4250);
    expect(parseCurrencyToCents('100')).toBe(10000);
    expect(parseCurrencyToCents('0.99')).toBe(99);
    expect(parseCurrencyToCents('0.00')).toBe(0);
    expect(parseCurrencyToCents('0')).toBe(0);
  });

  it('rejects empty, negative, or invalid non-numeric inputs', () => {
    expect(parseCurrencyToCents('')).toBe(0);
    expect(parseCurrencyToCents('-15.00')).toBe(0);
    expect(parseCurrencyToCents('abc')).toBe(0);
    expect(parseCurrencyToCents('$$$')).toBe(0);
  });

  it('formats integer cents into standard USD representation', () => {
    expect(formatCentsToCurrency(4250)).toBe('$42.50');
    expect(formatCentsToCurrency(0)).toBe('$0.00');
    expect(formatCentsToCurrency(99)).toBe('$0.99');
  });

  it('formats signed integer cents with leading plus or minus signs', () => {
    expect(formatSignedCents(142550)).toBe('+$1,425.50');
    expect(formatSignedCents(-342450)).toBe('-$3,424.50');
    expect(formatSignedCents(0)).toBe('$0.00');
  });

  it('calculates Daily Cash rewards in integer cents using basis points', () => {
    // $100.00 @ 2% (200 bps) = $2.00 (200 cents)
    expect(calculateDailyCashRewardCents(10000, 200)).toBe(200);
    // $84.20 @ 2% = 8420 * 200 / 10000 = 168.4 -> 168 cents ($1.68)
    expect(calculateDailyCashRewardCents(8420, 200)).toBe(168);
    // Negative or 0 cents
    expect(calculateDailyCashRewardCents(0, 200)).toBe(0);
    expect(calculateDailyCashRewardCents(-5000, 200)).toBe(0);
  });
});
