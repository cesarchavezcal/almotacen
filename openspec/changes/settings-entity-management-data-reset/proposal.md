# Proposal: Settings Screen with Entity Management and Data Reset

## 1. Problem Statement
`almotacen` currently locks users into whatever accounts and category groupings were established during the initial onboarding pass. There is no user-facing screen or menu to:
1. Add new bank or credit accounts.
2. Create or adjust category groups and budget envelopes.
3. Update account details, balances, or category targets.
4. Safely delete obsolete or erroneous entities without database corruption.
5. Perform a full data reset or reload demo starter data.

## 2. Proposed Solution
1. **Settings Screen (`app/(tabs)/settings.tsx`)**:
   - Provide a fourth persistent tab on the main navigation bar.
   - Present a clean, native iOS grouped inset list divided into:
     - **Entity Management**: Quick access to Accounts, Category Groups, and Categories lists.
     - **Data Management**: Actions to "Reset All Data (Factory Reset)" and "Load Demo Data".
     - **System Diagnostics**: App version, SQLite schema version, and entity row counts.
2. **Entity Management Engine (`src/domain/settings/` & `src/storage/ledgerRepository.ts`)**:
   - Extend repository with CRUD operations for:
     - `accounts`: `createAccount`, `updateAccount`, `deleteAccount`.
     - `category_groups`: `createCategoryGroup`, `updateCategoryGroup`, `deleteCategoryGroup`.
     - `categories`: `createCategory`, `updateCategory`, `deleteCategory`.
   - Enforce domain validation rules and referential integrity guards:
     - Reject account deletion if transactions exist for that account.
     - Reject category group deletion if child categories exist in that group.
     - Reject category deletion if assigned transactions or non-zero available balances exist.
     - Protect credit card payment categories from manual deletion.
3. **Data Reset Engine**:
   - Implement `factoryReset()`: Atomically truncates `transactions`, `categories`, `category_groups`, and `accounts`; resets `ready_to_assign_cents = 0` and `onboarding_completed = false`.
   - Trigger route guard redirection to `/onboarding`.
   - Implement `seedDemoData()`: Atomically re-seeds default starter archetypes.

## 3. Scope Boundaries
- **In Scope**:
  - Settings tab navigation (`app/(tabs)/_layout.tsx`, `app/(tabs)/settings.tsx`).
  - Entity management sheets/modals for Accounts, Groups, Categories.
  - Deletion validation guardrails.
  - Factory Reset & Demo Seeding with confirmation alerts.
  - Complete unit and component test suites.
- **Out of Scope (10x Scope-Stripped)**:
  - Cloud synchronization or remote backup.
  - CSV export/import (reserved for dedicated data export ticket).
  - Custom category icons or custom color palette pickers.
