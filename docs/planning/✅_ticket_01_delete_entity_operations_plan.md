# Implementation Plan: Ticket 01 — Delete entityOperations.ts Pass-Through

- **Change**: `deep-module-consolidation`
- **Ticket ID**: `01`
- **Bound Scenarios**: `SCEN-018`
- **Branch Target**: `chore/CCH/ALM-030-delete-entity-operations`

---

## 1. Objective & Scope
Eliminate the shallow pass-through re-export file `src/domain/ledger/entityOperations.ts`. Ensure that all callers within the domain and storage layers interact with `EntityManager` directly from `src/domain/ledger/entityManager.ts` without intermediary alias files.

---

## 2. Preflight Audit
1. **Import Audit**: Run `git grep "entityOperations"` to confirm zero active consumers depend on this alias.
2. **Export Inventory**:
   `src/domain/ledger/entityOperations.ts` exports:
   - `EntityManager`
   - `EntityMutationPlan`, `AccountCreationPlan`, `PlanAccountDeletionParams`, `PlanCategoryDeletionParams`, `PlanCategoryGroupDeletionParams`
   All of these originate directly in `src/domain/ledger/entityManager.ts`.
3. **Consumers Audit**:
   - `src/storage/ledgerRepository.ts` imports directly from `../domain/ledger/entityManager`.
   - `src/storage/supabase/supabaseLedgerRepository.ts` imports directly from `../../domain/ledger/entityManager`.
   - `src/domain/ledger/entityManager.test.ts` tests `entityManager.ts` directly.
   - Zero consumers import `entityOperations.ts`.

---

## 3. Implementation Steps

### Step 1: Preflight Verification Test
- Verify existing test coverage in `src/domain/ledger/entityManager.test.ts` and `src/storage/ledgerRepository.entityCrud.test.ts`.
- Ensure all 14 tests covering `SCEN-002` through `SCEN-015` run cleanly.

### Step 2: Remove the Shallow Module
- Delete `src/domain/ledger/entityOperations.ts`.

### Step 3: Verification & Health Check
- Run `./init.sh` to ensure:
  - `tsc --noEmit` exits with 0 errors.
  - All 35 test suites pass with 283+ tests.
- Verify `git status` reflects only the deletion of `src/domain/ledger/entityOperations.ts`.

### Step 4: Two-Axis Review & PR
- Run `.gga` pre-commit review.
- Commit: `chore(domain): delete shallow entityOperations pass-through alias (ALM-030)`
- Push branch `chore/CCH/ALM-030-delete-entity-operations`.
- Open PR, run Two-Axis Review (Standards + Spec), and merge into `main`.

---

## 4. Verification Evidence
- [ ] `git grep "entityOperations"` returns 0 results across `src/` and `app/`.
- [ ] `./init.sh` completes with 0 errors and 100% test pass rate.
- [ ] `tasks.md` Ticket 01 checked off.
