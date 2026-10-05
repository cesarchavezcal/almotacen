# Ticket 01: Delete entityOperations.ts Pass-Through

- **Change**: `deep-module-consolidation`
- **Ticket ID**: `01`
- **Bound Scenarios**: `SCEN-018`

---

## Objective
Delete `src/domain/ledger/entityOperations.ts`, which is a 9-line empty re-export with zero callers. Ensure all entity operations use `EntityManager` directly.

---

## Tasks
1. Confirm zero references to `src/domain/ledger/entityOperations.ts` in `src/` and `app/`.
2. Delete `src/domain/ledger/entityOperations.ts`.
3. Run `./init.sh` to confirm 100% test pass.

---

## Verification Criteria
- [x] `src/domain/ledger/entityOperations.ts` is deleted.
- [x] `./init.sh` executes with 0 errors.
