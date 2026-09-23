import { BudgetState, Transaction, CategoryGroup, Account, Category } from '../domain/ledger/types';
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
export {
  ValidationError,
  LedgerError,
  LedgerDomainError,
  EntityNotFoundError,
  EntityIntegrityError,
  ProtectedEntityError,
} from '../domain/ledger/errors';

export interface CreateAccountInput {
  id?: string;
  name: string;
  accountType: Account['accountType'];
  balanceCents: number;
}

export interface UpdateAccountInput {
  id: string;
  name: string;
  balanceCents?: number;
}

export interface CreateCategoryGroupInput {
  id?: string;
  name: string;
}

export interface UpdateCategoryGroupInput {
  id: string;
  name: string;
}

export interface CreateCategoryInput {
  id?: string;
  groupId: string;
  name: string;
  targetCents?: number;
  targetType?: Category['targetType'];
  targetDueDay?: number;
}

export interface UpdateCategoryInput {
  id: string;
  groupId?: string;
  name?: string;
  targetCents?: number;
  targetType?: Category['targetType'];
  targetDueDay?: number;
}
export interface DiagnosticsData {
  schemaVersion: number;
  accountCount: number;
  categoryGroupCount: number;
  categoryCount: number;
  transactionCount: number;
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
  performMonthRollover(targetMonth?: string): MonthRolloverResult;
  applyAutoAssign(): { totalAllocatedCents: number; assignedCount: number };
  rebalanceCategoryFunds(params: {
    targetCategoryId: string;
    sourceCategoryId: string;
    amountCents: number;
  }): { coveredCents: number; isCreditDebtCovered: boolean };
  resetDatabase(): void;
  factoryReset(): void;
  clearTransactionsOnly(): void;
  seedDemoData(): void;
  getDiagnostics(): DiagnosticsData;
  createAccount(input: CreateAccountInput): Account;
  updateAccount(input: UpdateAccountInput): Account;
  deleteAccount(id: string): void;
  createCategoryGroup(input: CreateCategoryGroupInput): CategoryGroup;
  updateCategoryGroup(input: UpdateCategoryGroupInput): CategoryGroup;
  deleteCategoryGroup(id: string): void;
  createCategory(input: CreateCategoryInput): Category;
  updateCategory(input: UpdateCategoryInput): Category;
  deleteCategory(id: string): void;
}

