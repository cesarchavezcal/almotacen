# Implementation Plan: Ticket 01 — Repository Entity Management CRUD & Integrity Guards

## 1. Ticket Overview & Objective
- **Ticket**: `openspec/changes/settings-entity-management-data-reset/tickets/01-repository-entity-crud.md`
- **Objective**: Implement type-safe, transactional CRUD operations for Accounts, Category Groups, and Categories in `SQLiteLedgerRepository`, enforcing strict domain validation and referential integrity guards.
- **Bound Scenarios**: `SCEN-002`, `SCEN-003`, `SCEN-004`, `SCEN-005`, `SCEN-006`, `SCEN-007`, `SCEN-008`, `SCEN-009`, `SCEN-010`, `SCEN-011`, `SCEN-012`, `SCEN-013`, `SCEN-014`, `SCEN-015`

---

## 2. Architecture & Seam Design
- **Domain Layer**:
  - Validation rules and referential integrity assertions:
    - Account deletion blocked if linked transactions exist.
    - Category Group deletion blocked if child categories exist.
    - Category deletion blocked if `is_credit_payment === 1`, if active transactions exist, or if `available_cents > 0`.
- **Storage Layer**:
  - Types in `src/storage/types.ts`:
    - `CreateAccountInput`, `UpdateAccountInput`
    - `CreateCategoryGroupInput`, `UpdateCategoryGroupInput`
    - `CreateCategoryInput`, `UpdateCategoryInput`
  - Implementation in `src/storage/ledgerRepository.ts`:
    - `createAccount`, `updateAccount`, `deleteAccount`
    - `createCategoryGroup`, `updateCategoryGroup`, `deleteCategoryGroup`
    - `createCategory`, `updateCategory`, `deleteCategory`
- **Testing Seam**:
  - `src/storage/ledgerRepository.entityCrud.test.ts` using `createTestDatabase()`.

---

## 3. Atomic Slices (TDD Red ➔ Green ➔ Refactor)

### Slice 1: Interface Contracts & Type Definitions
- **File**: `src/storage/types.ts`
- Define inputs:
  ```typescript
  export interface CreateAccountInput {
    id?: string;
    name: string;
    accountType: 'checking' | 'savings' | 'credit' | 'investment';
    balanceCents: number;
  }
  export interface UpdateAccountInput {
    id: string;
    name: string;
    balanceCents?: number;
  }
  export interface CreateCategoryGroupInput {
    id?: string;
    name: string;
  }
  export interface UpdateCategoryGroupInput {
    id: string;
    name: string;
  }
  export interface CreateCategoryInput {
    id?: string;
    groupId: string;
    name: string;
    targetCents?: number;
    targetType?: 'NEEDED_FOR_SPENDING' | 'MONTHLY_SET_ASIDE' | 'DEBT_PAYMENT';
    targetDueDay?: number;
  }
  export interface UpdateCategoryInput {
    id: string;
    groupId?: string;
    name?: string;
    targetCents?: number;
    targetType?: 'NEEDED_FOR_SPENDING' | 'MONTHLY_SET_ASIDE' | 'DEBT_PAYMENT';
    targetDueDay?: number;
  }
  ```
- Add CRUD method signatures to `LedgerRepository`.

### Slice 2: Account Management CRUD with Transaction Guard (Red ➔ Green)
- **Scenarios**: `SCEN-002`, `SCEN-003`, `SCEN-004`, `SCEN-005`, `SCEN-006`
- **Red Test**:
  - Test depository account creation credits `readyToAssignCents`.
  - Test credit card account creation provisions linked `cat-cc-payment` in group `grp-payments`.
  - Test account rename and balance adjustment.
  - Test deletion fails with error when transactions exist in `transactions`.
  - Test deletion succeeds when zero transactions exist (and cleans up linked credit payment category if empty).
- **Green Implementation**: Implement `createAccount`, `updateAccount`, `deleteAccount` in `SQLiteLedgerRepository`.

### Slice 3: Category Group Management CRUD (Red ➔ Green)
- **Scenarios**: `SCEN-007`, `SCEN-008`, `SCEN-009`, `SCEN-010`
- **Red Test**:
  - Test group creation auto-increments `sort_order`.
  - Test group renaming.
  - Test deletion throws error when child categories exist in `categories`.
  - Test deletion succeeds on empty category group.
- **Green Implementation**: Implement `createCategoryGroup`, `updateCategoryGroup`, `deleteCategoryGroup`.

### Slice 4: Category Management CRUD with Protection Guards (Red ➔ Green)
- **Scenarios**: `SCEN-011`, `SCEN-012`, `SCEN-013`, `SCEN-014`, `SCEN-015`
- **Red Test**:
  - Test category creation sets target type, amount, due day, with zero balances.
  - Test category updating and group reassignment.
  - Test deletion throws when `is_credit_payment === 1`.
  - Test deletion throws when transactions exist or `available_cents > 0`.
  - Test deletion succeeds on unlinked zero-balance category.
- **Green Implementation**: Implement `createCategory`, `updateCategory`, `deleteCategory`.

---

## 4. Verification & Quality Gates
1. **Automated Unit Tests**:
   - Run `npx jest src/storage/ledgerRepository.entityCrud.test.ts` (14/14 tests green).
2. **Regression Check**:
   - Run `npm test` to confirm zero regressions in existing ledger repository, rollover, and UI tests.
3. **Type Strictness**:
   - Run `npx tsc --noEmit` with zero errors.
