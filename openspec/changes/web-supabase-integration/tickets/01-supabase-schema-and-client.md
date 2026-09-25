# Ticket 01: Supabase Schema & Anonymous Client

## Metadata
- **Change**: `web-supabase-integration`
- **Bound Scenarios**: [`SCEN-001`](../spec-tests.md#scen-001-automatic-anonymous-authentication-on-web), [`SCEN-002`](../spec-tests.md#scen-002-row-level-security-isolation), [`SCEN-003`](../spec-tests.md#scen-003-integer-cents--entity-integrity-invariants)
- **Status**: Completed
- **PR**: [#42](https://github.com/cesarchavezcal/almotacen/pull/42)

---

## 1. Objective
Deploy the foundational Postgres database schema for Supabase, establish strict Row Level Security (RLS) policies, and configure the client-side Supabase SDK with automatic anonymous authentication.

---

## 2. Acceptance Criteria
1. **Dependency**: `@supabase/supabase-js` is installed in `package.json`.
2. **Postgres DDL**: `supabase/migrations/20260925_init_ledger_schema.sql` creates:
   - `metadata (id uuid, user_id uuid, key text, value text, updated_at timestamptz)`
   - `accounts (id text, user_id uuid, name text, account_type text, balance_cents bigint, created_at timestamptz, updated_at timestamptz)`
   - `category_groups (id text, user_id uuid, name text, sort_order integer, created_at timestamptz)`
   - `categories (id text, user_id uuid, group_id text, name text, assigned_cents bigint, activity_cents bigint, available_cents bigint, target_cents bigint, target_type text, target_due_day integer, unfunded_debt_cents bigint, is_credit_payment integer, credit_account_id text, sort_order integer)`
   - `transactions (id text, user_id uuid, account_id text, category_id text, amount_cents bigint, payee text, notes text, transaction_type text, transfer_account_id text, occurred_at timestamptz, created_at timestamptz)`
3. **RLS Policies**: Every table enables RLS with policies permitting SELECT, INSERT, UPDATE, DELETE only where `auth.uid() = user_id`.
4. **Client Singleton**: `src/storage/supabase/client.ts` exports `getSupabaseClient()` reading `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`, and `ensureAnonymousSession()` which authenticates via `supabase.auth.signInAnonymously()` if no active session exists.
5. **Testing**: Unit tests verify client creation, error handling when env vars are missing, and session bootstrapping.

---

## 3. Implementation Checklist
- [ ] Install `@supabase/supabase-js`.
- [ ] Create `supabase/migrations/20260925_init_ledger_schema.sql`.
- [ ] Implement `src/storage/supabase/client.ts`.
- [ ] Implement unit test `src/storage/supabase/__tests__/client.test.ts`.
- [ ] Run `./init.sh` to verify zero regression.
