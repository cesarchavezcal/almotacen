import { BudgetState, Transaction, CategoryGroup } from '../domain/ledger/types';
import { MonthRolloverResult } from '../domain/ledger/rollover';

export interface DatabaseAdapter {
  execSync(sql: string): void;
  runSync(sql: string, ...params: unknown[]): { lastInsertRowId: number; changes: number };
  getAllSync<T = unknown>(sql: string, ...params: unknown[]): T[];
  getFirstSync<T = unknown>(sql: string, ...params: unknown[]): T | null;
  withTransactionSync<T>(task: () => T): T;
  closeSync?(): void;
}

export { CategoryGroup };

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
  performMonthRollover(targetMonth?: string): MonthRolloverResult;
  applyAutoAssign(): { totalAllocatedCents: number; assignedCount: number };
  rebalanceCategoryFunds(params: {
    targetCategoryId: string;
    sourceCategoryId: string;
    amountCents: number;
  }): { coveredCents: number; isCreditDebtCovered: boolean };
  resetDatabase(): void;
}

