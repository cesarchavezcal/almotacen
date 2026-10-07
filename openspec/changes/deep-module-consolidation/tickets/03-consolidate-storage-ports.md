# Ticket 03: Consolidate Storage Ports into Unified Repository Seam

- **Change**: `deep-module-consolidation`
- **Ticket ID**: `03`
- **Bound Scenarios**: `SCEN-020`

---

## Objective
Inline method signatures from `ports/ledgerTransactionsPort.ts`, `ports/entityCatalogPort.ts`, and `ports/ledgerAdminPort.ts` directly into `LedgerRepository` in `src/storage/types.ts`. Remove the speculative `src/storage/ports/` directory and refactor `portSegregation.test.ts` into a unified `repositoryContract.test.ts`.

---

## Tasks
1. Inline transaction, entity catalog, and admin method declarations into `interface LedgerRepository` in `src/storage/types.ts`.
2. Delete directory `src/storage/ports/`.
3. Update imports in `src/storage/types.ts`, `src/storage/ledgerRepository.ts`, `src/storage/supabase/supabaseLedgerRepository.ts`, etc.
4. Refactor `src/storage/__tests__/portSegregation.test.ts` into `src/storage/__tests__/repositoryContract.test.ts` asserting against `LedgerRepository`.
5. Run `./init.sh` to confirm all SQLite and Supabase tests pass.

---

## Verification Criteria
- [x] `src/storage/ports/` deleted.
- [x] `LedgerRepository` is the single canonical seam.
- [x] `./init.sh` executes with 100% test pass.
