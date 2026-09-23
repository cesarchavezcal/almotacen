import { describe, it, expect } from '@jest/globals';
import { calculateNetWorthTotals } from './accountViewHelpers';
import { Account } from './types';

describe('accountViewHelpers — calculateNetWorthTotals', () => {
  it('returns zeros when accounts list is empty', () => {
    const totals = calculateNetWorthTotals([]);
    expect(totals.liquidCents).toBe(0);
    expect(totals.debtCents).toBe(0);
    expect(totals.netWorthCents).toBe(0);
  });

  it('calculates liquid assets and net worth for depository accounts', () => {
    const accounts: Account[] = [
      { id: 'a1', name: 'Checking', accountType: 'checking', balanceCents: 50000 },
      { id: 'a2', name: 'Savings', accountType: 'savings', balanceCents: 150000 },
    ];
    const totals = calculateNetWorthTotals(accounts);
    expect(totals.liquidCents).toBe(200000);
    expect(totals.debtCents).toBe(0);
    expect(totals.netWorthCents).toBe(200000);
  });

  it('calculates debt liability and net worth for credit accounts', () => {
    const accounts: Account[] = [
      { id: 'c1', name: 'Credit Card', accountType: 'credit', balanceCents: -75000 },
    ];
    const totals = calculateNetWorthTotals(accounts);
    expect(totals.liquidCents).toBe(0);
    expect(totals.debtCents).toBe(75000);
    expect(totals.netWorthCents).toBe(-75000);
  });

  it('calculates combined net worth for mixed depository and credit accounts', () => {
    const accounts: Record<string, Account> = {
      chk: { id: 'chk', name: 'Checking', accountType: 'checking', balanceCents: 100000 },
      cc: { id: 'cc', name: 'Sapphire', accountType: 'credit', balanceCents: -25000 },
    };
    const totals = calculateNetWorthTotals(accounts);
    expect(totals.liquidCents).toBe(100000);
    expect(totals.debtCents).toBe(25000);
    expect(totals.netWorthCents).toBe(75000);
  });
});
