# Implementation Plan: Deep Module Consolidation (Tickets 02 - 05)

## Overview & Scope
This plan details the phased execution of the remaining 4 tickets for the `deep-module-consolidation` (ALM-030) architecture change.
Following Ticket 01's successful merge, we eliminate shallow pass-throughs, dead hook wrappers, speculative port slicing, and unused mockup components to establish deep, cohesive modules.

---

## Ticket Breakdown

### Ticket 02: Remove Dead Port Hooks from Store
- **Bound Scenario**: `SCEN-019`
- **Target Files**:
  - `src/storage/useLedgerStore.ts`
- **Implementation Status**: Completed.
  - Removed exported dead port hooks `useLedgerTransactions`, `useEntityCatalog`, `useLedgerAdmin`.
  - Removed unused port imports from `useLedgerStore.ts`.

---

### Ticket 03: Consolidate Storage Ports into Unified Repository Seam
- **Bound Scenario**: `SCEN-020`
- **Target Files**:
  - `src/storage/types.ts`
  - `src/storage/ports/` (Deleted)
  - `src/storage/__tests__/repositoryContract.test.ts`
- **Implementation Status**: Completed.
  - Consolidated method declarations directly into `LedgerRepository` in `src/storage/types.ts`.
  - Deleted `src/storage/ports/` directory.
  - Created `src/storage/__tests__/repositoryContract.test.ts` asserting against `LedgerRepository`.

---

### Ticket 04: Remove Onboarding Service Wrapper & Legacy Port
- **Bound Scenario**: `SCEN-021`
- **Target Files**:
  - `src/domain/onboarding/onboardingService.ts`
  - `src/domain/onboarding/types.ts`
  - `src/domain/onboarding/__tests__/onboardingService.test.ts`
- **Implementation Status**: Completed.
  - Removed `commitOnboardingConfig` pass-through from `src/domain/onboarding/onboardingService.ts`.
  - Removed `OnboardingRepository` interface from `src/domain/onboarding/types.ts`.
  - Updated `src/domain/onboarding/__tests__/onboardingService.test.ts` to test pure domain validator `validateOnboardingConfig` directly.

---

### Ticket 05: Remove Dead AppleCardFace.tsx Component
- **Bound Scenario**: `SCEN-022`
- **Target Files**:
  - `src/components/AppleCardFace.tsx` (Deleted)
  - `src/components/index.ts`
  - `src/components/__tests__/FinancialCardsAccessibility.test.tsx`
  - `openspec/specs/design-system/spec.md`
- **Implementation Status**: Completed.
  - Deleted `src/components/AppleCardFace.tsx`.
  - Removed `AppleCardFace` export from `src/components/index.ts`.
  - Updated `src/components/__tests__/FinancialCardsAccessibility.test.tsx` to assert `CreditCardFace` screen reader output.
  - Updated `openspec/specs/design-system/spec.md` to reference `CreditCardFace` as canonical.

---

## Verification & Safety Invariants
1. **Zero Test Regressions**: All 38 test suites and 309 tests pass cleanly via `./init.sh`.
2. **Strict Seam Cohesion**: Unified `LedgerRepository` provides complete CRUD and lifecycle capabilities without port fragmentation.
3. **Conventional Commits & Git Identity**: Author `cesarchavezcal`, conventional commit messages, zero AI attribution.
