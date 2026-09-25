# Behavioral Test Contracts: Web Supabase Integration (Phase 1)

This document establishes the Red-ready behavioral acceptance criteria for Phase 1. Every scenario is implementation-free and derived from business invariants.

---

## Scenario Contract Matrix

| Scenario ID | Category | Primary Target | Expected Outcome |
|---|---|---|---|
| `SCEN-001` | Auth & Bootstrapping | Supabase Anonymous Client | Automatically provisions anonymous session when no JWT exists; sets user_id |
| `SCEN-002` | Schema & RLS | Postgres DDL | Row Level Security prevents reading or writing records belonging to another user_id |
| `SCEN-003` | Schema Invariants | Postgres Tables | Monetary values stored as `bigint` (integer cents); foreign key cascades protect entity integrity |
| `SCEN-004` | Cache Hydration | `SupabaseLedgerRepository` | Hydrates in-memory `BudgetState` from Supabase on startup with accounts, categories, transactions |
| `SCEN-005` | Synchronous Reads | `SupabaseLedgerRepository` | `getBudgetState()` and `getCategoryGroups()` return synchronous snapshots without network delay |
| `SCEN-006` | Optimistic Mutations | Outflow / Inflow | Local cache updates immediately; async Postgres write persists transaction and balance changes |
| `SCEN-007` | Rollback on Failure | Mutation Failure | When remote Supabase write fails, in-memory cache reverts to previous snapshot and notifies UI |
| `SCEN-008` | Platform Routing | Repository Factory | `getRepository()` returns `SupabaseLedgerRepository` on Web and `SQLiteLedgerRepository` on Native |

---

## Detailed Acceptance Scenarios

### `SCEN-001`: Automatic Anonymous Authentication on Web
- **Given** a web user loads Almotacen with no existing auth credentials in storage
- **When** the client initializes
- **Then** it automatically calls `supabase.auth.signInAnonymously()`
- **And** retrieves a valid JWT containing a non-null `user.id`
- **And** caches the session token in browser storage.

### `SCEN-002`: Row Level Security Isolation
- **Given** User A has created an account "Checking" with $1,000.00 (`100000` cents)
- **When** User B (with a distinct `user_id`) queries `accounts` table via Supabase client
- **Then** User B receives an empty array (`[]`)
- **And** User B cannot update, insert, or delete User A's records.

### `SCEN-003`: Integer Cents & Entity Integrity Invariants
- **Given** the Supabase Postgres database schema
- **When** creating an account with balance $50.25 (`5025` cents)
- **Then** the value is stored as `bigint` in column `balance_cents`
- **And** floating-point decimal columns do not exist in the schema.

### `SCEN-004`: Cache Hydration on Launch
- **Given** a user with existing accounts, categories, and transactions in Supabase
- **When** `SupabaseLedgerRepository.initializeAsync()` executes
- **Then** it executes parallel SELECT queries for `accounts`, `category_groups`, `categories`, `transactions`, and `metadata`
- **And** constructs a valid in-memory `BudgetState` object.

### `SCEN-005`: Zero-Latency Synchronous Store Reads
- **Given** a hydrated `SupabaseLedgerRepository`
- **When** React invokes `useSyncExternalStore` getSnapshot handler
- **Then** `repo.getBudgetState()` returns immediately without returning a Promise
- **And** renders UI elements with zero asynchronous flickering or loading spinners.

### `SCEN-006`: Optimistic Outflow Mutation
- **Given** an account with balance `100000` cents ($1,000.00) and category "Groceries" with `20000` cents ($200.00)
- **When** user posts an outflow of `5000` cents ($50.00)
- **Then** local in-memory cache updates immediately (account balance: `95000`, available: `15000`)
- **And** listeners fire synchronously
- **And** background task executes `supabase.from('transactions').insert(...)` and balance updates.

### `SCEN-007`: Optimistic Mutation Rollback on Network Rejection
- **Given** an active ledger state
- **When** a mutation is posted but Supabase returns a network or authorization error
- **Then** the in-memory cache reverts to the pre-mutation snapshot
- **And** registered listeners are notified to re-render the reverted state
- **And** an error is dispatched to inform the user.

### `SCEN-008`: Platform-Specific Repository Factory
- **Given** the application runtime
- **When** `getRepository()` is called
- **Then** on `Platform.OS === 'web'`, it returns an instance of `SupabaseLedgerRepository`
- **And** on `Platform.OS !== 'web'`, it returns an instance of `SQLiteLedgerRepository`.
