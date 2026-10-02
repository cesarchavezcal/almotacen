# Session Progress Log

## Current State

**Last Updated:** 2026-10-02 10:45
**Active Feature:** `codebase-architecture-deepening` (ALM-027 - Complete & Verified)


## Status

### What's Done

- [x] Executed Step 1: `/product-function` (`docs/product-design/product_function.md`)
- [x] Executed Step 2: `/product-description` (`docs/product-description/`)
- [x] Executed Step 3: `/to-spec` + Gate 1 `/unslop` (`openspec/specs/dual-cashflow-budgeting/spec.md`)
- [x] Executed Step 4: `/spec-to-tests` (`openspec/changes/dual-cashflow-budgeting/spec-tests.md`)
- [x] Executed Step 5: `/ia` & `/ooux` (`docs/product-design/ia.md`, `ooux.md`, `design.md`)
- [x] Executed Step 6: `/to-tickets` (`openspec/changes/dual-cashflow-budgeting/tasks.md`)
- [x] Executed Step 7 (TDD Implementation - ALM-001):
  - Updated `src/domain/ledger/types.ts` with `creditPaymentCategoryId`, `isCreditPayment`, `unfundedDebtCents`, `transferredToReserveCents`
  - Implemented credit card outflow automatic cash transfer to payment reserve envelope in `src/domain/ledger/ledgerEngine.ts`
  - Implemented unfunded credit debt calculation and category tracking without errors
  - Implemented `postCreditCardPayment` for balance settlement and envelope deduction
  - Expanded `src/domain/ledger/ledgerEngine.test.ts` with `SCEN-008` through `SCEN-011`
- [x] Executed Step 7 (TDD Implementation - ALM-002):
  - Installed `expo-sqlite` and created `DatabaseAdapter` interface
  - Created `src/storage/schema.ts` with SQLite DDL, migrations, and default seed data
  - Created `src/storage/database.ts` with runtime adapter (expo-sqlite / node:sqlite)
  - Created `src/storage/ledgerRepository.ts` with atomic double-sided writes, rollback safety, and query hydration
  - Created `src/storage/ledgerRepository.test.ts` integration suite (7/7 tests passing)
  - Created `src/storage/useLedgerStore.ts` reactive state hook using `useSyncExternalStore`
- [x] Executed Step 7 & 8 (Implementation & Review - ALM-003):
  - Created `src/domain/ledger/currency.ts` & `currency.test.ts` for clean integer-cent domain arithmetic
  - Created `src/hooks/useSmartPayeeMemory.ts` with typed `UseSmartPayeeMemoryResult` interface
  - Implemented container/presentational split in `app/modal.tsx` (`QuickEntryModal` + `QuickEntryView`)
  - Integrated smart payee inference (`SCEN-012`) and live balance impact preview (`SCEN-013`)
  - Two-Axis Review completed: Spec behavioral verification + GGA standards review (`PROVIDER="gemini"`) PASSED
  - PR opened & merged: [PR #18](https://github.com/cesarchavezcal/almotacen/pull/18)
- [x] Executed Step 7 & 8 (Implementation & Review - ALM-004):
  - Created `src/domain/ledger/budgetViewHelpers.ts` for banner states, quick-fill allocation math, and display groups
  - Created `src/domain/ledger/budgetViewHelpers.test.ts` unit suite (14/14 tests passing)
  - Refactored `EnvelopePassFace.tsx` to strict integer cents, domain currency formatting, and expandable quick-fill pills
  - Refactored `app/(tabs)/budget.tsx` with container/presentational architecture (`BudgetScreen` + `BudgetView`)
  - Connected `Ready to Assign` header banner and obligation-grouped categories to live `useLedgerStore`
  - Two-Axis Review: Behavioral contracts + GGA standards review (`PROVIDER="gemini"`) PASSED
  - PR opened & merged: [PR #19](https://github.com/cesarchavezcal/almotacen/pull/19)
- [x] Executed Step 7 & 8 (TDD Implementation & Review - ALM-005):
  - Created `src/domain/cashflow/cashflowCalculations.ts` & `cashflowCalculations.test.ts` (14/14 tests passing)
  - Created `src/components/CashflowTrajectoryChart.tsx` with responsive SVG trajectory curve, linear budget pace line, dashed EOM forecast, and horizontal Income Ceiling warning line
  - Created `src/hooks/useCashflow.ts` connecting SQLite store to reactive cash flow model
  - Added `calculateDailyCashRewardCents` with integer basis points in `src/domain/ledger/currency.ts`
  - Refactored `app/(tabs)/index.tsx` into Container-Presentational structure (`CashFlowScreen` + `CashFlowView`), binding live net cash flow, hero card burn rate, and real recent transactions from SQLite
  - PR opened & merged: [PR #20](https://github.com/cesarchavezcal/almotacen/pull/20)
- [x] Executed Step 7 & 8 (TDD Implementation & Review - ALM-006):
  - Created `src/domain/cashflow/scrubbingMath.ts` & `scrubbingMath.test.ts` (11/11 tests passing)
  - Enhanced `src/components/CashflowTrajectoryChart.tsx` with direct-manipulation `PanResponder` scrubbing, vertical tracker line, scrub point indicator dot, micro-haptics (`Haptics.selectionAsync()`), and floating HUD tooltip
  - Enhanced `app/(tabs)/index.tsx` to handle scrub events, lock parent `ScrollView` during horizontal scrubbing, and dynamically filter Recent Outflows to the scrubbed calendar date
  - PR opened & merged: [PR #21](https://github.com/cesarchavezcal/almotacen/pull/21)
- [x] Executed Step 7 (TDD Implementation - ALM-007):
  - Created pure domain rollover engine `src/domain/ledger/rollover.ts` and `rollover.test.ts` (5/5 tests passing) supporting positive envelope balance carryover (`SCEN-026`), cash deficit absorption from Ready to Assign (`SCEN-027`), and credit debt retention on card accounts
  - Updated `src/domain/cashflow/cashflowCalculations.ts` & `cashflowCalculations.test.ts` to support closed historical months (`SCEN-025`)
  - Updated `src/hooks/useCashflow.ts` and `useCashflow.test.ts` (4/4 tests passing) to support month paging state, title labels, and boundary shifting (`SCEN-024`)
  - Created `src/components/MonthPagingHeader.tsx` with chevron controls, "Current" jump badge, selection haptics, and accessible 44x44 targets
  - Integrated `performMonthRollover` in `SQLiteLedgerRepository` & `useLedgerStore` with atomic SQLite transaction persistence
  - Mounted `MonthPagingHeader` in `CashFlowScreen` and extracted `CashFlowView` in `src/components/CashFlowView.tsx`
  - Verification: 77/77 Jest tests pass via `./init.sh` across 9 test suites, 0 TypeScript errors
  - PR opened & merged: [PR #22](https://github.com/cesarchavezcal/almotacen/pull/22)
- [x] Executed ALM-013 Ticket 01 (Clean Database Initialization & Demo Seeder):
  - Created zero-data initialization in `src/storage/schema.ts` (`createSchemaTables`)
  - Added explicit demo seeder `seedDemoData` and `resetToCleanState`
  - Created `cleanInitialization.test.ts` (7/7 tests passing)
  - PR opened & merged: [PR #30](https://github.com/cesarchavezcal/almotacen/pull/30)
- [x] Executed ALM-013 Ticket 02 (Financial Archetype Template Generator):
  - Created `src/domain/onboarding/types.ts` & `archetypes.ts`
  - Implemented 4 templates (`STANDARD_BALANCED`, `DEBT_SNOWBALL`, `FREELANCER_VARIABLE`, `MINIMALIST_LIVING`)
  - Created `archetypes.test.ts` (11/11 tests passing)
  - PR opened & merged: [PR #31](https://github.com/cesarchavezcal/almotacen/pull/31)
- [x] Executed ALM-013 Ticket 03 (Commitment Service & Route Guard):
  - Created pure domain service `src/domain/onboarding/onboardingService.ts` and `OnboardingRepository` port
  - Implemented `SQLiteOnboardingRepository` in `src/storage/onboardingRepository.ts` with atomic transaction commitment
  - Implemented `useOnboardingGuard` hook with error diagnostics in `src/hooks/useOnboardingGuard.ts`
  - Integrated first-run route redirection guard in `app/_layout.tsx` and scaffolded `app/onboarding.tsx`
  - 145/145 tests passing across 21 test suites, 0 TypeScript errors
  - PR opened & merged: [PR #32](https://github.com/cesarchavezcal/almotacen/pull/32)
- [x] Executed ALM-013 Ticket 04 (Interactive Multi-Step Onboarding UI Wizard):
  - Built pure presentational component `src/components/onboarding/OnboardingWizardView.tsx` with 4 guided steps, design system tokens, and accessibility
  - Implemented controller and state hook `src/hooks/useOnboardingWizard.ts` for clean Hexagonal separation
  - Wired container `app/onboarding.tsx` with step progress, account form validation, archetype selection, and zero-based allocation preview
  - Added unit and interaction test suite `src/screens/__tests__/OnboardingScreen.test.tsx` (7 tests, SCEN-052..054)
  - 152/152 tests passing across 22 test suites, 0 TypeScript errors
  - PR opened & merged: [PR #33](https://github.com/cesarchavezcal/almotacen/pull/33)
- [x] Executed Step 7 & 8 (Bugfix & Review - ALM-014):
  - Wrapped `<OnboardingWizardView>` inside `<SafeAreaView edges={['top', 'bottom']}>` in `app/onboarding.tsx`
  - Created standard test mock in `__mocks__/react-native-safe-area-context.js` and registered in `jest.config.js`
  - Verified visual layout in iOS Simulator: "STEP 1 OF 4" sits below Dynamic Island / clock
  - Two-Axis Review: `./init.sh` 152/152 tests passing + GGA code review PASSED
  - PR opened & merged: [PR #35](https://github.com/cesarchavezcal/almotacen/pull/35)

- [x] Step 1-6 Plan & Design for Settings & Entity Management (`openspec/changes/settings-entity-management-data-reset/`)
- [x] Executed Step 7 (TDD Implementation - ALM-015 Ticket 01: Repository Entity CRUD):
  - Added entity CRUD interfaces & method signatures to `LedgerRepository` in `src/storage/types.ts`
  - Defined typed domain errors (`EntityNotFoundError`, `EntityIntegrityError`, `ProtectedEntityError`) in `src/domain/ledger/errors.ts`
  - Extracted pure domain integrity assertions & helpers in `src/domain/ledger/entityOperations.ts`
  - Implemented atomic CRUD methods in `SQLiteLedgerRepository` (`createAccount`, `updateAccount`, `deleteAccount`, `createCategoryGroup`, `updateCategoryGroup`, `deleteCategoryGroup`, `createCategory`, `updateCategory`, `deleteCategory`)
  - Created unit & behavioral test suite `src/storage/ledgerRepository.entityCrud.test.ts` covering `SCEN-002` through `SCEN-015` (14/14 tests passing)
  - 166/166 tests passing across 23 test suites via `./init.sh`, 0 TypeScript errors
- [x] Executed Step 7 (TDD Implementation - ALM-016 Ticket 02: Three-Tier Data Reset & Diagnostics Engine):
  - Added `DiagnosticsData` and reset method signatures in `src/storage/types.ts`
  - Implemented `factoryReset`, `clearTransactionsOnly`, `getDiagnostics` in `src/storage/schema.ts`
  - Implemented `factoryReset`, `clearTransactionsOnly`, `seedDemoData`, `getDiagnostics` in `SQLiteLedgerRepository` and `useLedgerStore`
  - Created behavioral test suite `src/storage/__tests__/ledgerRepository.reset.test.ts` covering `SCEN-016` through `SCEN-019` (4/4 tests passing)
  - 170/170 tests passing across 24 test suites via `./init.sh`, 0 TypeScript errors
- [x] Executed Step 7, 8 & 9 (Implementation, Two-Axis Review & PR - ALM-017 Ticket 03: Settings Tab Navigation & Presentational Layout):
  - Created presentational components `SettingsRow`, `SettingsSection`, `SettingsView`, and `SettingsHeaderRow` with iOS grouped inset styling in `src/components/settings/`
  - Created controller hook `useSettings.ts` with diagnostics hydration, route transitions, and native alert confirmation flows
  - Registered persistent `settings` tab in `app/(tabs)/_layout.tsx` and created container screen `app/(tabs)/settings.tsx`
  - Created dedicated stack sub-screens `app/settings/` (`_layout.tsx`, `accounts.tsx`, `groups.tsx`, `categories.tsx`)
  - Refactored `app/(tabs)/accounts.tsx` into container-presentational architecture delegating to `src/components/AccountsView.tsx`
  - Added "+ Add" shortcuts in primary tabs `budget.tsx` and `accounts.tsx`
  - Authored behavioral component test suite in `app/(tabs)/__tests__/settings.test.tsx` verifying `SCEN-001` (9/9 tests passing)
  - Two-Axis Review completed: Axis 1 Spec Compliance (PASSED) + Axis 2 Standards Compliance via `.gga` (PASSED)
  - 183/183 tests passing across 26 test suites via `./init.sh`, 0 TypeScript errors
  - PR opened: [PR #38](https://github.com/cesarchavezcal/almotacen/pull/38)

- [x] Executed Step 7, 8 & 9 (Implementation, Two-Axis Review & PR - ALM-018 Ticket 04: Entity Creation & Edit Modals / Sheets):
  - Created presentational modal forms (`AccountModal`, `CategoryGroupModal`, `CategoryModal`) with strict integer cents conversion and error handling
  - Wired up modals to dedicated stack screens (`app/settings/accounts.tsx`, `app/settings/groups.tsx`, `app/settings/categories.tsx`)
  - Two-Axis Review completed, merged via PR #39.
- [x] Executed Step 7, 8 & 9 (Web Supabase Integration - Ticket 01: Schema & Anonymous Client):
  - Created Postgres DDL schema `supabase/migrations/20260925_init_ledger_schema.sql` with multi-tenancy and RLS policies
  - Implemented `@supabase/supabase-js` client `src/storage/supabase/client.ts` with anonymous authentication
  - Authored unit test suite `src/storage/supabase/__tests__/client.test.ts` (3/3 tests passing)
  - Two-Axis Review completed, merged via PR #42.
- [x] Executed Step 7, 8 & 9 (Web Supabase Integration - Ticket 02: Cached Supabase Ledger Repository):
  - Implemented `SupabaseLedgerRepository` in `src/storage/supabase/supabaseLedgerRepository.ts` adhering to `LedgerRepository` interface
  - Implemented in-memory `BudgetState` caching with zero-latency synchronous reads for `useSyncExternalStore`
  - Implemented optimistic mutations with rollback snapshot mechanism on network rejection (`SCEN-006`, `SCEN-007`)
  - Chained `.throwOnError()` on all Supabase mutation queries for reliable error handling
  - Authored unit test suite `src/storage/supabase/__tests__/supabaseLedgerRepository.test.ts` (19/19 tests passing)
  - Two-Axis Review completed, squashed & merged via [PR #56](https://github.com/cesarchavezcal/almotacen/pull/56)
  - 227/227 tests passing across 29 suites via `./init.sh`, 0 TypeScript errors

- [x] Executed Step 7, 8 & 9 (Web Supabase Integration - Ticket 03: Platform Factory & Web Bootstrapping):
  - Updated `src/storage/useLedgerStore.ts` with platform-aware factory returning `SupabaseLedgerRepository` on Web and `SQLiteLedgerRepository` on Native
  - Created `src/hooks/useWebBootstrap.ts` orchestrator and hook for anonymous session initialization and cache hydration
  - Integrated `useWebBootstrap` in `app/_layout.tsx` to delay navigation rendering until cache and fonts are ready
  - Updated `src/hooks/useOnboardingGuard.ts` with web-safe diagnostics check avoiding SQLite calls on web
  - Authored behavioral test suite `src/storage/__tests__/platformFactory.test.ts` verifying `SCEN-008` (9/9 tests passing)
  - Verified web bundling with `npx expo export --platform web`
  - Two-Axis Review completed, squashed & merged via [PR #57](https://github.com/cesarchavezcal/almotacen/pull/57)
  - 236/236 tests passing across 30 suites via `./init.sh`, 0 TypeScript errors

- [x] Executed Step 7 (Implementation - ALM-025 Ticket 01: Compiler Baseline, Local Tooling & DX):
  - Reverted `typescript` to `~6.0.3` in `package.json` to restore `ts-jest` runner compatibility
  - Added `.env.example` documenting Supabase credentials for local and remote environments
  - Authored `supabase/config.toml` configuring local Docker ports and enabling anonymous auth
  - Added npm scripts: `supabase:start`, `supabase:stop`, `supabase:reset`
  - Verified `./init.sh`: 236/236 Jest tests passing across all 30 suites, 0 TypeScript errors

- [x] Executed Step 7 (Implementation - ALM-026 Ticket 02: Platform-Agnostic Onboarding Storage Seam):
  - Elevated `commitOnboardingConfig` to `LedgerRepository` in `src/storage/types.ts`
  - Implemented `commitOnboardingConfig` in `SQLiteLedgerRepository` delegating to `SQLiteOnboardingRepository`
  - Implemented `commitOnboardingConfig` in `SupabaseLedgerRepository` with optimistic cache update and idempotent batch upserts
  - Routed `executeCommitOnboarding` through pure domain `validateOnboardingConfig` enforcing zero-based invariants
  - Refactored `src/hooks/useOnboardingWizard.ts` to consume `LedgerRepository` instead of direct SQLite `getDatabase()`, eliminating web crashes
  - Authored behavioral test suite `src/storage/__tests__/onboardingSeam.test.ts` (3/3 tests passing) and controller tests in `src/hooks/__tests__/useOnboardingWizard.test.ts` (4/4 tests passing)
  - Verified `./init.sh`: 243/243 Jest tests passing across all 32 suites, 0 TypeScript errors

- [x] Executed Step 7 (Implementation - ALM-027 Ticket 03: DB Optimization, RLS InitPlan & Realtime DDL):
  - Created migration `supabase/migrations/20260930_optimize_rls_and_realtime.sql`
  - Added indexes on unindexed foreign keys `categories(credit_account_id)` and `transactions(transfer_account_id)`
  - Recreated all 20 RLS policies across `metadata`, `accounts`, `category_groups`, `categories`, and `transactions` with `TO authenticated` and InitPlan subqueries `((select auth.uid()) = user_id)`
  - Registered tables into `supabase_realtime` publication with idempotent `DO $$` enrollment
  - Authored behavioral test suite `src/storage/supabase/__tests__/migrationOptimization.test.ts` (30/30 tests passing)
  - Verified `./init.sh`: 273/273 Jest tests passing across all 33 suites, 0 TypeScript errors
  - Two-Axis Review completed & PR #66 merged to `main`.

- [x] Executed Step 7 (TDD Implementation - ALM-028 Ticket 04: Coalesced Realtime Synchronization):
  - Added `dispose?(): void` to `LedgerRepository` in `src/storage/types.ts`
  - Implemented channel subscription to `postgres_changes` on schema `public` with `user_id = eq.${userId}`
  - Implemented `handleRealtimeEvent` with 200ms coalescing debounce for remote re-hydration (`SCEN-014`)
  - Implemented local mutation echo suppression via `activeWriteCount` in `executeOptimisticMutation` (`SCEN-015`)
  - Added defensive handling for non-mocked/missing channel methods and safe error-rollback counter decrement
  - Authored Red-first behavioral test suite `src/storage/supabase/__tests__/realtimeSync.test.ts` (6/6 tests passing)
  - Verified `./init.sh`: 279/279 Jest tests passing across all 34 suites, 0 TypeScript compilation errors

- [x] Executed Step 7 (TDD Implementation - ALM-027 Ticket 01: EntityManager Domain Module):
  - Created `src/domain/ledger/entityManager.ts` implementing `planAccountDeletion`, `planCategoryDeletion`, `planCategoryGroupDeletion`, and `planAccountCreation`
  - Authored behavioral unit tests in `src/domain/ledger/entityManager.test.ts` (13/13 tests passing covering `SCEN-060`, `SCEN-061`, `SCEN-062`)
  - Refactored `SQLiteLedgerRepository` and `SupabaseLedgerRepository` to consume `EntityManager` mutation plans, eliminating 9-step query duplication
  - Re-exported `EntityManager` and cleaned up dead code in `src/domain/ledger/entityOperations.ts`

- [x] Executed Step 7 (TDD Implementation - ALM-027 Ticket 02: Storage Port Segregation):
  - Created segregated ports in `src/storage/ports/` (`LedgerTransactionsPort`, `EntityCatalogPort`, `LedgerAdminPort`)
  - Composed monolithic `LedgerRepository` from the three ports in `src/storage/types.ts`
  - Streamlined `src/storage/useLedgerStore.ts` by replacing 18 boilerplate `useCallback` forwarders with memoized action proxy
  - Authored behavioral test `src/storage/__tests__/portSegregation.test.ts` (3/3 tests passing for `SCEN-063`)

- [x] Executed Step 7 (TDD Implementation - ALM-027 Ticket 03: Onboarding Seam Consolidation):
  - Inlined SQL execution directly into `SQLiteLedgerRepository.commitOnboardingConfig()`
  - Deleted orphaned `src/storage/onboardingRepository.ts`
  - Decoupled `useOnboardingGuard.ts` from `DatabaseAdapter`, querying `LedgerRepository.isOnboardingCompleted()` directly
  - Verified `SCEN-064` in `src/hooks/__tests__/useOnboardingGuard.test.ts`

- [x] Executed Step 7 (TDD Implementation - ALM-027 Ticket 04: Point-of-Sale Expense Intake Module):
  - Created deep domain module `src/domain/ledger/expenseIntake.ts` implementing `parseCurrencyInput`, `previewExpenseImpact`, `resolvePayeeSuggestion`, and `submitExpense`
  - Authored unit test suite `src/domain/ledger/expenseIntake.test.ts` (11/11 tests passing for `SCEN-065`, `SCEN-066`, `SCEN-067`)
  - Created state hook `src/hooks/useExpenseIntake.ts` and extracted presentational `src/components/expense/QuickEntryView.tsx`
  - Refactored `app/modal.tsx` down from 601 lines to 47 lines (>90% reduction)

- [x] Executed Step 7 (Verification & ADR - ALM-027 Ticket 05: Verification & ADR Recording):
  - Recorded ADR-002 ("Deepened Domain Seams, Port Segregation & Atomic Entity Manager") in `MEMORY.md`
  - Verified `./init.sh`: 38/38 Jest test suites passed, 309/309 tests passed, 0 failures, 0 TypeScript errors
  - Marked all tickets in `openspec/changes/codebase-architecture-deepening/tasks.md` complete

### What's In Progress

None (Architecture Deepening ALM-027 fully merged & archived).

### What's Next

1. Plan next feature milestone or execute next prioritized product epic via `/autonomic plan`.

## Evidence of Completion

- [x] `./init.sh`: 309/309 Jest unit/integration tests pass (38 suites), `tsc --noEmit` 0 errors.
- [x] ALM-027 Ticket 01: 13 behavioral tests passing (`SCEN-060`, `SCEN-061`, `SCEN-062`).
- [x] ALM-027 Ticket 02: 3 port segregation tests passing (`SCEN-063`).
- [x] ALM-027 Ticket 03: 4 onboarding guard tests passing (`SCEN-064`).
- [x] ALM-027 Ticket 04: 11 expense intake tests passing (`SCEN-065`, `SCEN-066`, `SCEN-067`).
- [x] ALM-027 Ticket 05: Full test suite pass (309/309 tests) and ADR-002 recorded.
- [x] Change Archival: `codebase-architecture-deepening` archived to `openspec/changes/archive/2026-10-02-codebase-architecture-deepening/` (PR #70).
- [x] Web Supabase Integration Ticket 01: 3 behavioral tests passing (`SCEN-001`, `SCEN-002`, `SCEN-003`).
- [x] Web Supabase Integration Ticket 02: 19 behavioral tests passing (`SCEN-004`, `SCEN-005`, `SCEN-006`, `SCEN-007`).
- [x] Web Supabase Integration Ticket 03: 9 behavioral tests passing (`SCEN-008`).
- [x] Web Supabase Hardening Ticket 01: Reverted TS to ~6.0.3, config.toml & .env.example (`SCEN-009`).
- [x] Web Supabase Hardening Ticket 02: 7 behavioral/controller tests passing (`SCEN-010`, `SCEN-011`).
- [x] Web Supabase Hardening Ticket 03: 30 migration/RLS tests passing (`SCEN-012`, `SCEN-013`).
- [x] Web Supabase Hardening Ticket 04: 6 realtime synchronization tests passing (`SCEN-014`, `SCEN-015`).
- [x] Web Supabase Hardening Ticket 05: 4 auth lifecycle & identity switching tests passing (`SCEN-016`, `SCEN-017`).
- [x] Change Archival: `web-supabase-integration` archived to `openspec/changes/archive/2026-09-28-web-supabase-integration/` (PR #59).
- [x] Change Archival: `web-supabase-hardening` archived to `openspec/changes/archive/2026-09-30-web-supabase-hardening/`.







