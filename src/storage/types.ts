import {
  CategoryGroup,
  CreateAccountInput,
  UpdateAccountInput,
  CreateCategoryGroupInput,
  UpdateCategoryGroupInput,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '../domain/ledger/types';
import { LedgerTransactionsPort } from './ports/ledgerTransactionsPort';
import { EntityCatalogPort } from './ports/entityCatalogPort';
import { LedgerAdminPort } from './ports/ledgerAdminPort';

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

export * from './ports/ledgerTransactionsPort';
export * from './ports/entityCatalogPort';
export * from './ports/ledgerAdminPort';

export interface LedgerRepository
  extends LedgerTransactionsPort,
    EntityCatalogPort,
    LedgerAdminPort {}
