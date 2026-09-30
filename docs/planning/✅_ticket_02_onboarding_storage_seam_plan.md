# Implementation Plan: Ticket 02 — Platform-Agnostic Onboarding Storage Seam

## Executive Summary
This plan details the implementation of Ticket 02 (`ALM-026`), binding to behavioral scenarios `SCEN-010` (Web Onboarding Commitment & Hydration) and `SCEN-011` (Explore Demo via Repository Seam). It decouples `useOnboardingWizard` from raw SQLite `getDatabase()`, elevating `commitOnboardingConfig` to the unified `LedgerRepository` interface. This eliminates the Web startup crash and enables seamless onboarding and demo exploration on Web with Supabase.

---

## 1. Architectural Changes & Interfaces

### 1.1 `LedgerRepository` Interface Extension (`src/storage/types.ts`)
Add the onboarding commitment contract to `LedgerRepository`:
```ts
import { ValidatedOnboardingConfig } from '../domain/onboarding/types';

export interface LedgerRepository {
  // ... existing methods
  isOnboardingCompleted(): boolean;
  commitOnboardingConfig(config: ValidatedOnboardingConfig): void;
}
```

### 1.2 `SQLiteLedgerRepository` Implementation (`src/storage/ledgerRepository.ts`)
Implement `commitOnboardingConfig(config: ValidatedOnboardingConfig): void`:
- Delegates to `SQLiteOnboardingRepository` (or executes the SQLite transaction using `this.db.withTransactionSync`).
- Persists primary checking account, optional credit card account and category, archetype category groups, allocated categories, and metadata keys (`ready_to_assign_cents`, `onboarding_completed: true`).

### 1.3 `SupabaseLedgerRepository` Implementation (`src/storage/supabase/supabaseLedgerRepository.ts`)
Implement `commitOnboardingConfig(config: ValidatedOnboardingConfig): void`:
- Uses `this.executeOptimisticMutation`:
  - **Synchronous Computation (`computeNextState`)**:
    - Instantiates depository account with `startingBalanceCents`.
    - If credit card present: instantiates credit account (`balance = -debt`), ensures `'grp-payments'` group, and instantiates `'cat-cc-payment'` category with `unfundedDebtCents = debt`.
    - Instantiates archetype category groups and categories with `assignedCents = allocation` and `availableCents = allocation`.
    - Sets `readyToAssignCents = remainingReadyToAssignCents`.
    - Sets `onboardingCompleted = true`.
    - Returns `{ newState, newGroups, result: undefined }`.
  - **Asynchronous Persistence (`persistMutation(userId)`)**:
    - Dispatches batch inserts/upserts:
      - `this.client.from('category_groups').insert(groupRows).throwOnError()`
      - `this.client.from('accounts').insert(accountRows).throwOnError()`
      - `this.client.from('categories').insert(categoryRows).throwOnError()`
      - `this.client.from('metadata').upsert([...metadataRows]).throwOnError()`

### 1.4 Controller Refactoring (`src/hooks/useOnboardingWizard.ts`)
- Refactor `useOnboardingWizard(customTarget?: LedgerRepository | DatabaseAdapter)`:
  - If `customTarget` is provided:
    - If it implements `commitOnboardingConfig`, use it as `repo`.
    - If it is a `DatabaseAdapter`, wrap via `new SQLiteLedgerRepository(customTarget)`.
  - Defaults to `getRepository()`.
- Refactor `executeCommitOnboarding(target: LedgerRepository | DatabaseAdapter, ...)`:
  - Validates inputs.
  - Constructs `ValidatedOnboardingConfig`.
  - Invokes `repo.commitOnboardingConfig(config)`.
- Refactor `executeExploreDemo(target: LedgerRepository | DatabaseAdapter, ...)`:
  - Invokes `repo.seedDemoData()`.
  - Dispatches success haptics and navigates to `/(tabs)`.

### 1.5 Container Update (`app/onboarding.tsx`)
- Update `OnboardingScreenProps` to support `testRepo?: LedgerRepository` alongside `testDb?: DatabaseAdapter`.
- Pass to `useOnboardingWizard(testRepo ?? testDb)`.

---

## 2. Red ➔ Green ➔ Refactor TDD Plan

### 2.1 Red Phase (Author Failing Behavioral Tests First)
1. **`src/storage/__tests__/onboardingSeam.test.ts`**:
   - `SCEN-010`: Test `commitOnboardingConfig` on `SupabaseLedgerRepository` using a mocked Supabase client. Verify:
     - In-memory `BudgetState` updates immediately with accounts, categories, and zero Ready to Assign.
     - `repo.isOnboardingCompleted()` returns `true`.
     - Remote batch queries are dispatched to `accounts`, `category_groups`, `categories`, `metadata`.
   - `SCEN-011`: Test `seedDemoData` on `SupabaseLedgerRepository`. Verify in-memory state loads default seed accounts/categories and sets `isOnboardingCompleted() === true`.
2. **`src/hooks/__tests__/useOnboardingWizard.test.ts`**:
   - Test `useOnboardingWizard` initialized without arguments on web platform mock.
   - Verify it does NOT call `getDatabase()` or throw `DatabaseInitializationError`.

### 2.2 Green Phase (Implement Production Code)
1. Update `src/storage/types.ts` with `commitOnboardingConfig` signature.
2. Implement in `src/storage/ledgerRepository.ts`.
3. Implement in `src/storage/supabase/supabaseLedgerRepository.ts`.
4. Refactor `src/hooks/useOnboardingWizard.ts` and `app/onboarding.tsx`.
5. Run tests until new and existing test suites pass.

### 2.3 Refactor & Verification Phase
1. Eliminate dead imports and verify clean TypeScript type safety (`npm run typecheck`).
2. Run `./init.sh` to ensure all 30+ test suites pass with 0 failures.
3. Verify `tasks.md` and `progress.md` updates.
