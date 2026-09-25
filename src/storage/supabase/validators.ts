import { AccountRow, CategoryGroupRow, CategoryRow, TransactionRow, MetadataRow } from './types';
import { isAccountType, isTransactionType } from './mappers';
import { isTargetType } from '../../domain/ledger/types';

/**
 * Runtime type guard for Postgres AccountRow.
 */
export function isAccountRow(val: unknown): val is AccountRow {
  if (typeof val !== 'object' || val === null) return false;
  const r = val as Record<string, unknown>;
  return (
    typeof r.id === 'string' &&
    typeof r.user_id === 'string' &&
    typeof r.name === 'string' &&
    isAccountType(r.account_type) &&
    (typeof r.balance_cents === 'number' || typeof r.balance_cents === 'string' || typeof r.balance_cents === 'bigint')
  );
}

/**
 * Runtime type guard for Postgres CategoryGroupRow.
 */
export function isCategoryGroupRow(val: unknown): val is CategoryGroupRow {
  if (typeof val !== 'object' || val === null) return false;
  const r = val as Record<string, unknown>;
  return (
    typeof r.id === 'string' &&
    typeof r.user_id === 'string' &&
    typeof r.name === 'string' &&
    typeof r.sort_order === 'number'
  );
}

/**
 * Runtime type guard for Postgres CategoryRow.
 */
export function isCategoryRow(val: unknown): val is CategoryRow {
  if (typeof val !== 'object' || val === null) return false;
  const r = val as Record<string, unknown>;
  const validTarget = r.target_type === null || r.target_type === undefined || isTargetType(r.target_type);
  return (
    typeof r.id === 'string' &&
    typeof r.user_id === 'string' &&
    typeof r.group_id === 'string' &&
    typeof r.name === 'string' &&
    validTarget &&
    typeof r.sort_order === 'number'
  );
}

/**
 * Runtime type guard for Postgres TransactionRow.
 */
export function isTransactionRow(val: unknown): val is TransactionRow {
  if (typeof val !== 'object' || val === null) return false;
  const r = val as Record<string, unknown>;
  return (
    typeof r.id === 'string' &&
    typeof r.user_id === 'string' &&
    typeof r.account_id === 'string' &&
    typeof r.payee === 'string' &&
    isTransactionType(r.transaction_type) &&
    typeof r.occurred_at === 'string'
  );
}

/**
 * Runtime type guard for Postgres MetadataRow.
 */
export function isMetadataRow(val: unknown): val is MetadataRow {
  if (typeof val !== 'object' || val === null) return false;
  const r = val as Record<string, unknown>;
  return (
    typeof r.user_id === 'string' &&
    typeof r.key === 'string' &&
    typeof r.value === 'string'
  );
}

/**
 * Filters an unknown array returning only valid rows matching the given type guard.
 */
export function validateRows<T>(data: unknown, validator: (item: unknown) => item is T): T[] {
  if (!Array.isArray(data)) return [];
  return data.filter(validator);
}
