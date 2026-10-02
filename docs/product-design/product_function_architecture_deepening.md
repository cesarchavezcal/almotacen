# Product Function: Codebase Architecture Deepening (`product_function_architecture_deepening.md`)

Evaluation and scoping model based on Ryan Singer's $y = f(x)$ methodology.

---

## 1. Input Situation ($x$)

The `almotacen` mobile and web codebase implements a dual zero-based budgeting and cashflow tracking model. As multi-platform support (SQLite on native, Supabase on web) was introduced, four primary architectural friction areas emerged:
1. **Scattered Entity Assertions**: Entity operations (account deletion, category group deletion, payment category pruning) are split into six shallow assertion functions in `entityOperations.ts`. Callers (`SQLiteLedgerRepository` and `SupabaseLedgerRepository`) must independently coordinate 9 sequential queries and cascading deletions, duplicating ~250 lines of complex orchestration logic across both storage engines.
2. **25-Method Monolithic Repository**: `LedgerRepository` couples transaction posting, envelope budgeting, entity catalog CRUD, onboarding state, and database maintenance into a single interface. `useLedgerStore.ts` wraps all 25 methods in 1:1 `useCallback` boilerplate, and `SupabaseLedgerRepository` requires 1,698 lines of optimistic caching to maintain synchronous compatibility.
3. **Orphaned Onboarding Seam & Leaky Guard Hook**: `SQLiteOnboardingRepository` is a single-method class instantiated solely as a pass-through by `SQLiteLedgerRepository`, while `useOnboardingGuard` leaks raw SQLite `DatabaseAdapter` instances directly into React hooks.
4. **Leaking Expense Capture Controller**: `modal.tsx` spans 601 lines, manually coordinating currency string parsing, live overspending deficit calculation, smart payee auto-selection, haptics, and a 19-prop presentational view.

---

## 2. Output Situation ($y$)

A hardened, highly testable codebase architecture featuring deep modules, clean seams, and high caller leverage:
1. **Atomic Entity Manager**: A cohesive `EntityManager` domain module encapsulates all entity lifecycle invariants, referential integrity guards, and cascading payment category cleanups behind a single interface. Both SQLite and Supabase adapters execute pre-computed mutation plans with zero duplicated query orchestration.
2. **Partitioned Storage Ports**: `LedgerRepository` is decomposed into focused domain ports (`LedgerTransactionsPort`, `EntityCatalogPort`, `LedgerAdminPort`). `useLedgerStore` eliminates 18 shallow pass-through callbacks while preserving backward compatibility for screens.
3. **Unified Onboarding Storage Seam**: Onboarding config persistence is absorbed directly into the primary ledger storage engine. `SQLiteOnboardingRepository` is deleted, and `useOnboardingGuard` checks onboarding state strictly through the storage seam without importing or inspecting `DatabaseAdapter`.
4. **Encapsulated Point-of-Sale Expense Intake**: A dedicated `ExpenseIntake` domain module handles currency parsing, live balance impact evaluation, payee auto-completion, and atomic submission. `modal.tsx` shrinks to pure presentation (< 150 lines).

---

## 3. The Transformation Function $f(x) \rightarrow y$

$$\text{ArchitectureDeepening}(x) \rightarrow y$$

```text
[Input Friction x]
  ├── Scattered entity assertions & 9-step query duplication
  ├── 25-method monolithic LedgerRepository & 18 shallow callbacks
  ├── Orphaned SQLiteOnboardingRepository & DatabaseAdapter leaking into React
  └── 601-line modal.tsx orchestrating parsing, live math, and 19 props
          │
          ▼  [Transformation f(x)]
  1. Extract deep EntityManager producing atomic EntityMutationPlan
  2. Segregate storage ports (Transactions, Catalog, Admin) & streamline store
  3. Absorb onboarding persistence into primary repository & clean guard hook
  4. Encapsulate expense intake domain logic into dedicated ExpenseIntake module
          │
          ▼  [Output State y]
  High Locality: Invariants concentrate in domain engines
  High Leverage: Callers invoke small, atomic interfaces
  Air-tight Seams: Storage details never leak into UI/hooks
  Robust Multi-Platform: SQLite and Supabase share identical domain contracts
```

---

## 4. 10x Scope-Stripping (YAGNI & Boundary Guards)

- **Out of Scope (Stripped)**:
  - Rewriting Supabase from synchronous caching to fully asynchronous state management across the UI. (Supabase caching works reliably; we only decouple the repository port definition).
  - Redesigning UI visuals, theme tokens, or screen navigation flows.
  - Adding new financial features or multi-currency conversions.
  - Merging `app/(tabs)/` screens into single files.
- **In Scope (Retained)**:
  - Deepening `EntityManager` to eliminate multi-step caller orchestration.
  - Port segregation on `LedgerRepository` and boilerplate reduction in `useLedgerStore`.
  - Deleting `SQLiteOnboardingRepository` and purging `DatabaseAdapter` from `useOnboardingGuard`.
  - Extracting `ExpenseIntake` module and slimming down `modal.tsx`.
