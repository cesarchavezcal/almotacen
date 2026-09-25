import { AccountType, TargetType } from '../../domain/ledger/types';

/**
 * Postgres Database Row Interfaces for Supabase Ledger
 *
 * Maps directly to table definitions in 20260925_init_ledger_schema.sql.
 */

export interface AccountRow {
  id: string;
  user_id: string;
  name: string;
  account_type: AccountType;
  balance_cents: number | string | bigint;
  created_at?: string;
  updated_at?: string;
}

export interface CategoryGroupRow {
  id: string;
  user_id: string;
  name: string;
  sort_order: number;
  created_at?: string;
}

export interface CategoryRow {
  id: string;
  user_id: string;
  group_id: string;
  name: string;
  assigned_cents: number | string | bigint;
  activity_cents: number | string | bigint;
  available_cents: number | string | bigint;
  target_cents: number | string | bigint;
  target_type?: TargetType | null;
  target_due_day?: number | null;
  unfunded_debt_cents: number | string | bigint;
  is_credit_payment: number;
  credit_account_id?: string | null;
  sort_order: number;
}

export interface TransactionRow {
  id: string;
  user_id: string;
  account_id: string;
  category_id?: string | null;
  amount_cents: number | string | bigint;
  payee: string;
  notes?: string | null;
  transaction_type: 'inflow' | 'outflow' | 'transfer' | 'credit_payment';
  transfer_account_id?: string | null;
  occurred_at: string;
  created_at?: string;
}

export interface MetadataRow {
  id?: string;
  user_id: string;
  key: string;
  value: string;
  updated_at?: string;
}
