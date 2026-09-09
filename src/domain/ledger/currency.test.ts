import { describe, it, expect } from '@jest/globals';
import { parseCurrencyToCents, formatCentsToCurrency } from './currency';

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
});
