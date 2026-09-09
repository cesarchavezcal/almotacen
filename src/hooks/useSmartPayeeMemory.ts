import { useMemo, useCallback } from 'react';
import { Transaction } from '../domain/ledger/types';

export interface PayeeSuggestion {
  categoryId?: string;
  accountId?: string;
}

export function parseCurrencyToCents(amountStr: string): number {
  if (!amountStr) return 0;
  const trimmed = amountStr.trim();
  if (trimmed.startsWith('-') || trimmed.includes('-')) return 0;
  const cleaned = trimmed.replace(/[^0-9.]/g, '');
  if (!cleaned) return 0;
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed) || parsed <= 0) return 0;
  return Math.round(parsed * 100);
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

export function useSmartPayeeMemory(transactions: Transaction[]) {
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
