-- Migration: 20260925_init_ledger_schema.sql
-- Description: Core ledger schema with integer cents, user multi-tenancy, and Row Level Security (RLS)
-- Bound Scenarios: SCEN-001, SCEN-002, SCEN-003

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- 1. Metadata Table
-- ==========================================
CREATE TABLE IF NOT EXISTS metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT uq_metadata_user_key UNIQUE (user_id, key)
);

CREATE INDEX IF NOT EXISTS idx_metadata_user ON metadata(user_id);

-- ==========================================
-- 2. Accounts Table
-- ==========================================
CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
    name TEXT NOT NULL,
    account_type TEXT NOT NULL CHECK (account_type IN ('checking', 'savings', 'credit', 'cash')),
    balance_cents BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts(user_id);

-- ==========================================
-- 3. Category Groups Table
-- ==========================================
CREATE TABLE IF NOT EXISTS category_groups (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_category_groups_user ON category_groups(user_id);

-- ==========================================
-- 4. Categories Table
-- ==========================================
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
    group_id TEXT REFERENCES category_groups(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    assigned_cents BIGINT NOT NULL DEFAULT 0,
    activity_cents BIGINT NOT NULL DEFAULT 0,
    available_cents BIGINT NOT NULL DEFAULT 0,
    target_cents BIGINT NOT NULL DEFAULT 0,
    target_type TEXT CHECK (target_type IN ('NEEDED_FOR_SPENDING', 'MONTHLY_SET_ASIDE')),
    target_due_day INTEGER CHECK (target_due_day BETWEEN 1 AND 31),
    unfunded_debt_cents BIGINT NOT NULL DEFAULT 0,
    is_credit_payment INTEGER NOT NULL DEFAULT 0 CHECK (is_credit_payment IN (0, 1)),
    credit_account_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_group ON categories(user_id, group_id);

-- ==========================================
-- 5. Transactions Table
-- ==========================================
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
    account_id TEXT REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    amount_cents BIGINT NOT NULL,
    payee TEXT NOT NULL,
    notes TEXT,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('inflow', 'outflow', 'transfer', 'credit_payment')),
    transfer_account_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(user_id, account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(user_id, category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_occurred ON transactions(user_id, occurred_at);

-- ==========================================
-- 6. Row Level Security (RLS) Configuration
-- ==========================================

-- Metadata RLS
ALTER TABLE metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only read own metadata"
    ON metadata FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert own metadata"
    ON metadata FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update own metadata"
    ON metadata FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only delete own metadata"
    ON metadata FOR DELETE
    USING (auth.uid() = user_id);

-- Accounts RLS
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only read own accounts"
    ON accounts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert own accounts"
    ON accounts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update own accounts"
    ON accounts FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only delete own accounts"
    ON accounts FOR DELETE
    USING (auth.uid() = user_id);

-- Category Groups RLS
ALTER TABLE category_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only read own category_groups"
    ON category_groups FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert own category_groups"
    ON category_groups FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update own category_groups"
    ON category_groups FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only delete own category_groups"
    ON category_groups FOR DELETE
    USING (auth.uid() = user_id);

-- Categories RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only read own categories"
    ON categories FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert own categories"
    ON categories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update own categories"
    ON categories FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only delete own categories"
    ON categories FOR DELETE
    USING (auth.uid() = user_id);

-- Transactions RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only read own transactions"
    ON transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert own transactions"
    ON transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update own transactions"
    ON transactions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only delete own transactions"
    ON transactions FOR DELETE
    USING (auth.uid() = user_id);
