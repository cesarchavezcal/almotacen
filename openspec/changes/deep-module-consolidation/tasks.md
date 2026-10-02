# Implementation Tasks: Deep Module Consolidation

This change is partitioned into 5 discrete, atomic tickets bound to behavioral scenarios in `spec-tests.md`.

---

## Ticket Overview

| Ticket | Title | Bound Scenarios | Primary Deliverable |
|---|---|---|---|
| **01** | Delete `entityOperations.ts` Pass-Through | `SCEN-018` | Delete `src/domain/ledger/entityOperations.ts` + verify `EntityManager` imports |
| **02** | Remove Dead Port Hooks from Store | `SCEN-019` | Delete `useLedgerTransactions`, `useEntityCatalog`, `useLedgerAdmin` from `useLedgerStore.ts` |
| **03** | Consolidate Storage Ports into Unified Repository Seam | `SCEN-020` | Inline `ports/*` into `src/storage/types.ts` + remove `src/storage/ports/` directory |
| **04** | Remove Onboarding Service Wrapper & Legacy Port | `SCEN-021` | Remove `commitOnboardingConfig` wrapper and `OnboardingRepository` port from `onboardingService.ts` |
| **05** | Remove Dead `AppleCardFace.tsx` Component | `SCEN-022` | Delete `AppleCardFace.tsx` + update barrel & accessibility tests |

---

## Tasks Breakdown

### [Ticket 01: Delete entityOperations.ts Pass-Through](./tickets/01-delete-entity-operations.md)
- [x] Confirm no external imports of `src/domain/ledger/entityOperations.ts`.
- [x] Remove `src/domain/ledger/entityOperations.ts`.
- [x] Run `./init.sh` to verify zero compilation or test breakages.

### [Ticket 02: Remove Dead Port Hooks from Store](./tickets/02-remove-dead-port-hooks.md)
- [ ] Remove `useLedgerTransactions()`, `useEntityCatalog()`, and `useLedgerAdmin()` from `src/storage/useLedgerStore.ts`.
- [ ] Clean up unused port type imports in `src/storage/useLedgerStore.ts`.
- [ ] Verify `./init.sh` green pass.

### [Ticket 03: Consolidate Storage Ports into Unified Repository Seam](./tickets/03-consolidate-storage-ports.md)
- [ ] Merge methods from `ports/ledgerTransactionsPort.ts`, `ports/entityCatalogPort.ts`, and `ports/ledgerAdminPort.ts` directly into `LedgerRepository` in `src/storage/types.ts`.
- [ ] Delete `src/storage/ports/` directory.
- [ ] Update `src/storage/__tests__/portSegregation.test.ts` to `src/storage/__tests__/repositoryContract.test.ts` testing `LedgerRepository`.
- [ ] Verify `./init.sh` green pass across all SQLite and Supabase tests.

### [Ticket 04: Remove Onboarding Service Wrapper & Legacy Port](./tickets/04-remove-onboarding-wrapper.md)
- [ ] Remove `commitOnboardingConfig` function from `src/domain/onboarding/onboardingService.ts`.
- [ ] Remove `OnboardingRepository` interface from `src/domain/onboarding/types.ts`.
- [ ] Update `src/domain/onboarding/__tests__/onboardingService.test.ts` to assert `validateOnboardingConfig` directly.
- [ ] Verify `./init.sh` green pass.

### [Ticket 05: Remove Dead AppleCardFace.tsx Component](./tickets/05-remove-apple-card-face.md)
- [ ] Remove `src/components/AppleCardFace.tsx`.
- [ ] Remove `AppleCardFace` export from `src/components/index.ts`.
- [ ] Update `src/components/__tests__/FinancialCardsAccessibility.test.tsx` to assert `CreditCardFace` screen reader output.
- [ ] Verify `./init.sh` 100% green pass.
