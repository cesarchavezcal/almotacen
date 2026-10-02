# Behavioral Test Contracts: Deep Module Consolidation

This document defines acceptance criteria for eliminating shallow modules, speculative interfaces, and dead pass-throughs from the codebase.

---

### `SCEN-018`: Direct Entity Manager Authority (Deletion of `entityOperations.ts`)
- **Given** domain ledger repositories and entity operation callers
- **When** entity mutations, deletions, and creations are planned
- **Then** callers import and invoke `EntityManager` directly from `src/domain/ledger/entityManager.ts`
- **And** no references to `src/domain/ledger/entityOperations.ts` exist in the repository.

### `SCEN-019`: Lean Reactive Store Surface (Deletion of Port Hooks)
- **Given** UI components and hooks consuming reactive ledger state
- **When** transactions, catalog data, or administration functions are performed
- **Then** components consume `useLedgerStore()` or `getRepository()`
- **And** `useLedgerStore.ts` exposes no redundant `useLedgerTransactions()`, `useEntityCatalog()`, or `useLedgerAdmin()` wrappers.

### `SCEN-020`: Unified Repository Seam (Consolidation of `src/storage/ports/*`)
- **Given** `SQLiteLedgerRepository` and `SupabaseLedgerRepository` adapters
- **When** storage capabilities are inspected or implemented
- **Then** `LedgerRepository` in `src/storage/types.ts` directly defines all transaction, catalog, and admin method contracts
- **And** the legacy `src/storage/ports/` directory is removed with zero import breakage.

### `SCEN-021`: Focused Onboarding Domain Validator (Deletion of Middleman Wrapper)
- **Given** user onboarding input parameters
- **When** onboarding inputs are validated and committed
- **Then** `validateOnboardingConfig` in `src/domain/onboarding/onboardingService.ts` performs all zero-based validations and returns `ValidatedOnboardingConfig`
- **And** `useOnboardingWizard.ts` commits directly to `LedgerRepository.commitOnboardingConfig` without middleman delegation
- **And** the redundant `OnboardingRepository` port is removed.

### `SCEN-022`: Single Canonical Card Component (Deletion of `AppleCardFace.tsx`)
- **Given** card views in `AccountsView.tsx` and card accessibility suites
- **When** credit card and account visuals are rendered
- **Then** `CreditCardFace.tsx` provides the single canonical, parameterized card surface
- **And** `AppleCardFace.tsx` is completely removed without affecting accessibility or visual rendering.
