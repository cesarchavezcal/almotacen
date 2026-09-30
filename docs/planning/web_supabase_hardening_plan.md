# Implementation Plan: Web Supabase Hardening (Phase 2)

## Executive Summary
This plan delivers the 5 agreed-upon hardening actions to make Almotacen's Supabase integration production-grade, secure, performant, and fully operational on Web.

---

## 1. Problem & Architecture Overview
- **Storage Seam**: Elevates `commitOnboardingConfig` to `LedgerRepository`, removing SQLite `getDatabase()` hard dependencies from `useOnboardingWizard.ts`.
- **Realtime Sync**: Introduces coalesced 200ms debounced re-hydration with local mutation echo filtering via `supabase.channel('user-ledger')`.
- **Database & RLS**: Adds migration `20260930_optimize_rls_and_realtime.sql` applying `TO authenticated`, subquery `(select auth.uid())` InitPlan caching, foreign key indexes, and Realtime table publication.
- **Auth Lifecycle**: Reactive `onAuthStateChange` handling clean budget re-hydration on identity change, with zero-data-loss claiming via `updateUser`.
- **Tooling Baseline**: Restores `typescript: ~6.0.3` for `ts-jest` / `./init.sh` green pass, adds `.env.example`, `supabase/config.toml`, and CLI npm scripts.

---

## 2. Tracer-Bullet Tickets & Scenario Mapping

| Ticket | Title | Bound Scenarios | Primary Deliverables |
|---|---|---|---|
| **01** | Compiler Baseline, Local Tooling & DX | `SCEN-009` | Pin TS `~6.0.3` + `.env.example` + `supabase/config.toml` + scripts |
| **02** | Platform-Agnostic Onboarding Storage Seam | `SCEN-010`, `SCEN-011` | `commitOnboardingConfig` on `LedgerRepository` + refactor wizard |
| **03** | DB Optimization, RLS InitPlan & Realtime DDL | `SCEN-012`, `SCEN-013` | Migration `20260930_optimize_rls_and_realtime.sql` |
| **04** | Coalesced Realtime Synchronization | `SCEN-014`, `SCEN-015` | `SupabaseLedgerRepository` channel + echo suppression |
| **05** | Auth Lifecycle & Identity Switching | `SCEN-016`, `SCEN-017` | `onAuthStateChange` listener + clean budget re-hydration |

---

## 3. Strict TDD Verification Plan
1. **Red Phase**: Author failing tests for each scenario (`SCEN-009` through `SCEN-017`) verifying:
   - TypeScript compiler pass with ts-jest runner.
   - Web onboarding completing and populating in-memory cache without SQLite errors.
   - Realtime channel event broadcast triggering debounced re-hydration and filtering local echoes.
   - Auth state transitions resetting cache and loading new user data.
2. **Green Phase**: Implement minimal production code across `package.json`, `src/storage/`, `src/hooks/`, `supabase/migrations/`.
3. **Refactor Phase**: Optimize error handling, type guards, and subscription cleanups.
4. **Harness Gate**: Execute `./init.sh` ensuring exit code 0 (`tsc --noEmit` clean, 100% tests pass).
