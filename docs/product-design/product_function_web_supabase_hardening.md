# Product Function Model: Web Supabase Hardening ($y = f(x)$)

## 1. Input Situation ($x$)
- **Context**: A user accesses Almotacen on the web (`Platform.OS === 'web'`).
- **Trigger**: New or returning user visits `http://localhost:8081` (or hosted web deployment).
- **Current Friction / Failure Modes**:
  1. If a new user lands on `/onboarding`, the wizard invokes raw `getDatabase()` (SQLite), throwing `DatabaseInitializationError` and crashing the application.
  2. If data is modified in another tab or device, the active tab remains stale indefinitely until hard refresh.
  3. Postgres RLS re-evaluates `auth.uid()` on every row scan, degrading query throughput.
  4. If a user signs in to an existing account from an anonymous session, budget state is not reactively re-hydrated.
  5. Developers and CI face broken test suites due to TypeScript 7 mismatch with `ts-jest`, and lack `.env.example` and local Supabase CLI configuration.

---

## 2. Output Situation ($y$)
- **Goal State**:
  1. New web users seamlessly complete onboarding or explore demo data; budget allocations persist to remote Supabase Postgres and in-memory cache without SQLite dependencies.
  2. Multi-tab and multi-device budgeting reflects changes across clients within 200ms via debounced coalesced realtime re-hydration without WebSocket math glitches.
  3. Postgres RLS executes via single-lookup `InitPlan` (`(select auth.uid()) = user_id`) gated `TO authenticated`, with indexed foreign keys and publication to `supabase_realtime`.
  4. Auth state listener reactively manages session lifecycle: claiming accounts preserves user UUID and data; switching accounts cleanly re-hydrates the new user's budget.
  5. Test runner `./init.sh` executes 100% green; local developer environment runs with zero friction via `.env.example`, `supabase/config.toml`, and standard npm scripts.

---

## 3. Minimal Transformation Function ($f(x) \rightarrow y$)
The system transforms $x$ to $y$ via 5 decoupled architectural mechanisms:
1. **$f_1$ (Tooling Stabilization)**: Pin `typescript` to `~6.0.3` (Expo SDK 57 supported baseline), configure local Supabase Docker runtime with anonymous auth enabled, and document environment secrets in `.env.example`.
2. **$f_2$ (Storage Seam Unification)**: Elevate `commitOnboardingConfig` to `LedgerRepository`. Connect `useOnboardingWizard` to `getRepository()`, executing optimistic cache mutation and remote Postgres upsert on Web.
3. **$f_3$ (Schema Hardening)**: Deploy additive migration `20260930_optimize_rls_and_realtime.sql` providing `TO authenticated`, cached `(select auth.uid())` predicates, foreign key indexes, and `supabase_realtime` publication.
4. **$f_4$ (Coalesced Realtime Sync)**: Implement `supabase.channel` listener in `SupabaseLedgerRepository` with 200ms debounce and active-tab echo suppression.
5. **$f_5$ (Auth Lifecycle Listener)**: Subscribe to `onAuthStateChange`, cleanly resetting and re-hydrating in-memory state on identity swap while preserving existing data on account claiming.
