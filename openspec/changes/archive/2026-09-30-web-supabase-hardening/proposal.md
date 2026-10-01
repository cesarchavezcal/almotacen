# Proposal: Web Supabase Hardening (Phase 2)

## 1. Problem Statement
Phase 1 established the initial Supabase schema and `SupabaseLedgerRepository` for web execution. However, critical operational and architectural gaps remain:
1. **Web Onboarding Crash**: `useOnboardingWizard` is coupled to SQLite `getDatabase()`, crashing on browser startup and preventing new web users from completing setup or demo exploration.
2. **Missing Realtime Sync**: Modifications made across multiple browser tabs or devices do not synchronize in realtime, leaving client caches stale until hard page reload.
3. **Suboptimal RLS & Missing Indexes**: Postgres RLS policies evaluate `auth.uid()` per row rather than once per query via `InitPlan`, and foreign keys lack dedicated indexes.
4. **Auth Lifecycle Gaps**: Lack of reactive `onAuthStateChange` handling causes identity swaps to leave stale in-memory data active.
5. **Tooling & Test Runner Failures**: TypeScript compiler version mismatch breaks `ts-jest` and `./init.sh`, and local environment setup lacks `.env.example` and `supabase/config.toml`.

---

## 2. Proposed Solution
Hardening the web Supabase integration across 5 coordinated pillars:
1. **Tooling & Harness Baseline**: Revert `typescript` in `package.json` to `~6.0.3` to restore `ts-jest` and `./init.sh`. Add `.env.example`, `supabase/config.toml` (with anonymous auth enabled), and standard Supabase npm scripts.
2. **Repository-Agnostic Onboarding**: Elevate `commitOnboardingConfig` to the `LedgerRepository` interface. Update `useOnboardingWizard` to consume `getRepository()`, enabling seamless web onboarding with optimistic local updates and remote Supabase batch persistence.
3. **Database Performance & Realtime Publication**: Deploy additive migration `20260930_optimize_rls_and_realtime.sql` applying `TO authenticated`, `USING ((select auth.uid()) = user_id)`, foreign key indexes on `credit_account_id` and `transfer_account_id`, and `ALTER PUBLICATION supabase_realtime ADD TABLE ...`.
4. **Coalesced Realtime Synchronization**: Implement `supabase.channel('user-ledger')` in `SupabaseLedgerRepository`, suppressing local tab write echoes and debouncing remote modification signals by 200ms before re-hydrating `BudgetState`.
5. **Auth Lifecycle & Identity Switching**: Listen to `supabase.auth.onAuthStateChange` to cleanly reset and re-hydrate cache upon user identity changes, while guaranteeing zero-data-loss when claiming anonymous accounts via `updateUser` or `linkIdentity`.

---

## 3. Success Criteria
- [ ] Running `npx expo start --web` boots and allows new users to complete onboarding and seed demo data without SQLite errors.
- [ ] Multiple browser tabs or devices viewing the same user ledger reflect modifications within 200ms without mathematical distortion.
- [ ] Postgres RLS policies execute as `InitPlan` queries gated `TO authenticated`, with zero linter warnings.
- [ ] Signing in to an existing account cleanly flushes and re-hydrates the active user's budget state.
- [ ] `./init.sh` runs cleanly with 100% test pass rate across all test suites and 0 TypeScript compilation errors.
