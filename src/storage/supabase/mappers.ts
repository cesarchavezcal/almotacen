import { Account, AccountType, Category, CategoryGroup, Transaction, isTargetType } from '../../domain/ledger/types';
import { AccountRow, CategoryGroupRow, CategoryRow, TransactionRow } from './types';
import { ValidationError } from '../../domain/ledger/errors';

/**
 * Type guard for AccountType.
 */
export function isAccountType(val: unknown): val is AccountType {
  return val === 'checking' || val === 'savings' || val === 'credit' || val === 'cash';
}

/**
 * Type guard for TransactionType.
 */
export function isTransactionType(val: unknown): val is TransactionRow['transaction_type'] {
  return val === 'inflow' || val === 'outflow' || val === 'transfer' || val === 'credit_payment';
}

/**
 * Maps Postgres AccountRow to domain Account entity.
 * Validates accountType against supported domain types; throws ValidationError on invalid type.
 */
export function mapAccountRowToDomain(row: AccountRow, creditPaymentCategoryId?: string): Account {
  if (!isAccountType(row.account_type)) {
    throw new ValidationError(`Invalid account_type '${String(row.account_type)}' for account '${row.id}'`);
  }

  return {
    id: row.id,
    name: row.name,
    accountType: row.account_type,
    balanceCents: Number(row.balance_cents),
    creditPaymentCategoryId,
  };
}

/**
 * Maps domain Account entity to Postgres AccountRow.
 */
export function mapDomainToAccountRow(account: Account, userId: string): AccountRow {
  return {
    id: account.id,
    user_id: userId,
    name: account.name,
    account_type: account.accountType,
    balance_cents: account.balanceCents,
  };
}

/**
 * Maps Postgres CategoryGroupRow to domain CategoryGroup entity.
 */
export function mapCategoryGroupRowToDomain(row: CategoryGroupRow): CategoryGroup {
  return {
    id: row.id,
    name: row.name,
    sortOrder: row.sort_order,
  };
}

/**
 * Maps domain CategoryGroup entity to Postgres CategoryGroupRow.
 */
export function mapDomainToCategoryGroupRow(group: CategoryGroup, userId: string): CategoryGroupRow {
  return {
    id: group.id,
    user_id: userId,
    name: group.name,
    sort_order: group.sortOrder,
  };
}

/**
 * Maps Postgres CategoryRow to domain Category entity.
 */
export function mapCategoryRowToDomain(row: CategoryRow): Category {
  return {
    id: row.id,
    groupId: row.group_id,
    name: row.name,
    targetCents: Number(row.target_cents),
    targetType: isTargetType(row.target_type) ? row.target_type : undefined,
    targetDueDay: row.target_due_day ?? undefined,
    assignedCents: Number(row.assigned_cents),
    availableCents: Number(row.available_cents),
    isCreditPayment: Boolean(row.is_credit_payment),
    unfundedDebtCents: Number(row.unfunded_debt_cents),
  };
}

/**
 * Maps domain Category entity to Postgres CategoryRow.
 */
export function mapDomainToCategoryRow(
  category: Category,
  userId: string,
  sortOrder = 0,
  creditAccountId: string | null = null
): CategoryRow {
  return {
    id: category.id,
    user_id: userId,
    group_id: category.groupId,
    name: category.name,
    assigned_cents: category.assignedCents,
    activity_cents: 0,
    available_cents: category.availableCents,
    target_cents: category.targetCents,
    target_type: category.targetType ?? null,
    target_due_day: category.targetDueDay ?? null,
    unfunded_debt_cents: category.unfundedDebtCents ?? 0,
    is_credit_payment: category.isCreditPayment ? 1 : 0,
    credit_account_id: creditAccountId,
    sort_order: sortOrder,
  };
}

/**
 * Maps Postgres TransactionRow to domain Transaction entity.
 */
export function mapTransactionRowToDomain(row: TransactionRow): Transaction {
  if (!isTransactionType(row.transaction_type)) {
    throw new ValidationError(`Invalid transaction_type '${String(row.transaction_type)}' for transaction '${row.id}'`);
  }

  return {
    id: row.id,
    accountId: row.account_id,
    categoryId: row.category_id ?? undefined,
    payee: row.payee,
    amountCents: Number(row.amount_cents),
    direction: row.transaction_type === 'inflow' ? 'inflow' : 'outflow',
    occurredAt: row.occurred_at,
    syncStatus: 'synced',
  };
}

/**
 * Maps domain Transaction entity to Postgres TransactionRow.
 */
export function mapDomainToTransactionRow(
  tx: Transaction,
  userId: string,
  transactionType?: 'inflow' | 'outflow' | 'transfer' | 'credit_payment'
): TransactionRow {
  return {
    id: tx.id,
    user_id: userId,
    account_id: tx.accountId,
    category_id: tx.categoryId ?? null,
    amount_cents: tx.amountCents,
    payee: tx.payee,
    notes: null,
    transaction_type: transactionType ?? (tx.direction === 'inflow' ? 'inflow' : 'outflow'),
    transfer_account_id: null,
    occurred_at: tx.occurredAt,
  };
}
