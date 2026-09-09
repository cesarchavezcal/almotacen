import { BudgetState, Account, Category, Transaction } from '../domain/ledger/types';

export interface DatabaseAdapter {
  execSync(sql: string): void;
  runSync(sql: string, ...params: any[]): { lastInsertRowId: number; changes: number };
  getAllSync<T = any>(sql: string, ...params: any[]): T[];
  getFirstSync<T = any>(sql: string, ...params: any[]): T | null;
  withTransactionSync<T>(task: () => T): T;
  closeSync?(): void;
}

export interface CategoryGroup {
  id: string;
  name: string;
  sortOrder: number;
}

export interface LedgerRepository {
  getBudgetState(): BudgetState;
  getCategoryGroups(): CategoryGroup[];
  postOutflow(params: {
    id: string;
    accountId: string;
    categoryId: string;
    amountCents: number;
    payee: string;
    occurredAt?: string;
  }): { transaction: Transaction; isOverspent: boolean };
  postInflow(params: {
    id: string;
    accountId: string;
    amountCents: number;
    payee: string;
    occurredAt?: string;
  }): { transaction: Transaction };
  allocateEnvelope(params: {
    categoryId: string;
    amountCents: number;
  }): { isOverAssigned: boolean };
  postCreditCardPayment(params: {
    id: string;
    fromAccountId: string;
    toAccountId: string;
    amountCents: number;
    payee?: string;
    occurredAt?: string;
  }): { transaction: Transaction };
  resetDatabase(): void;
}
