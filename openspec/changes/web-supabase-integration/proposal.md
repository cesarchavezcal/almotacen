# Proposal: Web Supabase Integration (Phase 1)

## Problem Statement
Running Almotacen locally on the web fails due to browser Web Worker and Origin Private File System (OPFS) constraints in `expo-sqlite`. Synchronous initialization on cold start leads to `Sync operation timeout` errors, while web data remains trapped inside single browser storage instances without cloud synchronization or multi-device support.

## Proposed Solution
Introduce a hybrid local-first storage architecture:
1. **Web Platform**: Use remote Supabase Postgres as the primary data store. Implement an optimistic in-memory caching repository (`SupabaseLedgerRepository`) adhering to `LedgerRepository`, delivering zero-latency synchronous reads for `useSyncExternalStore` and background asynchronous Postgres persistence.
2. **Mobile Platform**: Retain embedded SQLite (`expo-sqlite`) as the primary offline storage engine, unmodified.
3. **Authentication**: Automatically initialize an anonymous Supabase user session (`signInAnonymously()`) on web launch, securing financial data under Row Level Security (RLS) policies.
4. **Declarative Schema**: Deploy a Postgres migration script mirroring SQLite schema version 2 (`metadata`, `accounts`, `category_groups`, `categories`, `transactions`), with monetary values stored strictly in integer cents (`bigint`).

## Success Criteria
- [ ] Running `npx expo start --web` boots and renders the full budgeting UI without `expo-sqlite` worker timeouts or crashes.
- [ ] All ledger operations (inflows, outflows, transfers, envelope allocations, entity CRUD) execute and persist to Supabase Postgres.
- [ ] Row Level Security ensures users can only read and write their own ledger rows.
- [ ] Automated test suite passes (`./init.sh` green pass with 0 typecheck errors and 100% test pass rate).
- [ ] Mobile native codebase remains fully functional and isolated on embedded SQLite.
