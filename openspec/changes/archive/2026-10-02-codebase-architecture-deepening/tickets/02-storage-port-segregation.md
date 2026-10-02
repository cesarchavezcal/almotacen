# Ticket 02: Storage Port Segregation & Store Streamlining

- **Change**: `codebase-architecture-deepening`
- **Ticket ID**: `02`
- **Bound Scenarios**: `SCEN-063`

---

## Objective

Decompose the monolithic 25-method `LedgerRepository` into segregated, cohesive domain ports (`LedgerTransactionsPort`, `EntityCatalogPort`, `LedgerAdminPort`). Streamline `useLedgerStore.ts` by eliminating 18 shallow pass-through callbacks while maintaining backwards compatibility for existing UI callers.

---

## Tasks

1. Create port definitions in `src/storage/ports/`:
   - `ledgerTransactionsPort.ts`: Outflows, inflows, envelope allocations, transfers, month rollovers.
   - `entityCatalogPort.ts`: Accounts, category groups, categories CRUD operations.
   - `ledgerAdminPort.ts`: Diagnostics, factory resets, demo data seeding, and onboarding configuration commit.
2. Update `src/storage/types.ts`:
   - Compose `LedgerRepository` interface as an intersection of the three ports:
     ```typescript
     export interface LedgerRepository extends LedgerTransactionsPort, EntityCatalogPort, LedgerAdminPort {}
     ```
3. Refactor `src/storage/useLedgerStore.ts`:
   - Eliminate repetitive individual `useCallback` forwarders for each method.
   - Dispatch calls directly through a memoized repository reference, calling `notifyListeners()` on state mutations.
   - Maintain the existing `UseLedgerStoreResult` contract so screens in `app/(tabs)/` and `app/settings/` continue operating without breaking changes.
4. Author test suite `src/storage/__tests__/portSegregation.test.ts`:
   - Verify `SCEN-063`: Operations dispatch cleanly through segregated ports and notify subscribers.

---

## Verification Criteria

- [ ] `LedgerRepository` is composed of segregated, narrow ports.
- [ ] `useLedgerStore.ts` boilerplate shrinks by > 150 lines.
- [ ] All tab navigation and settings screens function with zero typecheck or runtime errors.
