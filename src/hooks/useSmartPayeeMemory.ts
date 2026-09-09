import { useMemo, useCallback } from 'react';
import { Transaction } from '../domain/ledger/types';

export interface PayeeSuggestion {
  categoryId?: string;
  accountId?: string;
}

export function findPayeeSuggestion(
  transactions: Transaction[],
  payeeInput: string
): PayeeSuggestion | null {
  const normalized = payeeInput.trim().toLowerCase();
  if (!normalized) return null;

  for (const tx of transactions) {
    if (tx.payee && tx.payee.trim().toLowerCase() === normalized) {
      if (tx.categoryId || tx.accountId) {
        return {
          categoryId: tx.categoryId,
          accountId: tx.accountId,
        };
      }
    }
  }
  return null;
}

export function getDistinctRecentPayees(transactions: Transaction[], limit: number = 6): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const tx of transactions) {
    const p = tx.payee ? tx.payee.trim() : '';
    const lower = p.toLowerCase();
    if (p && !seen.has(lower)) {
      seen.add(lower);
      result.push(p);
      if (result.length >= limit) break;
    }
  }

  return result;
}

export interface UseSmartPayeeMemoryResult {
  recentPayees: string[];
  suggestForPayee: (payee: string) => PayeeSuggestion | null;
}

export function useSmartPayeeMemory(transactions: Transaction[]): UseSmartPayeeMemoryResult {
  const recentPayees = useMemo(() => {
    return getDistinctRecentPayees(transactions);
  }, [transactions]);

  const suggestForPayee = useCallback(
    (payee: string): PayeeSuggestion | null => {
      return findPayeeSuggestion(transactions, payee);
    },
    [transactions]
  );

  return {
    recentPayees,
    suggestForPayee,
  };
}
