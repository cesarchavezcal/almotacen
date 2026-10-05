# Proposal: Deep Module Consolidation & Shallow Pass-Through Cleanup

## 1. Context & Motivation
Following a codebase design audit using John Ousterhout's *Philosophy of Software Design* and Michael Feathers' seam concepts, we identified five areas where the codebase introduced shallow modules, speculative interfaces, or dead pass-throughs:
1. `src/domain/ledger/entityOperations.ts`: A 9-line empty re-export with 0 callers.
2. `src/storage/useLedgerStore.ts`: Three dummy 1-line hook wrappers (`useLedgerTransactions`, `useEntityCatalog`, `useLedgerAdmin`) with 0 callers in UI screens.
3. `src/storage/ports/`: Four files splitting `LedgerRepository` into 3 sub-interfaces that no consumer ever imports or uses in isolation.
4. `src/domain/onboarding/onboardingService.ts`: A legacy `commitOnboardingConfig` pass-through wrapper and `OnboardingRepository` port that duplicates the canonical `LedgerRepository.commitOnboardingConfig` seam.
5. `src/components/AppleCardFace.tsx`: A 136-line hardcoded mockup component never rendered in the application, overshadowed by the reusable, dynamic `CreditCardFace.tsx`.

Applying the **Deletion Test** (*"Imagine deleting the module: if complexity vanishes, it was a pass-through; if complexity reappears across callers, it was earning its keep"*), removing these pass-throughs eliminates unnecessary cognitive overhead, reduces file sprawl, and deepens the remaining core modules.

## 2. Proposed Changes
- **Ticket 01**: Delete `src/domain/ledger/entityOperations.ts` and verify all entity management operations route through `EntityManager` directly.
- **Ticket 02**: Delete unused port hooks (`useLedgerTransactions`, `useEntityCatalog`, `useLedgerAdmin`) from `src/storage/useLedgerStore.ts`.
- **Ticket 03**: Consolidate `src/storage/ports/*` directly into `src/storage/types.ts` (`LedgerRepository` as the single canonical seam), remove the `ports/` directory, and update `portSegregation.test.ts` into a unified `repositoryContract.test.ts`.
- **Ticket 04**: Remove `commitOnboardingConfig` wrapper and `OnboardingRepository` interface from `src/domain/onboarding/`, retaining `validateOnboardingConfig` as the pure domain validator and `LedgerRepository.commitOnboardingConfig` as the persistence seam.
- **Ticket 05**: Remove `src/components/AppleCardFace.tsx`, update `src/components/index.ts` and `FinancialCardsAccessibility.test.tsx` to assert `CreditCardFace.tsx`.

## 3. Impact & Risk Assessment
- **Breaking Changes**: Zero. No external consumer or active screen imports any of these 5 deleted components/wrappers.
- **Verification Guarantee**: 100% test pass rate across all 35 test suites via `./init.sh`.
