import { useSyncExternalStore, useCallback } from 'react';
import { getDatabase } from './database';
import { SQLiteLedgerRepository } from './ledgerRepository';
import { BudgetState } from '../domain/ledger/types';
import { CategoryGroup, LedgerRepository } from './types';

let repositoryInstance: LedgerRepository | null = null;
let currentBudgetState: BudgetState | null = null;
let currentGroups: CategoryGroup[] | null = null;
let currentSnapshot: { budgetState: BudgetState; groups: CategoryGroup[] } | null = null;
const listeners = new Set<() => void>();

function getRepository(): LedgerRepository {
  if (!repositoryInstance) {
    const db = getDatabase();
    repositoryInstance = new SQLiteLedgerRepository(db);
  }
  return repositoryInstance;
}

function notifyListeners(): void {
  const repo = getRepository();
  currentBudgetState = repo.getBudgetState();
  currentGroups = repo.getCategoryGroups();
  currentSnapshot = {
    budgetState: currentBudgetState,
    groups: currentGroups,
  };
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): { budgetState: BudgetState; groups: CategoryGroup[] } {
  if (!currentSnapshot) {
    const repo = getRepository();
    currentBudgetState = repo.getBudgetState();
    currentGroups = repo.getCategoryGroups();
    currentSnapshot = {
      budgetState: currentBudgetState,
      groups: currentGroups,
    };
  }
  return currentSnapshot;
}

export function useLedgerStore() {
  const store = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const repo = getRepository();

  const postOutflow = useCallback(
    (params: {
      id?: string;
      accountId: string;
      categoryId: string;
      amountCents: number;
      payee: string;
      occurredAt?: string;
    }) => {
      const id = params.id || `tx-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const result = repo.postOutflow({
        ...params,
        id,
      });
      notifyListeners();
      return result;
    },
    [repo]
  );

  const postInflow = useCallback(
    (params: {
      id?: string;
      accountId: string;
      amountCents: number;
      payee: string;
      occurredAt?: string;
    }) => {
      const id = params.id || `tx-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const result = repo.postInflow({
        ...params,
        id,
      });
      notifyListeners();
      return result;
    },
    [repo]
  );

  const allocate = useCallback(
    (params: { categoryId: string; amountCents: number }) => {
      const result = repo.allocateEnvelope(params);
      notifyListeners();
      return result;
    },
    [repo]
  );

  const payCreditCard = useCallback(
    (params: {
      id?: string;
      fromAccountId: string;
      toAccountId: string;
      amountCents: number;
      payee?: string;
      occurredAt?: string;
    }) => {
      const id = params.id || `tx-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const result = repo.postCreditCardPayment({
        ...params,
        id,
      });
      notifyListeners();
      return result;
    },
    [repo]
  );

  const reload = useCallback(() => {
    notifyListeners();
  }, []);

  const reset = useCallback(() => {
    repo.resetDatabase();
    notifyListeners();
  }, [repo]);

  return {
    state: store.budgetState,
    groups: store.groups,
    postOutflow,
    postInflow,
    allocateEnvelope: allocate,
    postCreditCardPayment: payCreditCard,
    reload,
    resetDatabase: reset,
  };
}

export function setCustomLedgerRepository(customRepo: LedgerRepository | null): void {
  repositoryInstance = customRepo;
  notifyListeners();
}
