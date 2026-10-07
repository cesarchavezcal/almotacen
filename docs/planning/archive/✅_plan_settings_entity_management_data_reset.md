# Implementation Plan: Settings Screen with Entity Management and Data Reset

## 1. Overview & Objective
Implement a sovereign administrative and settings experience in `almotacen` through a dedicated fourth tab (`/(tabs)/settings`), providing entity CRUD (Accounts, Category Groups, Categories) with referential integrity guardrails, and an atomic Data Reset engine (Factory Reset to `/onboarding` and Demo Data Seeding).

---

## 2. Architecture & Seam Strategy
- **Domain Layer (`src/domain/settings/` & `src/domain/ledger/`)**:
  - Validation guards asserting referential integrity:
    - Accounts with existing transactions cannot be deleted.
    - Category groups containing child categories cannot be deleted.
    - Categories with active transactions or positive available funds cannot be deleted.
    - Credit card payment categories cannot be deleted directly.
- **Storage Layer (`src/storage/ledgerRepository.ts` & `src/storage/schema.ts`)**:
  - Extend `LedgerRepository` interface and implementation with transactional CRUD methods.
  - Implement `factoryReset()` which wipes `transactions`, `categories`, `category_groups`, `accounts`, sets `ready_to_assign_cents = 0` and `onboarding_completed = false`.
  - Implement `seedDemoData()` which re-seeds default starter archetypes.
  - Implement `getDiagnostics()` which returns schema version and row counts.
- **Hook Layer (`src/hooks/useSettings.ts`)**:
  - Encapsulates diagnostics queries, entity summaries, and triggers for creation/editing/reset.
- **Presentation Layer (`app/(tabs)/settings.tsx` & `src/components/settings/`)**:
  - Container-Presentational architecture.
  - iOS/Android styled grouped inset list using `colors` and `typography` from `src/theme`.
  - Reusable modal forms for entity CRUD.
  - Destructive double-confirmation alerts for Factory Reset and entity deletion.

---

## 3. TDD Work Packages & Slices

### Phase 1: Repository Entity CRUD & Integrity Guards (Ticket 01)
- **Files**:
  - `src/storage/types.ts`
  - `src/storage/ledgerRepository.ts`
  - `src/storage/__tests__/ledgerRepository.entityCrud.test.ts`
- **Scenarios Bound**: `SCEN-002` through `SCEN-015`.
- **Methodology**: Red ➔ Green ➔ Refactor. Write failing tests against `createAccount`, `updateAccount`, `deleteAccount`, `createCategoryGroup`, etc., asserting error cases on referential violations, then implement.

### Phase 2: Data Reset & Diagnostics Engine (Ticket 02)
- **Files**:
  - `src/storage/schema.ts`
  - `src/storage/ledgerRepository.ts`
  - `src/storage/__tests__/ledgerRepository.reset.test.ts`
- **Scenarios Bound**: `SCEN-016`, `SCEN-017`, `SCEN-018`, `SCEN-019`.
- **Methodology**: Red ➔ Green tests verifying:
  - Three-Tier Reset:
    1. Factory Reset (wipe to `/onboarding`).
    2. Clear Transactions Only (Zero-Base Re-Anchor: wipe transactions, zero category balances, ready-to-assign = sum of positive liquid balances).
    3. Seed Demo Data (replace with archetype).
  - Diagnostics queries.

### Phase 3: Settings Tab Navigation & Presentational Layout (Ticket 03)
- **Files**:
  - `app/(tabs)/_layout.tsx`
  - `app/(tabs)/settings.tsx`
  - `app/settings/accounts.tsx` (Dedicated sub-screen)
  - `app/settings/groups.tsx` (Dedicated sub-screen)
  - `app/settings/categories.tsx` (Dedicated sub-screen)
  - `src/components/settings/SettingsView.tsx`
  - `src/components/settings/SettingsSection.tsx`
  - `src/components/settings/SettingsRow.tsx`
  - `src/hooks/useSettings.ts`
  - `app/(tabs)/__tests__/settings.test.tsx`
- **Scenarios Bound**: `SCEN-001`.
- **Methodology**: Component testing with mocked `DatabaseAdapter` asserting grouped layout, navigation links to sub-screens, row counts, and tap triggers. Also wire "+ Add" shortcuts on `Budget` and `Accounts` tabs.

### Phase 4: Entity Management Modals & Confirmation Alerts (Ticket 04)
- **Files**:
  - `src/components/settings/EntityEditorModal.tsx`
  - `src/components/settings/AccountForm.tsx`
  - `src/components/settings/CategoryGroupForm.tsx`
  - `src/components/settings/CategoryForm.tsx`
  - `src/components/settings/__tests__/EntityEditorModal.test.tsx`
- **Scenarios Bound**: `SCEN-002`, `SCEN-004`, `SCEN-007`, `SCEN-008`, `SCEN-011`, `SCEN-012`.
- **Methodology**: Form validation testing, error banner rendering, and destructive confirmation handling.

---

## 4. Verification & Definition of Done
1. **Automated Tests**:
   - `npm test` runs with 100% passing tests (zero test failures).
   - Clean typechecking via `npx tsc --noEmit` with zero errors.
2. **Behavioral Contract Coverage**:
   - All 18 scenarios from `openspec/changes/settings-entity-management-data-reset/spec-tests.md` verified green.
3. **Standards Review**:
   - Adheres to clean architecture, container-presentational separation, strict types (zero `any`, zero blind `as` casting), and integer cents.
