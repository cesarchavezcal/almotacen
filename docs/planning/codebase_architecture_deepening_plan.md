# Implementation Plan: Codebase Architecture Deepening

Deepens shallow modules, segregates monolithic storage ports, and consolidates multi-step query orchestration into cohesive domain engines across native SQLite and web Supabase.

---

## 1. Overview & Objectives

Following the 4 deepening recommendations from our architecture review:
1. **`EntityManager` Domain Module**: Replace 6 micro-assertion functions in `entityOperations.ts` with a deep `EntityManager` domain engine, eliminating 9-step query orchestration from `SQLiteLedgerRepository` and `SupabaseLedgerRepository`.
2. **Storage Port Segregation**: Decompose the 25-method `LedgerRepository` into `LedgerTransactionsPort`, `EntityCatalogPort`, and `LedgerAdminPort`, eliminating 18 shallow pass-through callbacks in `useLedgerStore.ts`.
3. **Onboarding Seam Consolidation**: Absorb `SQLiteOnboardingRepository` directly into the SQLite repository, delete `onboardingRepository.ts`, and decouple `useOnboardingGuard.ts` from `DatabaseAdapter`.
4. **Encapsulated Point-of-Sale Expense Intake**: Author a deep `ExpenseIntake` module and `useExpenseIntake` hook, reducing `app/modal.tsx` from 601 lines to < 150 lines.

---

## 2. Proposed Changes & Touchpoints

### Domain Layer (`src/domain/ledger/`)
- `src/domain/ledger/entityManager.ts` (New): Unified entity lifecycle engine evaluating referential integrity and outputting `EntityMutationPlan`.
- `src/domain/ledger/entityManager.test.ts` (New): Pure behavioral tests for `SCEN-060`, `SCEN-061`, and `SCEN-062`.
- `src/domain/ledger/expenseIntake.ts` (New): Domain logic for currency input parsing, live deficit impact preview, and payee auto-matching.
- `src/domain/ledger/expenseIntake.test.ts` (New): Pure unit tests for `SCEN-065`, `SCEN-066`, and `SCEN-067`.
- `src/domain/ledger/entityOperations.ts`: Re-export or deprecate superseded micro-assertions.

### Storage Seam & Adapters (`src/storage/`)
- `src/storage/ports/` (New):
  - `ledgerTransactionsPort.ts`: Outflow, inflow, allocation, payment, rollover, auto-assign.
  - `entityCatalogPort.ts`: Accounts, category groups, categories CRUD.
  - `ledgerAdminPort.ts`: Diagnostics, resets, seed data, onboarding commit.
- `src/storage/types.ts`: Update `LedgerRepository` to compose the segregated ports.
- `src/storage/ledgerRepository.ts`: Consume `EntityManager` for entity CRUD; absorb `onboardingRepository.ts` SQL logic.
- `src/storage/supabase/supabaseLedgerRepository.ts`: Consume `EntityManager` for entity CRUD mutations.
- `src/storage/onboardingRepository.ts`: **Deleted** (orphaned wrapper eliminated).
- `src/storage/useLedgerStore.ts`: Eliminate 18 redundant `useCallback` forwarders; dispatch cleanly via memoized repository reference.

### Hooks & UI Layer (`src/hooks/`, `app/`)
- `src/hooks/useExpenseIntake.ts` (New): Hook integrating draft state, live impact preview, and submission.
- `src/hooks/useOnboardingGuard.ts`: Remove `DatabaseAdapter` parameter; query `repo.isOnboardingCompleted()`.
- `app/modal.tsx`: Refactor to consume `useExpenseIntake()`, slimming file to pure presentation (< 150 lines).
- `app/_layout.tsx`: Call `useOnboardingGuard()` without passing `db`.

---

## 3. Atomic Ticket Slices

| Ticket | Scope | Scenarios | Deliverable |
|---|---|---|---|
| **01** | `EntityManager` Domain Module | `SCEN-060`, `SCEN-061`, `SCEN-062` | Deep entity engine + eliminate 9-step orchestration in both repos |
| **02** | Storage Port Segregation | `SCEN-063` | Segregated ports + delete 18 shallow callbacks in `useLedgerStore` |
| **03** | Onboarding Seam Consolidation | `SCEN-064` | Absorb `SQLiteOnboardingRepository` + remove `DatabaseAdapter` from guard |
| **04** | Expense Intake Module | `SCEN-065`, `SCEN-066`, `SCEN-067` | Deep `ExpenseIntake` module + slim `app/modal.tsx` to < 150 lines |
| **05** | Verification & ADR | `SCEN-060`..`SCEN-067` | `./init.sh` green pass + record ADR-002 in `MEMORY.md` |

---

## 4. Verification Plan

1. **Automated Unit & Seam Tests**:
   - `npx jest src/domain/ledger/entityManager.test.ts`
   - `npx jest src/domain/ledger/expenseIntake.test.ts`
   - `npx jest src/storage/__tests__/`
   - `npx jest src/hooks/__tests__/`
2. **Whole Repository Health**:
   - `./init.sh` with `set -e`: zero TypeScript errors and 100% test pass rate across all suites.
3. **Manual / Interactive Verification**:
   - Verify Quick Expense modal opens, previews deficit accurately, auto-fills payee suggestions, and logs outflow.
   - Verify Settings accounts/categories views delete empty entities and block non-empty/protected entities with clear alerts.
