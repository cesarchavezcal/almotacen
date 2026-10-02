# Ticket 01: `EntityManager` Domain Module & Integrity Consolidation

- **Change**: `codebase-architecture-deepening`
- **Ticket ID**: `01`
- **Bound Scenarios**: `SCEN-060`, `SCEN-061`, `SCEN-062`

---

## Objective

Consolidate entity integrity checks, transaction count assertions, and cascading credit payment category cleanup into a deep `EntityManager` domain module. Eliminate the duplicated 9-step query dance in both `SQLiteLedgerRepository` and `SupabaseLedgerRepository`.

---

## Tasks

1. Author `src/domain/ledger/entityManager.ts`:
   - Implement `planAccountDeletion`, `planCategoryDeletion`, `planCategoryGroupDeletion`, and `planAccountCreation`.
   - Output structured `EntityMutationPlan` specifying entities to prune, payment categories to cascade, and Ready to Assign adjustments.
   - Enforce domain errors: `EntityIntegrityError` and `ProtectedEntityError`.
2. Author unit test suite `src/domain/ledger/entityManager.test.ts`:
   - Assert `SCEN-060`: Blocks deletion of account with active transactions. Blocks deletion of category with positive available balance or transactions. Blocks direct deletion of credit payment category.
   - Assert `SCEN-061`: Cascades deletion of credit card account and linked payment category when both have zero transactions and zero balance.
   - Assert `SCEN-062`: Blocks deletion of non-empty category group; plans deletion for empty group.
3. Refactor `src/storage/ledgerRepository.ts` (`SQLiteLedgerRepository`):
   - Replace manual 9-step query dance with `EntityManager.planAccountDeletion` and execute the returned plan within `db.withTransactionSync`.
   - Update `deleteCategory`, `deleteCategoryGroup`, and `createAccount` to consume `EntityManager`.
4. Refactor `src/storage/supabase/supabaseLedgerRepository.ts` (`SupabaseLedgerRepository`):
   - Replace manual query orchestration with `EntityManager.planAccountDeletion`.
   - Apply the resulting plan to the local cache and remote Supabase tables.
5. Clean up `src/domain/ledger/entityOperations.ts`, re-exporting or replacing obsolete micro-functions.

---

## Verification Criteria

- [ ] `EntityManager` passes all unit tests for `SCEN-060`, `SCEN-061`, and `SCEN-062`.
- [ ] `SQLiteLedgerRepository` and `SupabaseLedgerRepository` execute entity CRUD via mutation plans.
- [ ] No regression in `ledgerRepository.entityCrud.test.ts`.
