# Behavioral Test Contracts: Web Supabase Hardening (Phase 2)

This document establishes the Red-ready behavioral acceptance criteria for Phase 2 hardening. Every scenario is implementation-free and derived directly from system contracts.

---

## Scenario Contract Matrix

| Scenario ID | Category | Primary Target | Expected Outcome |
|---|---|---|---|
| `SCEN-009` | Tooling & Harness | Test Runner & DX | `./init.sh` runs cleanly with 0 typecheck errors and 100% test pass rate on supported compiler baseline |
| `SCEN-010` | Web Onboarding | `useOnboardingWizard` & `LedgerRepository` | Onboarding on Web completes without SQLite initialization errors, updating in-memory cache and remote Supabase tables |
| `SCEN-011` | Explore Demo Seam | Onboarding Demo Seeding | Tapping "Explore Demo" on Web seeds demo data via `LedgerRepository.seedDemoData()` without SQLite dependencies |
| `SCEN-012` | RLS Performance | Postgres DDL & Security | RLS policies execute as `InitPlan` using `(select auth.uid()) = user_id` and restrict role evaluation `TO authenticated` |
| `SCEN-013` | Indexing & Integrity | Postgres Foreign Keys | Dedicated indexes on `categories(credit_account_id)` and `transactions(transfer_account_id)` prevent full-table scan locks |
| `SCEN-014` | Realtime Sync | Multi-Tab / Multi-Device | Remote database mutations broadcast over `supabase_realtime` and trigger debounced re-hydration in active client tabs |
| `SCEN-015` | Echo Suppression | Local Mutation Loopback | Client tab that initiated an optimistic mutation suppresses its own realtime echo, avoiding redundant re-fetching |
| `SCEN-016` | Identity Switching | Auth State Listener | Switching to a different user session flushes prior in-memory budget state and re-hydrates the incoming user's data |
| `SCEN-017` | Account Claiming | Anonymous User Conversion | Converting anonymous user to permanent account retains the user's UUID and leaves all existing ledger records intact |

---

## Detailed Acceptance Scenarios

### `SCEN-009`: Test Runner & Tooling Baseline Health
- **Given** the repository with updated package configuration
- **When** executing `./init.sh`
- **Then** `npm run typecheck` completes with exit code 0
- **And** `npm test` runs ts-jest across all test suites with 0 test suite failures.

### `SCEN-010`: Web Onboarding Commitment & Hydration
- **Given** an anonymous web user at the final step of the onboarding wizard
- **When** the user submits checking account "$2,000.00" and archetype allocations
- **Then** `LedgerRepository.commitOnboardingConfig()` executes without calling `expo-sqlite` or `node:sqlite`
- **And** updates in-memory `BudgetState` immediately (`readyToAssignCents: 0`, accounts and categories created)
- **And** sets `isOnboardingCompleted() === true`
- **And** dispatches remote batch upserts to Supabase Postgres.

### `SCEN-011`: Explore Demo via Repository Seam
- **Given** a web user on the first step of onboarding
- **When** the user taps "Explore Demo"
- **Then** the action delegates to `repo.seedDemoData()`
- **And** in-memory cache loads default seed accounts, category groups, and categories
- **And** user navigates directly to `/(tabs)` without SQLite errors.

### `SCEN-012`: InitPlan RLS Performance & Anonymous Role Access
- **Given** the applied migration `20260930_optimize_rls_and_realtime.sql`
- **When** an authenticated user (including anonymous sessions carrying the `authenticated` role) queries ledger tables
- **Then** Postgres executes the RLS policy as an `InitPlan` evaluating `auth.uid()` once per query
- **And** unauthenticated `anon` queries are denied at the role gate without evaluating row expressions.

### `SCEN-013`: Foreign Key Indexing & Cascade Deletes
- **Given** the Postgres database with multiple categories and transactions
- **When** a credit card account is removed or a transfer transaction is processed
- **Then** index lookups on `categories(credit_account_id)` and `transactions(transfer_account_id)` execute via index scans rather than sequential table scans.

### `SCEN-014`: Realtime Remote Mutation Sync
- **Given** Client Tab A and Client Tab B both connected to the same user ledger
- **When** Client Tab A records an outflow transaction of $25.00
- **Then** Client Tab B receives the `postgres_changes` broadcast over WebSocket
- **And** Client Tab B debounces the incoming signal by 200ms
- **And** re-hydrates its in-memory `BudgetState` and triggers `useSyncExternalStore` listeners to update the UI.

### `SCEN-015`: Local Mutation Echo Suppression
- **Given** Client Tab A posts an optimistic outflow transaction
- **When** Supabase Realtime broadcasts the corresponding `INSERT` event back to Client Tab A
- **Then** Client Tab A detects the matching local transaction sequence token or active write count
- **And** discards the echo event without triggering a redundant full-ledger re-fetch.

### `SCEN-016`: Clean Budget Switch on Auth Change
- **Given** an active web session holding Budget A in memory
- **When** the user signs in to Account B (`session.user.id !== currentUserId`)
- **Then** `SupabaseLedgerRepository` flushes Budget A from memory
- **And** re-initializes and hydrates Budget B for the incoming user.

### `SCEN-017`: Zero-Data-Loss Identity Claiming
- **Given** an anonymous user with active accounts, categories, and transactions
- **When** the user claims their account via `supabase.auth.updateUser({ email, password })`
- **Then** `user.id` remains unchanged
- **And** all existing ledger records in Supabase remain associated with the user's UUID.
