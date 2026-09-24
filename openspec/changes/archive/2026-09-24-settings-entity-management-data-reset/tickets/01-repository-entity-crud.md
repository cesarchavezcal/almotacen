# Ticket 01: Repository Entity Management CRUD & Integrity Guards

## Status
- **Phase**: Step 7 (Implementation Complete - 14/14 Tests Green)
- **Scenarios Bound**: `SCEN-002`, `SCEN-003`, `SCEN-004`, `SCEN-005`, `SCEN-006`, `SCEN-007`, `SCEN-008`, `SCEN-009`, `SCEN-010`, `SCEN-011`, `SCEN-012`, `SCEN-013`, `SCEN-014`, `SCEN-015`

---

## Objective
Implement type-safe, transactional CRUD operations for Accounts, Category Groups, and Categories in `SQLiteLedgerRepository`, enforcing strict domain validation and referential integrity guards.

---

## Detailed Requirements
1. **Accounts**:
   - `createAccount(input)`: Inserts into `accounts`. If depository, credits `ready_to_assign_cents`. If credit card, automatically provisions a payment category in group `grp-payments`.
   - `updateAccount(input)`: Updates name and balance.
   - `deleteAccount(id)`: Verifies zero linked transactions in `transactions`. Throws descriptive error if transactions exist.
2. **Category Groups**:
   - `createCategoryGroup(input)`: Inserts into `category_groups` with `sort_order = max + 1`.
   - `updateCategoryGroup(input)`: Renames group.
   - `deleteCategoryGroup(id)`: Verifies zero child categories. Throws error if categories exist.
3. **Categories**:
   - `createCategory(input)`: Inserts into `categories` with target properties and zero balances.
   - `updateCategory(input)`: Updates name, target, and group association.
   - `deleteCategory(id)`: Blocks deletion if `is_credit_payment = 1`, if transactions exist, or if `available_cents > 0`.

---

## Verification
- Unit test suite in `src/storage/__tests__/ledgerRepository.entityCrud.test.ts`.
- Must pass with 100% green assertions.
