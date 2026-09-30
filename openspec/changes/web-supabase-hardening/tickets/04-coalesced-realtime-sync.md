# Ticket 04: Coalesced Realtime Synchronization

- **Change**: `web-supabase-hardening`
- **Ticket ID**: `04`
- **Bound Scenarios**: `SCEN-014`, `SCEN-015`

---

## Objective
Implement multi-tab and multi-device realtime synchronization inside `SupabaseLedgerRepository`. Subscribe to table change events via `supabase.channel('user-ledger')`, filter out loopback echoes from local writes using an active mutation sequence counter, and trigger debounced (200ms) cache re-hydration to keep zero-based budget calculations mathematically consistent.

---

## Tasks
1. In `SupabaseLedgerRepository`:
   - Initialize channel subscription to `postgres_changes` on schema `public` filtered by `user_id = eq.${this.userId}` upon successful `initializeAsync()`.
   - Maintain `private activeWriteCount = 0;` to track in-flight local optimistic mutations.
2. In `executeOptimisticMutation`:
   - Increment `activeWriteCount++` before sending remote queries.
   - In the channel event handler:
     - If `activeWriteCount > 0`, decrement `activeWriteCount--` and suppress the event.
     - If `activeWriteCount === 0`, schedule or reset a 200ms debounce timer for `rehydrateFromRemote()`.
3. Implement `rehydrateFromRemote()`:
   - Perform batch fetch of `accounts`, `category_groups`, `categories`, `transactions`, `metadata`.
   - Reconstruct domain `BudgetState` and `CategoryGroup[]`.
   - Fire `this.notify()` to alert `useSyncExternalStore` listeners.
4. Implement `dispose()` / `unsubscribeRealtime()` method to cleanly close the channel.
5. Author unit and integration tests verifying channel event dispatch, debounce coalescing, and echo suppression.

---

## Verification Criteria
- [ ] Remote table events trigger cache re-hydration after 200ms debounce.
- [ ] In-flight local mutations suppress their own WebSocket echo events.
- [ ] `notify()` is invoked when remote changes arrive, updating React UI.
