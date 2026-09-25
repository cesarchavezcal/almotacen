# Implementation Plan: Ticket 02 — Cached Supabase Ledger Repository

## Metadata
- **Change**: `web-supabase-integration`
- **Ticket**: `02-cached-supabase-ledger-repository.md`
- **Bound Scenarios**: [`SCEN-004`](../../openspec/changes/web-supabase-integration/spec-tests.md#scen-004-cache-hydration-on-launch), [`SCEN-005`](../../openspec/changes/web-supabase-integration/spec-tests.md#scen-005-zero-latency-synchronous-store-reads), [`SCEN-006`](../../openspec/changes/web-supabase-integration/spec-tests.md#scen-006-optimistic-outflow-mutation), [`SCEN-007`](../../openspec/changes/web-supabase-integration/spec-tests.md#scen-007-optimistic-mutation-rollback-on-network-rejection)
- **Target Branch**: `feature/CCH/ALM-022-cached-supabase-repository`

---

## 1. Objective

Implement `SupabaseLedgerRepository` satisfying the `LedgerRepository` interface. It holds an in-memory `BudgetState` and `CategoryGroup[]` cache to support synchronous 60fps reads (`useSyncExternalStore`), executes pure domain operations locally, and writes mutations to Supabase Postgres asynchronously with optimistic rollback on error.

---

## 2. Technical Architecture & Component Design

### 2.1 File Layout & Responsibilities
```text
src/storage/supabase/
├── client.ts                                # Supabase singleton & auth bootstrap (Ticket 01)
├── types.ts                                 # Postgres row interfaces & DTOs
├── mappers.ts                               # Bidirectional row <-> domain entity transformers
├── supabaseLedgerRepository.ts              # Cached repository implementing LedgerRepository
└── __tests__/
    ├── client.test.ts                       # Client auth tests (passing)
    └── supabaseLedgerRepository.test.ts     # TDD test suite for hydration, sync reads, optimistic writes, rollback
```

### 2.2 Postgres Row Types (`src/storage/supabase/types.ts`)
- `AccountRow`: `id`, `user_id`, `name`, `account_type`, `balance_cents`, `created_at`, `updated_at`
- `CategoryGroupRow`: `id`, `user_id`, `name`, `sort_order`, `created_at`
- `CategoryRow`: `id`, `user_id`, `group_id`, `name`, `assigned_cents`, `activity_cents`, `available_cents`, `target_cents`, `target_type`, `target_due_day`, `unfunded_debt_cents`, `is_credit_payment`, `credit_account_id`, `sort_order`
- `TransactionRow`: `id`, `user_id`, `account_id`, `category_id`, `amount_cents`, `payee`, `notes`, `transaction_type`, `transfer_account_id`, `occurred_at`, `created_at`
- `MetadataRow`: `id`, `user_id`, `key`, `value`, `updated_at`

### 2.3 Row Mappers (`src/storage/supabase/mappers.ts`)
- Pure, bi-directional conversion functions with strict integer cents discipline (`Number(row.balance_cents)`).
- Maps `is_credit_payment` between integer check (`0`/`1`) and domain boolean.
- Handles default timestamps and optional fields cleanly.

### 2.4 Cached Repository Lifecycle & Invariants (`SupabaseLedgerRepository`)
1. **In-Memory Store**: Holds mutable `private budgetState: BudgetState` and `private groups: CategoryGroup[]`, initialized to empty starter state or seed defaults.
2. **Hydration (`initializeAsync()`)**:
   - Queries all 5 tables via parallel queries: `accounts`, `category_groups`, `categories`, `transactions`, `metadata`.
   - Converts rows to domain models and computes initial ready-to-assign pool.
   - Emits change to registered subscribers.
3. **Synchronous Contract Reads**:
   - `getBudgetState(): BudgetState` ➔ returns in-memory state synchronously (`SCEN-005`).
   - `getCategoryGroups(): CategoryGroup[]` ➔ returns in-memory groups synchronously.
4. **Optimistic Mutations**:
   - Clones current state snapshot (`cloneSnapshot()`).
   - Applies pure domain logic (`postOutflowCore`, `postInflowCore`, `allocateEnvelopeCore`, `postCreditPaymentCore`, `applyAutoAssignAllocations`, `rebalanceCategoryFundsCore`, etc.) to local state.
   - Dispatches synchronous notification to listeners (`SCEN-006`).
   - Launches asynchronous background write to Supabase.
5. **Rollback Resilience**:
   - If the background write fails/rejects:
     - In-memory state reverts to cloned pre-mutation snapshot (`SCEN-007`).
     - Subscribers are notified to re-render the reverted state.
     - Logs warning or dispatches error event.
6. **Data Reset & Diagnostics**:
   - Implements `getDiagnostics()`, `factoryReset()`, `clearTransactionsOnly()`, `seedDemoData()`, and `resetDatabase()`.

---

## 3. Step-by-Step Implementation Sequence

1. **Step 1: Postgres Row Definitions & Mappers (`src/storage/supabase/types.ts`, `src/storage/supabase/mappers.ts`)**
   - Define exact Postgres table row interfaces matching `20260925_init_ledger_schema.sql`.
   - Author transformation functions with integer parsing and null guards.

2. **Step 2: Failing Red Tests (`src/storage/supabase/__tests__/supabaseLedgerRepository.test.ts`)**
   - Author test suite using `@total-typescript/shoehorn` mock client for:
     - `SCEN-004`: `initializeAsync()` populates `BudgetState` and `CategoryGroup[]`.
     - `SCEN-005`: `getBudgetState()` returns immediately without network delay or promises.
     - `SCEN-006`: `postOutflow()` mutates local cache synchronously and dispatches async insert.
     - `SCEN-007`: Reverts local cache when background write promise rejects.
     - Entity CRUD: `createAccount`, `deleteAccount`, `createCategory`, etc.

3. **Step 3: Implement `SupabaseLedgerRepository` (`src/storage/supabase/supabaseLedgerRepository.ts`)**
   - Implement complete `LedgerRepository` interface delegating domain calculations to `ledgerEngine.ts`, `entityOperations.ts`, `autoAssign.ts`, and `overspendingCoverage.ts`.
   - Wire optimistic snapshot-and-rollback logic.

4. **Step 4: Harness Verification (`./init.sh`)**
   - Run typechecking (`tsc --noEmit`) and all 29 test suites via `./init.sh`.
   - Ensure 100% test pass rate and 0 type errors.

5. **Step 5: Code Review & Commit**
   - Run automated `.gga` pre-commit review.
   - Commit: `feat(supabase): implement cached supabase ledger repository with optimistic sync`
