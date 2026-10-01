import { useSyncExternalStore, useCallback } from 'react';
import { Platform } from 'react-native';
import { Session, SupabaseClient, AuthChangeEvent } from '@supabase/supabase-js';
import { getDatabase } from './database';
import { SQLiteLedgerRepository } from './ledgerRepository';
import { getSupabaseClient } from './supabase/client';
import { SupabaseLedgerRepository } from './supabase/supabaseLedgerRepository';
import { BudgetState, Transaction, Account, Category } from '../domain/ledger/types';
import {
  CategoryGroup,
  LedgerRepository,
  DiagnosticsData,
  CreateAccountInput,
  UpdateAccountInput,
  CreateCategoryGroupInput,
  UpdateCategoryGroupInput,
  CreateCategoryInput,
  UpdateCategoryInput,
} from './types';
import { MonthRolloverResult } from '../domain/ledger/rollover';

let repositoryInstance: LedgerRepository | null = null;
let currentUserId: string | null = null;
let currentBudgetState: BudgetState | null = null;
let currentGroups: CategoryGroup[] | null = null;
let currentSnapshot: { budgetState: BudgetState; groups: CategoryGroup[] } | null = null;
const listeners = new Set<() => void>();

export interface UseLedgerStoreResult {
  state: BudgetState;
  groups: CategoryGroup[];
  postOutflow: (params: {
    id?: string;
    accountId: string;
    categoryId: string;
    amountCents: number;
    payee: string;
    occurredAt?: string;
  }) => { transaction: Transaction; isOverspent: boolean };
  postInflow: (params: {
    id?: string;
    accountId: string;
    amountCents: number;
    payee: string;
    occurredAt?: string;
  }) => { transaction: Transaction };
  allocateEnvelope: (params: { categoryId: string; amountCents: number }) => { isOverAssigned: boolean };
  postCreditCardPayment: (params: {
    id?: string;
    fromAccountId: string;
    toAccountId: string;
    amountCents: number;
    payee?: string;
    occurredAt?: string;
  }) => { transaction: Transaction };
  performMonthRollover: (targetMonth?: string) => MonthRolloverResult;
  applyAutoAssign: () => { totalAllocatedCents: number; assignedCount: number };
  rebalanceCategoryFunds: (params: {
    targetCategoryId: string;
    sourceCategoryId: string;
    amountCents: number;
  }) => { coveredCents: number; isCreditDebtCovered: boolean };
  reload: () => void;
  resetDatabase: () => void;
  factoryReset: () => void;
  clearTransactionsOnly: () => void;
  seedDemoData: () => void;
  getDiagnostics: () => DiagnosticsData;
  createAccount: (input: CreateAccountInput) => Account;
  updateAccount: (input: UpdateAccountInput) => Account;
  deleteAccount: (id: string) => void;
  createCategoryGroup: (input: CreateCategoryGroupInput) => CategoryGroup;
  updateCategoryGroup: (input: UpdateCategoryGroupInput) => CategoryGroup;
  deleteCategoryGroup: (id: string) => void;
  createCategory: (input: CreateCategoryInput) => Category;
  updateCategory: (input: UpdateCategoryInput) => Category;
  deleteCategory: (id: string) => void;
}

export function getRepository(): LedgerRepository {
  if (!repositoryInstance) {
    if (Platform.OS === 'web') {
      const client = getSupabaseClient();
      const repo = new SupabaseLedgerRepository(client);
      repo.subscribe(() => {
        notifyListeners();
      });
      repositoryInstance = repo;
    } else {
      const db = getDatabase();
      repositoryInstance = new SQLiteLedgerRepository(db);
    }
  }
  return repositoryInstance;
}

export function getCurrentUserId(): string | null {
  return currentUserId;
}

export function resetRepositoryInstanceForTesting(): void {
  if (repositoryInstance && typeof repositoryInstance.dispose === 'function') {
    try {
      repositoryInstance.dispose();
    } catch (err) {
      console.warn('Error disposing repository during reset:', err);
    }
  }
  repositoryInstance = null;
  currentBudgetState = null;
  currentGroups = null;
  currentSnapshot = null;
  currentUserId = null;
}

export function notifyListeners(): void {
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

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot(): { budgetState: BudgetState; groups: CategoryGroup[] } {
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

export async function handleAuthStateChange(
  event: AuthChangeEvent,
  session: Session | null,
  customClient?: SupabaseClient
): Promise<void> {
  const newUserId = session?.user?.id ?? null;

  if (newUserId) {
    if (newUserId === currentUserId) {
      // Same user ID (account claiming via updateUser, token refreshed): zero data loss, retain in-memory state
      return;
    }

    // Identity switch (User A -> User B)
    if (repositoryInstance && typeof repositoryInstance.dispose === 'function') {
      try {
        repositoryInstance.dispose();
      } catch (err) {
        console.warn('Error disposing repository on auth switch:', err);
      }
    }
    repositoryInstance = null;
    currentUserId = newUserId;

    if (Platform.OS === 'web') {
      const client = customClient ?? getSupabaseClient();
      const repo = new SupabaseLedgerRepository(client);
      repo.subscribe(() => {
        notifyListeners();
      });
      if (typeof repo.initializeAsync === 'function') {
        await repo.initializeAsync();
      }
      repositoryInstance = repo;
      currentBudgetState = repo.getBudgetState();
      currentGroups = repo.getCategoryGroups();
      currentSnapshot = {
        budgetState: currentBudgetState,
        groups: currentGroups,
      };
      notifyListeners();
    }
  } else if (event === 'SIGNED_OUT' || !session) {
    // User signed out
    if (repositoryInstance && typeof repositoryInstance.dispose === 'function') {
      try {
        repositoryInstance.dispose();
      } catch (err) {
        console.warn('Error disposing repository on sign out:', err);
      }
    }
    repositoryInstance = null;
    currentUserId = null;
    currentBudgetState = {
      readyToAssignCents: 0,
      accounts: {},
      categories: {},
      transactions: [],
      totalOutflowCents: 0,
      totalInflowCents: 0,
    };
    currentGroups = [];
    currentSnapshot = {
      budgetState: currentBudgetState,
      groups: currentGroups,
    };
    notifyListeners();
  }
}

export function useLedgerStore(): UseLedgerStoreResult {
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

  const performRollover = useCallback(
    (targetMonth?: string) => {
      const result = repo.performMonthRollover(targetMonth);
      notifyListeners();
      return result;
    },
    [repo]
  );

  const autoAssign = useCallback(() => {
    const result = repo.applyAutoAssign();
    notifyListeners();
    return result;
  }, [repo]);

  const rebalance = useCallback(
    (params: { targetCategoryId: string; sourceCategoryId: string; amountCents: number }) => {
      const result = repo.rebalanceCategoryFunds(params);
      notifyListeners();
      return result;
    },
    [repo]
  );

  const reset = useCallback(() => {
    repo.resetDatabase();
    notifyListeners();
  }, [repo]);

  const handleFactoryReset = useCallback(() => {
    repo.factoryReset();
    notifyListeners();
  }, [repo]);

  const handleClearTransactionsOnly = useCallback(() => {
    repo.clearTransactionsOnly();
    notifyListeners();
  }, [repo]);

  const handleSeedDemoData = useCallback(() => {
    repo.seedDemoData();
    notifyListeners();
  }, [repo]);
  const getDiagnostics = useCallback(() => {
    return repo.getDiagnostics();
  }, [repo]);

  const createAccount = useCallback(
    (input: CreateAccountInput) => {
      const result = repo.createAccount(input);
      notifyListeners();
      return result;
    },
    [repo]
  );

  const updateAccount = useCallback(
    (input: UpdateAccountInput) => {
      const result = repo.updateAccount(input);
      notifyListeners();
      return result;
    },
    [repo]
  );

  const deleteAccount = useCallback(
    (id: string) => {
      repo.deleteAccount(id);
      notifyListeners();
    },
    [repo]
  );

  const createCategoryGroup = useCallback(
    (input: CreateCategoryGroupInput) => {
      const result = repo.createCategoryGroup(input);
      notifyListeners();
      return result;
    },
    [repo]
  );

  const updateCategoryGroup = useCallback(
    (input: UpdateCategoryGroupInput) => {
      const result = repo.updateCategoryGroup(input);
      notifyListeners();
      return result;
    },
    [repo]
  );

  const deleteCategoryGroup = useCallback(
    (id: string) => {
      repo.deleteCategoryGroup(id);
      notifyListeners();
    },
    [repo]
  );

  const createCategory = useCallback(
    (input: CreateCategoryInput) => {
      const result = repo.createCategory(input);
      notifyListeners();
      return result;
    },
    [repo]
  );

  const updateCategory = useCallback(
    (input: UpdateCategoryInput) => {
      const result = repo.updateCategory(input);
      notifyListeners();
      return result;
    },
    [repo]
  );

  const deleteCategory = useCallback(
    (id: string) => {
      repo.deleteCategory(id);
      notifyListeners();
    },
    [repo]
  );

  return {
    state: store.budgetState,
    groups: store.groups,
    postOutflow,
    postInflow,
    allocateEnvelope: allocate,
    postCreditCardPayment: payCreditCard,
    performMonthRollover: performRollover,
    applyAutoAssign: autoAssign,
    rebalanceCategoryFunds: rebalance,
    reload,
    resetDatabase: reset,
    factoryReset: handleFactoryReset,
    clearTransactionsOnly: handleClearTransactionsOnly,
    seedDemoData: handleSeedDemoData,
    getDiagnostics,
    createAccount,
    updateAccount,
    deleteAccount,
    createCategoryGroup,
    updateCategoryGroup,
    deleteCategoryGroup,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}

export function setCustomLedgerRepository(customRepo: LedgerRepository | null): void {
  repositoryInstance = customRepo;
  notifyListeners();
}
