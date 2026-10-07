import {
  Account,
  Category,
  CategoryGroup,
  CreateAccountInput,
  UpdateAccountInput,
  CreateCategoryGroupInput,
  UpdateCategoryGroupInput,
  CreateCategoryInput,
  UpdateCategoryInput,
  BudgetState,
  Transaction,
} from '../domain/ledger/types';
import { MonthRolloverResult } from '../domain/ledger/rollover';
import { ValidatedOnboardingConfig } from '../domain/onboarding/types';

export interface DatabaseAdapter {
  execSync(sql: string): void;
  runSync(sql: string, ...params: unknown[]): { lastInsertRowId: number; changes: number };
  getAllSync<T = unknown>(sql: string, ...params: unknown[]): T[];
  getFirstSync<T = unknown>(sql: string, ...params: unknown[]): T | null;
  withTransactionSync<T>(task: () => T): T;
  closeSync?(): void;
}

export { CategoryGroup };
export type {
  CreateAccountInput,
  UpdateAccountInput,
  CreateCategoryGroupInput,
  UpdateCategoryGroupInput,
  CreateCategoryInput,
  UpdateCategoryInput,
};
export {
  ValidationError,
  LedgerError,
  LedgerDomainError,
  EntityNotFoundError,
  EntityIntegrityError,
  ProtectedEntityError,
} from '../domain/ledger/errors';

export interface DiagnosticsData {
  schemaVersion: number;
  accountCount: number;
  categoryGroupCount: number;
  categoryCount: number;
  transactionCount: number;
}

export interface LedgerRepository {
  // Transaction operations
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

  // Entity catalog operations
  createAccount(input: CreateAccountInput): Account;
  updateAccount(input: UpdateAccountInput): Account;
  deleteAccount(id: string): void;
  createCategoryGroup(input: CreateCategoryGroupInput): CategoryGroup;
  updateCategoryGroup(input: UpdateCategoryGroupInput): CategoryGroup;
  deleteCategoryGroup(id: string): void;
  createCategory(input: CreateCategoryInput): Category;
  updateCategory(input: UpdateCategoryInput): Category;
  deleteCategory(id: string): void;

  // Admin & Lifecycle operations
  initializeAsync?(): Promise<void>;
  isOnboardingCompleted(): boolean;
  commitOnboardingConfig(config: ValidatedOnboardingConfig): void;
  resetDatabase(): void;
  factoryReset(): void;
  clearTransactionsOnly(): void;
  seedDemoData(): void;
  getDiagnostics(): DiagnosticsData;
  dispose?(): void;
}
