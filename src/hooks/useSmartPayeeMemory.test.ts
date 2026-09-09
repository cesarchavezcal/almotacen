import { describe, it, expect } from '@jest/globals';
import { findPayeeSuggestion, getDistinctRecentPayees } from './useSmartPayeeMemory';
import { parseCurrencyToCents } from '../domain/ledger/currency';
import { Transaction } from '../domain/ledger/types';

describe('Smart Payee Memory & Quick Currency Parser (SCEN-012 & SCEN-013)', () => {
  const mockTransactions: Transaction[] = [
    {
      id: 'tx-1',
      accountId: 'acc-credit',
      categoryId: 'cat-dining',
      payee: 'Blue Bottle Coffee',
      amountCents: 650,
      direction: 'outflow',
      occurredAt: '2026-09-09T12:00:00Z',
      syncStatus: 'synced',
    },
    {
      id: 'tx-2',
      accountId: 'acc-checking',
      categoryId: 'cat-groceries',
      payee: 'Whole Foods',
      amountCents: 8500,
      direction: 'outflow',
      occurredAt: '2026-09-08T15:30:00Z',
      syncStatus: 'synced',
    },
    {
      id: 'tx-3',
      accountId: 'acc-checking',
      categoryId: 'cat-dining',
      payee: 'Blue Bottle Coffee', // older transaction with different account
      amountCents: 500,
      direction: 'outflow',
      occurredAt: '2026-09-01T09:00:00Z',
      syncStatus: 'synced',
    },
  ];

  it('SCEN-012: returns the most recent category and account for an existing payee', () => {
    const suggestion = findPayeeSuggestion(mockTransactions, 'Blue Bottle Coffee');
    expect(suggestion).not.toBeNull();
    // Must return the most recent transaction's category and account (acc-credit, cat-dining)
    expect(suggestion?.accountId).toBe('acc-credit');
    expect(suggestion?.categoryId).toBe('cat-dining');
  });

  it('SCEN-012: handles case-insensitive payee matching', () => {
    const suggestion = findPayeeSuggestion(mockTransactions, 'whole foods');
    expect(suggestion).not.toBeNull();
    expect(suggestion?.accountId).toBe('acc-checking');
    expect(suggestion?.categoryId).toBe('cat-groceries');
  });

  it('SCEN-012: returns null for unknown payees or empty input', () => {
    expect(findPayeeSuggestion(mockTransactions, 'Unknown Store')).toBeNull();
    expect(findPayeeSuggestion(mockTransactions, '   ')).toBeNull();
  });

  it('extracts distinct recent payees in chronological order', () => {
    const payees = getDistinctRecentPayees(mockTransactions);
    expect(payees).toEqual(['Blue Bottle Coffee', 'Whole Foods']);
  });

  it('SCEN-013: accurately parses currency strings into integer cents', () => {
    expect(parseCurrencyToCents('42.50')).toBe(4250);
    expect(parseCurrencyToCents('$42.50')).toBe(4250);
    expect(parseCurrencyToCents('100')).toBe(10000);
    expect(parseCurrencyToCents('0.99')).toBe(99);
    expect(parseCurrencyToCents('0.00')).toBe(0);
    expect(parseCurrencyToCents('0')).toBe(0);
    expect(parseCurrencyToCents('')).toBe(0);
    expect(parseCurrencyToCents('-15.00')).toBe(0);
    expect(parseCurrencyToCents('abc')).toBe(0);
  });
});
