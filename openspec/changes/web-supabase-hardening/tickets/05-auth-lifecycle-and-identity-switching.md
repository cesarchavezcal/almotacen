# Ticket 05: Auth Lifecycle & Identity Switching

- **Change**: `web-supabase-hardening`
- **Ticket ID**: `05`
- **Bound Scenarios**: `SCEN-016`, `SCEN-017`

---

## Objective
Establish a reactive auth lifecycle handler listening to `supabase.auth.onAuthStateChange`. Ensure that when a user switches identities, the local repository instance flushes prior budget data and re-hydrates the incoming user's cloud records. Confirm that account claiming via `updateUser` or `linkIdentity` preserves user UUID with zero data loss.

---

## Tasks
1. In `src/storage/supabase/client.ts`:
   - Expose `onAuthStateChange` helper or hook for application lifecycle integration.
2. In `src/storage/useLedgerStore.ts`:
   - Listen to auth state transitions.
   - When `session?.user?.id` changes from `currentUserId`:
     - Clear `repositoryInstance` and state snapshots.
     - Call `bootstrapWeb()` for the new user identity.
     - Trigger UI store listeners to re-render with the new user's budget.
3. Verify account claiming behavior:
   - When an anonymous user claims their account with `updateUser({ email, password })`, confirm that `session.user.id` remains identical and `SupabaseLedgerRepository` retains active state.
4. Author integration tests verifying auth state transition behavior and full test suite pass via `./init.sh`.

---

## Verification Criteria
- [ ] Switching accounts flushes old budget data and loads new account's data.
- [ ] Claiming an account preserves existing budget records.
- [ ] `./init.sh` executes with 100% test pass rate and 0 typecheck errors.
