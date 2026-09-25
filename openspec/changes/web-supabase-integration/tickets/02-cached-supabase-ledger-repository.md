# Ticket 02: Cached Supabase Ledger Repository

## Metadata
- **Change**: `web-supabase-integration`
- **Bound Scenarios**: [`SCEN-004`](../spec-tests.md#scen-004-cache-hydration-on-launch), [`SCEN-005`](../spec-tests.md#scen-005-zero-latency-synchronous-store-reads), [`SCEN-006`](../spec-tests.md#scen-006-optimistic-outflow-mutation), [`SCEN-007`](../spec-tests.md#scen-007-optimistic-mutation-rollback-on-network-rejection)
- **Status**: Ready

---

## 1. Objective
Implement `SupabaseLedgerRepository` satisfying the `LedgerRepository` interface. It holds an in-memory `BudgetState` cache to support synchronous 60fps reads (`useSyncExternalStore`), executes pure domain operations locally, and writes mutations to Supabase Postgres asynchronously with optimistic rollback on error.

---

## 2. Acceptance Criteria
1. **Contract Compliance**: `SupabaseLedgerRepository` implements all methods of `LedgerRepository` (`getBudgetState`, `getCategoryGroups`, `postOutflow`, `postInflow`, `allocateEnvelope`, `postCreditCardPayment`, `performMonthRollover`, `applyAutoAssign`, `rebalanceCategoryFunds`, `createAccount`, `updateAccount`, `deleteAccount`, `createCategoryGroup`, `updateCategoryGroup`, `deleteCategoryGroup`, `createCategory`, `updateCategory`, `deleteCategory`, `resetDatabase`, `factoryReset`, `clearTransactionsOnly`, `seedDemoData`, `getDiagnostics`).
2. **Synchronous Reads**: `getBudgetState()` and `getCategoryGroups()` return the in-memory cache synchronously.
3. **Async Hydration**: `initializeAsync()` queries Supabase for all user records, maps rows to domain entities, populates the cache, and computes initial `ready_to_assign_cents`.
4. **Optimistic Updates**: Mutations compute the new state using pure domain logic (`ledgerEngine.ts`, `entityOperations.ts`), update the cache immediately, notify subscribers, and fire background Postgres upsert/insert/delete queries.
5. **Rollback Resilience**: If a Supabase mutation promise rejects, the cache reverts to the pre-mutation snapshot, notifies subscribers, and dispatches a descriptive error.
6. **Testing**: Comprehensive tests with mocked Supabase client verifying hydration, all mutation types, and rollback on network failure.

---

## 3. Implementation Checklist
- [ ] Implement `src/storage/supabase/supabaseLedgerRepository.ts`.
- [ ] Implement mapping utilities between Postgres rows and Domain entities.
- [ ] Implement unit test suite `src/storage/supabase/__tests__/supabaseLedgerRepository.test.ts`.
- [ ] Run `./init.sh` to verify zero regression.
