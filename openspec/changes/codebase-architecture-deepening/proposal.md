# Proposal: Codebase Architecture Deepening

## 1. Problem Statement

Following the multi-platform expansion (SQLite on native, Supabase on web), the codebase exhibits friction across four key seams:
1. **Scattered Entity Assertions & 9-Step Caller Duplication**: `entityOperations.ts` exports 6 micro-assertions instead of an operations engine. Both `SQLiteLedgerRepository` and `SupabaseLedgerRepository` independently implement and duplicate 9 sequential query hops for entity deletion, cascading payment category cleanup, and referential integrity checks.
2. **25-Method Monolithic Storage Seam**: `LedgerRepository` bundles 25 methods across transactions, envelope budgeting, entity catalog management, and database diagnostics into one interface. `useLedgerStore.ts` mirrors all 25 methods via 1:1 `useCallback` boilerplate, and `SupabaseLedgerRepository` requires 1,698 lines of optimistic caching to maintain sync compatibility.
3. **Orphaned Onboarding Seam & Leaky Guard Hook**: `SQLiteOnboardingRepository` is a single-method class instantiated solely as a pass-through by `SQLiteLedgerRepository`, while `useOnboardingGuard` leaks raw SQLite `DatabaseAdapter` type checks directly into React hooks.
4. **Leaking Expense Capture Controller**: `modal.tsx` spans 601 lines, manually coordinating currency string parsing, live overspending deficit calculation, smart payee auto-selection, haptics, and a 19-prop presentational view.

---

## 2. Proposed Solution

Deepen the architecture across the 4 identified areas using the `/codebase-design` principles:
1. **Atomic Entity Manager**: Consolidate entity validation, transaction count assertions, and cascading envelope cleanups behind a deep `EntityManager` domain module. Callers pass the command and current state; `EntityManager` returns a pre-computed `EntityMutationPlan` that both SQLite and Supabase adapters execute atomically.
2. **Segregated Storage Ports**: Decompose `LedgerRepository` into cohesive domain ports (`LedgerTransactionsPort`, `EntityCatalogPort`, `LedgerAdminPort`). In `useLedgerStore`, delete 18 shallow pass-through callbacks and expose cohesive domain action dispatchers while preserving backwards compatibility for existing screens.
3. **Unified Onboarding Storage Seam**: Absorb onboarding configuration persistence directly into the primary ledger storage module. Delete `SQLiteOnboardingRepository`. Clean up `useOnboardingGuard` so it checks onboarding state strictly through the repository interface without importing or inspecting `DatabaseAdapter`.
4. **Encapsulated Point-of-Sale Expense Intake**: Extract a dedicated `ExpenseIntake` module and `useExpenseIntake` hook encapsulating currency parsing, live balance impact evaluation, payee auto-completion, and atomic submission. Shrink `modal.tsx` to pure presentation (< 150 lines).

---

## 3. Success Criteria

- [ ] `EntityManager` encapsulates all entity deletion and validation rules, eliminating duplicated 9-step orchestration from `SQLiteLedgerRepository` and `SupabaseLedgerRepository`.
- [ ] `LedgerRepository` is segregated into focused ports, eliminating 18 shallow wrappers from `useLedgerStore.ts`.
- [ ] `SQLiteOnboardingRepository` is deleted; `useOnboardingGuard` has zero imports or dependencies on `DatabaseAdapter`.
- [ ] `modal.tsx` drops below 150 lines with zero domain math or currency parsing logic inside the React component.
- [ ] 100% test pass rate on `./init.sh` with zero TypeScript errors or lint regressions.
