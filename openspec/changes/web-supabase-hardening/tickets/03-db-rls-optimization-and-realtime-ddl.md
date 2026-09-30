# Ticket 03: DB Optimization, RLS InitPlan & Realtime DDL

- **Change**: `web-supabase-hardening`
- **Ticket ID**: `03`
- **Bound Scenarios**: `SCEN-012`, `SCEN-013`

---

## Objective
Author and verify additive migration `supabase/migrations/20260930_optimize_rls_and_realtime.sql` to optimize Row Level Security query execution via subquery `InitPlan` caching, enforce role restrictions `TO authenticated`, create indexes for unindexed foreign keys, and register ledger tables in `supabase_realtime` publication.

---

## Tasks
1. Create `supabase/migrations/20260930_optimize_rls_and_realtime.sql`.
2. Add foreign key indexes:
   - `idx_categories_credit_account` on `categories(credit_account_id)`
   - `idx_transactions_transfer_account` on `transactions(transfer_account_id)`
3. Drop and recreate all 20 RLS policies across `metadata`, `accounts`, `category_groups`, `categories`, and `transactions` with:
   - `TO authenticated`
   - `USING ((select auth.uid()) = user_id)`
   - `WITH CHECK ((select auth.uid()) = user_id)` (on INSERT and UPDATE).
4. Register tables in the Supabase Realtime publication:
   - `ALTER PUBLICATION supabase_realtime ADD TABLE accounts, category_groups, categories, transactions, metadata;`
5. Author SQL verification tests / assertions ensuring RLS and foreign key definitions conform to spec.

---

## Verification Criteria
- [ ] Migration executes cleanly without syntax errors.
- [ ] RLS policies include `(select auth.uid()) = user_id` and `TO authenticated`.
- [ ] Foreign key indexes exist.
- [ ] Tables are added to `supabase_realtime`.
