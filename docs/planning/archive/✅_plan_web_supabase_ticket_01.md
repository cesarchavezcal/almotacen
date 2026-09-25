# Implementation Plan: Ticket 01 — Supabase Schema & Anonymous Client

## Metadata
- **Ticket**: [`openspec/changes/web-supabase-integration/tickets/01-supabase-schema-and-client.md`](file:///Users/cesaradalbertochavezcalderon/orca/workspaces/almotacen/oystercatcher/openspec/changes/web-supabase-integration/tickets/01-supabase-schema-and-client.md)
- **Bound Scenarios**: `SCEN-001` (Anonymous Auth), `SCEN-002` (RLS Isolation), `SCEN-003` (Integer Cents Invariant)
- **Branch**: `feature/CCH/ALM-021-supabase-schema-client`

---

## 1. Objectives & Deliverables
1. **Dependency**: Install `@supabase/supabase-js` without introducing dependency conflicts.
2. **Postgres DDL Migration**: Create `supabase/migrations/20260925_init_ledger_schema.sql` mirroring SQLite schema v2 with `bigint` integer cents, UUID user ownership, and strict Row Level Security (RLS) policies.
3. **Supabase Client Singleton**: Implement `src/storage/supabase/client.ts` supporting `getSupabaseClient()` and `ensureAnonymousSession()`.
4. **Automated Unit Testing**: Author `src/storage/supabase/__tests__/client.test.ts` to verify initialization, missing env error handling, and session caching.

---

## 2. Technical Design & File Changes

### A. Database Migration: `supabase/migrations/20260925_init_ledger_schema.sql`
- **Tables**:
  - `metadata`: `(id uuid default gen_random_uuid() primary key, user_id uuid references auth.users(id) on delete cascade not null, key text not null, value text not null, updated_at timestamptz default now() not null, unique(user_id, key))`
  - `accounts`: `(id text primary key, user_id uuid references auth.users(id) on delete cascade not null, name text not null, account_type text not null check (account_type in ('depository', 'credit')), balance_cents bigint not null default 0, created_at timestamptz default now() not null, updated_at timestamptz default now() not null)`
  - `category_groups`: `(id text primary key, user_id uuid references auth.users(id) on delete cascade not null, name text not null, sort_order integer not null default 0, created_at timestamptz default now() not null)`
  - `categories`: `(id text primary key, user_id uuid references auth.users(id) on delete cascade not null, group_id text references category_groups(id) on delete cascade not null, name text not null, assigned_cents bigint not null default 0, activity_cents bigint not null default 0, available_cents bigint not null default 0, target_cents bigint not null default 0, target_type text check (target_type in ('NEED_FOR_SPENDING', 'MONTHLY_SAVINGS_BUILDER', 'TARGET_BALANCE')), target_due_day integer, unfunded_debt_cents bigint not null default 0, is_credit_payment integer not null default 0, credit_account_id text references accounts(id) on delete set null, sort_order integer not null default 0)`
  - `transactions`: `(id text primary key, user_id uuid references auth.users(id) on delete cascade not null, account_id text references accounts(id) on delete cascade not null, category_id text references categories(id) on delete set null, amount_cents bigint not null, payee text not null, notes text, transaction_type text not null check (transaction_type in ('inflow', 'outflow', 'transfer', 'credit_payment')), transfer_account_id text references accounts(id) on delete set null, occurred_at timestamptz not null default now(), created_at timestamptz default now() not null)`
- **Row Level Security**:
  - Enable RLS on all 5 tables (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`).
  - Add 4 policies per table (SELECT, INSERT, UPDATE, DELETE) enforcing `auth.uid() = user_id`.

### B. Client Implementation: `src/storage/supabase/client.ts`
- Read `process.env.EXPO_PUBLIC_SUPABASE_URL` and `process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- Define strict types for database client options and session results.
- Implement `getSupabaseClient()` with singleton caching.
- Implement `ensureAnonymousSession()` which checks `supabase.auth.getSession()` and calls `supabase.auth.signInAnonymously()` if no session is active.
- Throw typed `SupabaseConfigurationError` when environment variables are missing during client access.

### C. Testing: `src/storage/supabase/__tests__/client.test.ts`
- Test missing env vars error throw.
- Test client creation when env vars are present.
- Test `ensureAnonymousSession()` reusing active session vs creating a new anonymous session.

---

## 3. Step-by-Step Execution Sequence

1. **Step 1: Branch Creation**: Create and checkout `feature/CCH/ALM-021-supabase-schema-client`.
2. **Step 2: Package Installation**: Run `npm install @supabase/supabase-js`.
3. **Step 3: Migration Authoring**: Create `supabase/migrations/20260925_init_ledger_schema.sql`.
4. **Step 4: Client Implementation**: Create `src/storage/supabase/client.ts` with error types and anonymous auth bootstrap.
5. **Step 5: Test Authoring & Execution**: Write and run `src/storage/supabase/__tests__/client.test.ts`.
6. **Step 6: Full Verification**: Run `./init.sh` to ensure all 27+ test suites pass with 0 typecheck errors.
