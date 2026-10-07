# Exploration: Web Supabase Integration & Hybrid Storage Architecture

## Current State
Almotacen is built with an offline-first architecture centered around an embedded SQLite storage engine (`expo-sqlite` on native, with fallback to `node:sqlite` in Jest test suites).
- Data access is mediated through the `LedgerRepository` interface and consumed by React via `useLedgerStore`, which relies on `useSyncExternalStore` for instantaneous, zero-latency synchronous snapshots.
- On Web, `expo-sqlite` uses a WebAssembly worker (`wa-sqlite.wasm`) backed by the browser Origin Private File System (OPFS). This requires cross-origin isolation headers (`COOP`/`COEP`) and suffers from cold-start timing limits (`Sync operation timeout`) during synchronous initial renders.

## Affected Areas
- `src/storage/types.ts`: Core `LedgerRepository` interface remains the unified contract.
- `src/storage/supabase/client.ts` *(new)*: Supabase client singleton configured with anonymous authentication and auto-token refreshing.
- `src/storage/supabase/supabaseLedgerRepository.ts` *(new)*: Implements `LedgerRepository` using an in-memory cached `BudgetState` for 60fps synchronous UI reads, backed by asynchronous Supabase Postgres mutations with optimistic updates.
- `src/storage/useLedgerStore.ts`: Platform-aware repository factory (`getRepository()`) routing to `SupabaseLedgerRepository` on Web and `SQLiteLedgerRepository` on Native.
- `supabase/migrations/20260925_init_ledger_schema.sql` *(new)*: Postgres DDL migration mirroring SQLite schema v2 (`metadata`, `accounts`, `category_groups`, `categories`, `transactions`), with `user_id uuid references auth.users(id)` and Row Level Security (RLS) policies.
- `app/_layout.tsx`: Web initialization gate for Supabase anonymous session creation and cache pre-warming.

## Approaches

### 1. Hybrid Local-First Architecture (Recommended)
- **Web**: Supabase Postgres as primary remote database. Uses an in-memory cached `SupabaseLedgerRepository` for instant 60fps reads and optimistic async writes. Zero Web Worker / SharedArrayBuffer complexity in browsers.
- **Mobile**: Embedded SQLite (`expo-sqlite`) as primary local database for zero-latency, offline-first mobile usage.
- **Phase 2**: Background sync worker replicates local SQLite transactions to Supabase when connectivity is present.
- **Pros**:
  - Eliminates browser OPFS/WASM worker failures on web.
  - Preserves offline-first guarantee on mobile.
  - Zero disruption to existing domain business logic or unit tests.
- **Cons**: Requires maintaining two repository implementations (`SQLiteLedgerRepository` and `SupabaseLedgerRepository`).
- **Effort**: Medium

### 2. Cloud-Only Postgres Architecture
- Completely replace SQLite with Supabase/Neon across both Web and Mobile.
- All ledger state loaded over HTTP/WebSockets via React Query / SWR.
- **Pros**: Single backend and data store across all platforms.
- **Cons**: Destroys offline functionality on mobile; high network latency on every envelope rebalance; requires total rewrite of `useLedgerStore` and all screen hooks.
- **Effort**: High

### 3. Pure SQLite Fix (No Cloud)
- Retain `expo-sqlite` on web and continue patching the async worker bootstrap pipeline in Metro.
- **Pros**: Single database technology.
- **Cons**: Fragile browser-dependent OPFS storage; cannot support multi-device sync or web sharing.
- **Effort**: Medium

## Recommendation
Adopt **Approach 1 (Hybrid Local-First Architecture)** split into two sequential phases:
1. **Phase 1 (Web Supabase Foundation)**: Deploy Supabase Postgres schema with RLS, configure anonymous auth, build cached `SupabaseLedgerRepository`, and point the web app directly to Supabase for frictionless local web development.
2. **Phase 2 (Mobile Cloud Sync)**: Build background replication from native `expo-sqlite` to Supabase for multi-device sync.

## Risks
1. **Data Divergence**: Schema differences between SQLite DDL (integer cents, text ISO dates) and Postgres (bigint cents, timestamptz). *Mitigation*: Mirror column types strictly (use `bigint` for cents, `text` for UUIDs and ISO timestamps).
2. **Optimistic Rollback on Network Failure**: An async write to Supabase might fail while the UI already updated its optimistic in-memory cache. *Mitigation*: Implement snapshot revert and error toast notifications on failed Supabase mutations.
3. **RLS Authorization Leaks**: Without strict RLS, queries could leak ledger rows across users. *Mitigation*: Enforce `user_id = auth.uid()` on all table policies and verify in integration tests.

## Ready for Proposal
**Yes**. The architectural direction, data flow, and scope are fully clarified. Next step is opening an OpenSpec change proposal: `openspec/changes/web-supabase-integration/proposal.md`.
