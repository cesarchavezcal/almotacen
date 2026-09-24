import { Account } from './types';

export interface NetWorthTotals {
  liquidCents: number;
  debtCents: number;
  netWorthCents: number;
}

/**
 * Pure domain calculation of liquid assets, total debt liabilities, and net worth in integer cents.
 */
export function calculateNetWorthTotals(
  accounts: Account[] | Record<string, Account>
): NetWorthTotals {
  const accountList = Array.isArray(accounts) ? accounts : Object.values(accounts);
  let liquid = 0;
  let debt = 0;

  for (const acc of accountList) {
    if (acc.accountType === 'credit') {
      debt += Math.abs(acc.balanceCents);
    } else {
      liquid += acc.balanceCents;
    }
  }

  return {
    liquidCents: liquid,
    debtCents: debt,
    netWorthCents: liquid - debt,
  };
}
