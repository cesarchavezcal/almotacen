# Ticket 02: Remove Dead Port Hooks from Store

- **Change**: `deep-module-consolidation`
- **Ticket ID**: `02`
- **Bound Scenarios**: `SCEN-019`

---

## Objective
Remove unused port hook wrappers `useLedgerTransactions()`, `useEntityCatalog()`, and `useLedgerAdmin()` from `src/storage/useLedgerStore.ts`.

---

## Tasks
1. Remove exported functions `useLedgerTransactions`, `useEntityCatalog`, and `useLedgerAdmin` from `src/storage/useLedgerStore.ts`.
2. Clean up any unused imports.
3. Run `./init.sh` to confirm zero regression.

---

## Verification Criteria
- [ ] Dead port hooks removed from `src/storage/useLedgerStore.ts`.
- [ ] `./init.sh` executes with 0 errors.
