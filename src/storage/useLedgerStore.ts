import { useSyncExternalStore, useMemo } from 'react';
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
  LedgerTransactionsPort,
  EntityCatalogPort,
  LedgerAdminPort,
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

function disposeCurrentRepository(): void {
  if (repositoryInstance && typeof repositoryInstance.dispose === 'function') {
    try {
      repositoryInstance.dispose();
    } catch (err) {
      console.warn('Error disposing repository:', err);
    }
  }
  repositoryInstance = null;
}

export function resetRepositoryInstanceForTesting(): void {
  disposeCurrentRepository();
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

    // Identity switch (User A -> User B): immediately dispose prior repo and flush memory to prevent stale reads
    disposeCurrentRepository();
    currentUserId = newUserId;
    currentBudgetState = null;
    currentGroups = null;
    currentSnapshot = null;

    if (Platform.OS === 'web') {
      const client = customClient ?? getSupabaseClient();
      const repo = new SupabaseLedgerRepository(client);
      repo.subscribe(() => {
        notifyListeners();
      });
      repositoryInstance = repo;
      if (typeof repo.initializeAsync === 'function') {
        await repo.initializeAsync();
      }
      notifyListeners();
    }
  } else if (event === 'SIGNED_OUT' || !session) {
    // User signed out
    disposeCurrentRepository();
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

function createStoreActions(repo: LedgerRepository): Omit<UseLedgerStoreResult, 'state' | 'groups'> {
  return {
    postOutflow: (params) => {
      const id = params.id || `tx-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const result = repo.postOutflow({ ...params, id });
      notifyListeners();
      return result;
    },
    postInflow: (params) => {
      const id = params.id || `tx-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const result = repo.postInflow({ ...params, id });
      notifyListeners();
      return result;
    },
    allocateEnvelope: (params) => {
      const result = repo.allocateEnvelope(params);
      notifyListeners();
      return result;
    },
    postCreditCardPayment: (params) => {
      const id = params.id || `tx-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const result = repo.postCreditCardPayment({ ...params, id });
      notifyListeners();
      return result;
    },
    performMonthRollover: (targetMonth) => {
      const result = repo.performMonthRollover(targetMonth);
      notifyListeners();
      return result;
    },
    applyAutoAssign: () => {
      const result = repo.applyAutoAssign();
      notifyListeners();
      return result;
    },
    rebalanceCategoryFunds: (params) => {
      const result = repo.rebalanceCategoryFunds(params);
      notifyListeners();
      return result;
    },
    reload: () => {
      notifyListeners();
    },
    resetDatabase: () => {
      repo.resetDatabase();
      notifyListeners();
    },
    factoryReset: () => {
      repo.factoryReset();
      notifyListeners();
    },
    clearTransactionsOnly: () => {
      repo.clearTransactionsOnly();
      notifyListeners();
    },
    seedDemoData: () => {
      repo.seedDemoData();
      notifyListeners();
    },
    getDiagnostics: () => repo.getDiagnostics(),
    createAccount: (input) => {
      const result = repo.createAccount(input);
      notifyListeners();
      return result;
    },
    updateAccount: (input) => {
      const result = repo.updateAccount(input);
      notifyListeners();
      return result;
    },
    deleteAccount: (id) => {
      repo.deleteAccount(id);
      notifyListeners();
    },
    createCategoryGroup: (input) => {
      const result = repo.createCategoryGroup(input);
      notifyListeners();
      return result;
    },
    updateCategoryGroup: (input) => {
      const result = repo.updateCategoryGroup(input);
      notifyListeners();
      return result;
    },
    deleteCategoryGroup: (id) => {
      repo.deleteCategoryGroup(id);
      notifyListeners();
    },
    createCategory: (input) => {
      const result = repo.createCategory(input);
      notifyListeners();
      return result;
    },
    updateCategory: (input) => {
      const result = repo.updateCategory(input);
      notifyListeners();
      return result;
    },
    deleteCategory: (id) => {
      repo.deleteCategory(id);
      notifyListeners();
    },
  };
}

export function useLedgerStore(): UseLedgerStoreResult {
  const store = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const repo = getRepository();
  const actions = useMemo(() => createStoreActions(repo), [repo]);

  return {
    state: store.budgetState,
    groups: store.groups,
    ...actions,
  };
}

export function useLedgerTransactions(): LedgerTransactionsPort {
  return getRepository();
}

export function useEntityCatalog(): EntityCatalogPort {
  return getRepository();
}

export function useLedgerAdmin(): LedgerAdminPort {
  return getRepository();
}

export function setCustomLedgerRepository(customRepo: LedgerRepository | null): void {
  repositoryInstance = customRepo;
  notifyListeners();
}
