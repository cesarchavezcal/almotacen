# Implementation Tasks: Settings, Entity Management & Data Reset

## Overview
This task list breaks down the implementation of the Settings screen, Entity Management CRUD, and Data Reset into discrete, TDD-ready work packages bound to specification contracts.

---

## Task Matrix & Scenario Binding

- [x] **Task 1: Repository Entity Management CRUD & Integrity Guards**
  - **Ticket**: `tickets/01-repository-entity-crud.md`
  - **Scenario Binding**: `SCEN-002`, `SCEN-003`, `SCEN-004`, `SCEN-005`, `SCEN-006`, `SCEN-007`, `SCEN-008`, `SCEN-009`, `SCEN-010`, `SCEN-011`, `SCEN-012`, `SCEN-013`, `SCEN-014`, `SCEN-015`
  - **Deliverables**:
    - Extend `src/storage/types.ts` with input types and repository signatures.
    - Implement `createAccount`, `updateAccount`, `deleteAccount` with transaction guards.
    - Implement `createCategoryGroup`, `updateCategoryGroup`, `deleteCategoryGroup` with child category guards.
    - Implement `createCategory`, `updateCategory`, `deleteCategory` with balance and credit protection guards.
    - Unit test suite in `src/storage/__tests__/ledgerRepository.entityCrud.test.ts`.

- [x] **Task 2: Data Reset Engine & System Diagnostics**
  - **Ticket**: `tickets/02-data-reset-and-diagnostics.md`
  - **Scenario Binding**: `SCEN-016`, `SCEN-017`, `SCEN-018`, `SCEN-019`
  - **Deliverables**:
    - Implement `factoryReset()` in `schema.ts` and `ledgerRepository.ts` resetting all tables and setting `onboarding_completed = false`.
    - Implement `clearTransactionsOnly()` in `ledgerRepository.ts` resetting transaction records, zeroing category balances, and re-anchoring `ready_to_assign_cents = sum(positive accounts)`.
    - Implement `seedDemoData()` resetting state to canonical starter archetypes.
    - Implement `getDiagnostics()` returning live table record counts and schema version.
    - Unit tests in `src/storage/__tests__/ledgerRepository.reset.test.ts`.

- [x] **Task 3: Settings Tab Navigation, Sub-Screens & Presentational Layout**
  - **Ticket**: `tickets/03-settings-navigation-and-layout.md`
  - **Scenario Binding**: `SCEN-001`
  - **Deliverables**:
    - Register Settings tab in `app/(tabs)/_layout.tsx` with standard gear icon.
    - Create `app/(tabs)/settings.tsx` container screen.
    - Create dedicated stack management sub-screens: `app/settings/accounts.tsx`, `app/settings/groups.tsx`, `app/settings/categories.tsx`.
    - Expose "+ Add" shortcuts directly on `app/(tabs)/budget.tsx` and `app/(tabs)/accounts.tsx`.
    - Create presentational `SettingsView`, `SettingsSection`, and `SettingsRow` components with design system styling (`src/theme/`).
    - Hook `src/hooks/useSettings.ts` providing reactive diagnostics, entity summaries, and confirmation triggers.
    - Component tests in `app/(tabs)/__tests__/settings.test.tsx`.

- [x] **Task 4: Entity Management Modals & Confirmation Alerts**
  - **Ticket**: `tickets/04-entity-management-modals.md`
  - **Scenario Binding**: `SCEN-002`, `SCEN-004`, `SCEN-007`, `SCEN-008`, `SCEN-011`, `SCEN-012`
  - **Deliverables**:
    - Create modal editors for Accounts, Category Groups, and Categories.
    - Hook into `useSettings` to invoke creation, editing, and deletion.
    - Enforce form validation and present user-friendly error banners on integrity violations.
    - Double-confirmation alert dialogs for Factory Reset and entity deletion.
    - Comprehensive component integration tests.
