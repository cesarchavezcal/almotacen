-- Migration: 20260930_optimize_rls_and_realtime.sql
-- Description: Optimize RLS policies via InitPlan subquery caching, enforce role restriction TO authenticated, add missing foreign key indexes, and register tables in supabase_realtime publication.
-- Bound Scenarios: SCEN-012, SCEN-013

-- ==============================================================================
-- 1. Unindexed Foreign Key Indexes (SCEN-013)
-- Prevents sequential table scans during cascade deletes and joined lookups
-- ==============================================================================

-- Index on categories(credit_account_id) -> accounts(id)
CREATE INDEX IF NOT EXISTS idx_categories_credit_account ON categories(credit_account_id);

-- Index on transactions(transfer_account_id) -> accounts(id)
CREATE INDEX IF NOT EXISTS idx_transactions_transfer_account ON transactions(transfer_account_id);

-- ==============================================================================
-- 2. Row Level Security (RLS) Optimization & Role Restriction (SCEN-012)
-- Wraps auth.uid() in (select auth.uid()) to trigger Postgres InitPlan caching
-- Restricts policies TO authenticated to reject unauthenticated anon requests
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 2.1 Metadata Table RLS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can only read own metadata" ON metadata;
CREATE POLICY "Users can only read own metadata"
    ON metadata FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can only insert own metadata" ON metadata;
CREATE POLICY "Users can only insert own metadata"
    ON metadata FOR INSERT
    TO authenticated
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can only update own metadata" ON metadata;
CREATE POLICY "Users can only update own metadata"
    ON metadata FOR UPDATE
    TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can only delete own metadata" ON metadata;
CREATE POLICY "Users can only delete own metadata"
    ON metadata FOR DELETE
    TO authenticated
    USING ((select auth.uid()) = user_id);

-- ------------------------------------------------------------------------------
-- 2.2 Accounts Table RLS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can only read own accounts" ON accounts;
CREATE POLICY "Users can only read own accounts"
    ON accounts FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can only insert own accounts" ON accounts;
CREATE POLICY "Users can only insert own accounts"
    ON accounts FOR INSERT
    TO authenticated
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can only update own accounts" ON accounts;
CREATE POLICY "Users can only update own accounts"
    ON accounts FOR UPDATE
    TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can only delete own accounts" ON accounts;
CREATE POLICY "Users can only delete own accounts"
    ON accounts FOR DELETE
    TO authenticated
    USING ((select auth.uid()) = user_id);

-- ------------------------------------------------------------------------------
-- 2.3 Category Groups Table RLS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can only read own category_groups" ON category_groups;
CREATE POLICY "Users can only read own category_groups"
    ON category_groups FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can only insert own category_groups" ON category_groups;
CREATE POLICY "Users can only insert own category_groups"
    ON category_groups FOR INSERT
    TO authenticated
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can only update own category_groups" ON category_groups;
CREATE POLICY "Users can only update own category_groups"
    ON category_groups FOR UPDATE
    TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can only delete own category_groups" ON category_groups;
CREATE POLICY "Users can only delete own category_groups"
    ON category_groups FOR DELETE
    TO authenticated
    USING ((select auth.uid()) = user_id);

-- ------------------------------------------------------------------------------
-- 2.4 Categories Table RLS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can only read own categories" ON categories;
CREATE POLICY "Users can only read own categories"
    ON categories FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can only insert own categories" ON categories;
CREATE POLICY "Users can only insert own categories"
    ON categories FOR INSERT
    TO authenticated
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can only update own categories" ON categories;
CREATE POLICY "Users can only update own categories"
    ON categories FOR UPDATE
    TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can only delete own categories" ON categories;
CREATE POLICY "Users can only delete own categories"
    ON categories FOR DELETE
    TO authenticated
    USING ((select auth.uid()) = user_id);

-- ------------------------------------------------------------------------------
-- 2.5 Transactions Table RLS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can only read own transactions" ON transactions;
CREATE POLICY "Users can only read own transactions"
    ON transactions FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can only insert own transactions" ON transactions;
CREATE POLICY "Users can only insert own transactions"
    ON transactions FOR INSERT
    TO authenticated
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can only update own transactions" ON transactions;
CREATE POLICY "Users can only update own transactions"
    ON transactions FOR UPDATE
    TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can only delete own transactions" ON transactions;
CREATE POLICY "Users can only delete own transactions"
    ON transactions FOR DELETE
    TO authenticated
    USING ((select auth.uid()) = user_id);

-- ==============================================================================
-- 3. Realtime Publication Enrollment
-- Idempotently registers ledger tables into supabase_realtime publication
-- ==============================================================================
DO $$
DECLARE
  tbl text;
  tbls text[] := ARRAY['accounts', 'category_groups', 'categories', 'transactions', 'metadata'];
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    FOREACH tbl IN ARRAY tbls LOOP
      IF NOT EXISTS (
        SELECT 1 FROM pg_publication_rel pr
        JOIN pg_class c ON pr.prrelid = c.oid
        JOIN pg_publication p ON pr.prpubid = p.oid
        WHERE p.pubname = 'supabase_realtime' AND c.relname = tbl
      ) THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', tbl);
      END IF;
    END LOOP;
  END IF;
END $$;
