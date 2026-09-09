import { BudgetState, Transaction, Account, Category } from './types';
import { ValidationError, LedgerError } from './errors';

export interface PostOutflowParams {
  state: BudgetState;
  id: string;
  accountId: string;
  categoryId: string;
  amountCents: number;
  payee: string;
  occurredAt?: string;
}

export interface PostOutflowResult {
  state: BudgetState;
  transaction: Transaction;
  isOverspent: boolean;
}

export interface PostInflowParams {
  state: BudgetState;
  id: string;
  accountId: string;
  amountCents: number;
  payee: string;
  occurredAt?: string;
}

export interface PostInflowResult {
  state: BudgetState;
  transaction: Transaction;
}

export interface AllocateEnvelopeParams {
  state: BudgetState;
  categoryId: string;
  amountCents: number;
}

export interface AllocateEnvelopeResult {
  state: BudgetState;
  isOverAssigned: boolean;
}

export function postOutflowTransaction(params: PostOutflowParams): PostOutflowResult {
  const { state, id, accountId, categoryId, amountCents, payee, occurredAt = new Date().toISOString() } = params;

  if (amountCents <= 0) {
    throw new ValidationError('Amount must be greater than zero');
  }

  const account = state.accounts[accountId];
  if (!account) {
    throw new LedgerError(`Account ${accountId} not found`);
  }

  const category = state.categories[categoryId];
  if (!category) {
    throw new LedgerError(`Category ${categoryId} not found`);
  }

  const newAccountBalance = account.balanceCents - amountCents;
  const newCategoryAvailable = category.availableCents - amountCents;
  const isOverspent = newCategoryAvailable < 0;

  const transaction: Transaction = {
    id,
    accountId,
    categoryId,
    payee,
    amountCents,
    direction: 'outflow',
    occurredAt,
    syncStatus: 'pending',
  };

  const updatedAccounts: Record<string, Account> = {
    ...state.accounts,
    [accountId]: {
      ...account,
      balanceCents: newAccountBalance,
    },
  };

  const updatedCategories: Record<string, Category> = {
    ...state.categories,
    [categoryId]: {
      ...category,
      availableCents: newCategoryAvailable,
    },
  };

  const nextState: BudgetState = {
    ...state,
    accounts: updatedAccounts,
    categories: updatedCategories,
    transactions: [transaction, ...state.transactions],
    totalOutflowCents: state.totalOutflowCents + amountCents,
  };

  return {
    state: nextState,
    transaction,
    isOverspent,
  };
}

export function postInflowTransaction(params: PostInflowParams): PostInflowResult {
  const { state, id, accountId, amountCents, payee, occurredAt = new Date().toISOString() } = params;

  if (amountCents <= 0) {
    throw new ValidationError('Amount must be greater than zero');
  }

  const account = state.accounts[accountId];
  if (!account) {
    throw new LedgerError(`Account ${accountId} not found`);
  }

  const newAccountBalance = account.balanceCents + amountCents;
  const newReadyToAssign = state.readyToAssignCents + amountCents;

  const transaction: Transaction = {
    id,
    accountId,
    payee,
    amountCents,
    direction: 'inflow',
    occurredAt,
    syncStatus: 'pending',
  };

  const updatedAccounts: Record<string, Account> = {
    ...state.accounts,
    [accountId]: {
      ...account,
      balanceCents: newAccountBalance,
    },
  };

  const nextState: BudgetState = {
    ...state,
    accounts: updatedAccounts,
    readyToAssignCents: newReadyToAssign,
    transactions: [transaction, ...state.transactions],
    totalInflowCents: state.totalInflowCents + amountCents,
  };

  return {
    state: nextState,
    transaction,
  };
}

export function allocateEnvelope(params: AllocateEnvelopeParams): AllocateEnvelopeResult {
  const { state, categoryId, amountCents } = params;

  const category = state.categories[categoryId];
  if (!category) {
    throw new LedgerError(`Category ${categoryId} not found`);
  }

  const newReadyToAssign = state.readyToAssignCents - amountCents;
  const isOverAssigned = newReadyToAssign < 0;

  const updatedCategory: Category = {
    ...category,
    assignedCents: category.assignedCents + amountCents,
    availableCents: category.availableCents + amountCents,
  };

  const nextState: BudgetState = {
    ...state,
    readyToAssignCents: newReadyToAssign,
    categories: {
      ...state.categories,
      [categoryId]: updatedCategory,
    },
  };

  return {
    state: nextState,
    isOverAssigned,
  };
}
