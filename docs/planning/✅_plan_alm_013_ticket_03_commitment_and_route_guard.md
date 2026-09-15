# Implementation Plan: Ticket 03 - Onboarding Commitment Service & Route Guard

**Ticket Reference**: `ALM-013` (Ticket 03 of User Onboarding)  
**Bound Scenarios**: `SCEN-047`, `SCEN-048`, `SCEN-051`  
**Target Branch**: `feature/CCH/ALM-013-user-onboarding-wizard`

---

## 1. Context & Motivation

Ticket 01 decoupled clean database initialization from demo data, and Ticket 02 delivered the financial archetype presets and allocation math. 

**Ticket 03** bridges the domain configuration to SQLite persistence and enforces the first-run user experience:
1. **Onboarding Commitment Service**: Atomically persists user-configured accounts, categories, envelope allocations, and starting cash into SQLite, setting `metadata.onboarding_completed = 'true'`.
2. **First-Run Route Guard**: Intercepts app launch in [`app/_layout.tsx`](file:///Users/cesaradalbertochavezcalderon/orca/workspaces/almotacen/oystercatcher/app/_layout.tsx). If onboarding is incomplete, it routes the user to `/onboarding`.

---

## 2. Behavioral Contracts

- **`SCEN-047` & `SCEN-048` (Account Creation & Transactional Commitment)**:
  - `commitOnboardingConfig(db, params)` executes atomically inside `db.withTransactionSync`:
    - **Primary Depository Account (Required)**:
      - Creates checking account with user's chosen name (default "Primary Checking") and starting balance in integer cents.
    - **Credit Card Account (Optional)**:
      - When provided, creates credit account with starting debt (negative balance in integer cents).
      - Automatically creates "Credit Card Payments" category group and linked payment envelope (`is_credit_payment = 1`, `credit_payment_category_id`).
      - Flags initial debt as unfunded debt (`unfunded_debt_cents = startingDebtCents`) unless cash was explicitly allocated to it.
    - **Category Envelopes**:
      - Inserts category groups and categories with target settings and initial allocations (`assignedCents`, `availableCents`).
    - **Ready to Assign & Completion**:
      - Updates `metadata.ready_to_assign_cents` with remaining unallocated cash.
      - Sets `metadata.onboarding_completed = 'true'`.
    - **Validation & Invariants**:
      - Validates non-empty names, non-negative checking balance, non-negative remaining cash.
      - Enforces zero-based budgeting cash invariant: $\sum \text{allocatedCents} + \text{remainingReadyToAssignCents} = \text{depositoryStartingBalanceCents}$.
      - Throws domain-specific error (`OnboardingValidationError`) on invalid input.

- **`SCEN-051` (First-Run Navigation Intercept & Route Guard)**:
  - App root layout checks `isOnboardingCompleted(db)` on initial mount.
  - When `isOnboardingCompleted(db) === false`:
    - Redirects navigation stack to `/onboarding`.
    - Prevents dashboard flashing or accidental entry to `/(tabs)`.
  - When `isOnboardingCompleted(db) === true`:
    - Permits normal navigation to `/(tabs)`.
  - Placeholder route `app/onboarding.tsx` created so the router target resolves cleanly ahead of Ticket 04's full UI implementation.

---

## 3. Proposed Module Design

### Commitment Service (`src/domain/onboarding/onboardingService.ts`)
```typescript
import { DatabaseAdapter } from '../../storage/types';
import { ArchetypeTemplate } from './types';

export class OnboardingValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OnboardingValidationError';
  }
}

export interface DepositoryAccountInput {
  name: string;
  startingBalanceCents: number;
}

export interface CreditCardAccountInput {
  name: string;
  startingDebtCents: number;
}

export interface CommitOnboardingConfigParams {
  depositoryAccount: DepositoryAccountInput;
  creditCardAccount?: CreditCardAccountInput;
  template: ArchetypeTemplate;
  allocations: Record<string, number>;
  remainingReadyToAssignCents: number;
}

export function commitOnboardingConfig(
  db: DatabaseAdapter,
  params: CommitOnboardingConfigParams
): void;
```

### Route Guard Hook (`src/hooks/useOnboardingGuard.ts`)
```typescript
export interface OnboardingGuardState {
  isOnboardingCompleted: boolean | null; // null while loading
  isLoading: boolean;
}

export function useOnboardingGuard(db?: DatabaseAdapter): OnboardingGuardState;
```

### App Layout Navigation Guard (`app/_layout.tsx`)
- Reads onboarding status via `useOnboardingGuard`.
- In `RootLayoutNav`:
  - Registers `<Stack.Screen name="onboarding" options={{ headerShown: false }} />`.
  - If `isOnboardingCompleted === false`, performs `router.replace('/onboarding')`.

### Placeholder Screen (`app/onboarding.tsx`)
- Minimal accessible screen component confirming route resolution.

---

## 4. Execution Plan (TDD First)

1. **RED**:
   - Create `src/domain/onboarding/__tests__/onboardingService.test.ts` testing:
     - Full atomic commitment with depository account only (`SCEN-048`).
     - Full atomic commitment with depository + credit card account (`SCEN-048`).
     - Cash preservation invariant check ($\sum \text{assigned} + \text{RTA} = \text{cash}$).
     - Transaction rollback on failure.
     - `isOnboardingCompleted(db)` flipping from `false` to `true`.
   - Create `src/hooks/__tests__/useOnboardingGuard.test.ts` verifying status checking and fallback behavior.
2. **GREEN**:
   - Implement `src/domain/onboarding/onboardingService.ts`.
   - Implement `src/hooks/useOnboardingGuard.ts`.
   - Add placeholder `app/onboarding.tsx` and integrate guard in `app/_layout.tsx`.
3. **REFACTOR / VERIFY**:
   - Run `npm test` across all test suites.
   - Run `npm run typecheck` (`tsc --noEmit`).
   - Run `./init.sh` for harness verification.

---

## 5. Verification Checklist

- [ ] `commitOnboardingConfig` creates primary checking account and updates ledger balances.
- [ ] Optional credit card creates credit account, debt category, and links payment group.
- [ ] Zero-based cash invariant strictly enforced ($\sum \text{allocations} + \text{RTA} = \text{startingCash}$).
- [ ] `metadata.onboarding_completed` updated to `'true'`.
- [ ] Navigation intercept routes uncompleted sessions to `/onboarding`.
- [ ] All 20+ test suites pass cleanly with 0 typecheck errors.
