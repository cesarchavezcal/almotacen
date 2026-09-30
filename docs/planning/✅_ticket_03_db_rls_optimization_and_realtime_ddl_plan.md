# Implementation Plan: Ticket 03 — DB Optimization, RLS InitPlan & Realtime DDL

- **Change**: `web-supabase-hardening`
- **Ticket ID**: `03` (`ALM-027`)
- **Bound Scenarios**: `SCEN-012` (InitPlan RLS Performance & Role Access), `SCEN-013` (Foreign Key Indexing & Cascade Deletes)

---

## 1. Objective

Author and verify additive migration `supabase/migrations/20260930_optimize_rls_and_realtime.sql` to:
1. Eliminate full table scans during cascade deletes and joins by creating indexes on unindexed foreign keys (`categories.credit_account_id` and `transactions.transfer_account_id`).
2. Optimize Row Level Security query execution by turning bare `auth.uid() = user_id` evaluations into subquery cached `InitPlan` expressions `(select auth.uid()) = user_id`.
3. Enforce the Principle of Least Privilege by restricting policies `TO authenticated`, blocking unauthenticated `anon` queries before row evaluation while maintaining full support for Supabase anonymous sessions.
4. Register ledger tables in the `supabase_realtime` publication for downstream coalesced synchronization (Ticket 04).

---

## 2. Technical Design & Best Practices

Adhering to Supabase Postgres best practices (`security-rls-performance.md`, `schema-foreign-key-indexes.md`, and `security-privileges.md`):

### 2.1 Unindexed Foreign Key Indexes
- `idx_categories_credit_account` on `categories(credit_account_id)`:
  - References `accounts(id)` on delete `SET NULL`.
  - Without an index, removing a credit card account scans the entire `categories` table.
- `idx_transactions_transfer_account` on `transactions(transfer_account_id)`:
  - References `accounts(id)` on delete `SET NULL`.
  - Without an index, transfers or account adjustments trigger sequential scans across `transactions`.

### 2.2 RLS InitPlan & Role Restrictions
Bare `auth.uid()` evaluates per row (e.g. 10,000 rows = 10,000 function invocations). Wrapping in `(select auth.uid())` causes Postgres to evaluate it once per query plan (`InitPlan`) and cache the result in memory:
- **Role**: `TO authenticated` (Supabase anonymous logins carry the `authenticated` role with a valid JWT and `auth.uid()`).
- **SELECT / DELETE**: `USING ((select auth.uid()) = user_id)`
- **INSERT**: `WITH CHECK ((select auth.uid()) = user_id)`
- **UPDATE**: `USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id)`

Applied across all 5 ledger tables:
1. `metadata` (4 policies)
2. `accounts` (4 policies)
3. `category_groups` (4 policies)
4. `categories` (4 policies)
5. `transactions` (4 policies)
Total: 20 policies recreated.

### 2.3 Realtime Publication Registration
Idempotent registration of ledger tables into `supabase_realtime`:
```sql
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
```

---

## 3. Tasks Breakdown

1. **Branch Scaffolding**:
   - Create topic branch `chore/CCH/ALM-027-db-rls-optimization-and-realtime-ddl` from updated `main`.
2. **Author Migration**:
   - Create `supabase/migrations/20260930_optimize_rls_and_realtime.sql` with:
     - Foreign key indexes.
     - Policy drops & recreations with `(select auth.uid())` and `TO authenticated`.
     - Idempotent `supabase_realtime` publication addition.
3. **Author Verification Tests**:
   - Create `src/storage/supabase/__tests__/migrationOptimization.test.ts`.
   - Assert all foreign key indexes, InitPlan subqueries, `TO authenticated` clauses, and publication statements are present and syntactically valid.
4. **Verification Pass**:
   - Run `./init.sh` to ensure all 33 test suites pass, TypeScript compiles with zero errors, and lint passes cleanly.
5. **Update Tasks & Progress**:
   - Check off Ticket 03 in `openspec/changes/web-supabase-hardening/tasks.md` and `tickets/03-db-rls-optimization-and-realtime-ddl.md`.
   - Log milestone in `progress.md`.

---

## 4. Verification Criteria

- [ ] `supabase/migrations/20260930_optimize_rls_and_realtime.sql` contains `idx_categories_credit_account` and `idx_transactions_transfer_account`.
- [ ] All 20 RLS policies use `TO authenticated` and `(select auth.uid()) = user_id`.
- [ ] Tables are idempotently registered in `supabase_realtime`.
- [ ] Automated verification test suite `migrationOptimization.test.ts` passes.
- [ ] `./init.sh` executes with exit code 0 across all suites.
