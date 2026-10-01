# Archive Report: Web Supabase Hardening (Phase 2)

- **Change**: `web-supabase-hardening`
- **Archived Date**: `2026-09-30`
- **Lifecycle Status**: COMPLETED & MERGED
- **Target Branch**: `main`

---

## 1. Executive Summary
The `web-supabase-hardening` change has been fully planned, implemented via Red ➔ Green ➔ Refactor TDD across five atomic tickets, verified across review gates, and merged into `main`. The change hardens the web architecture, developer tooling, database security, and cloud synchronization for Almotacen:
- **Compiler Baseline & Tooling**: Reverted TypeScript to `~6.0.3` to restore `ts-jest` runner compatibility, documented credentials in `.env.example`, established `supabase/config.toml` for local Docker Supabase, and added `supabase:start|stop|reset` convenience scripts.
- **Platform-Agnostic Onboarding Seam**: Elevated `commitOnboardingConfig` to the `LedgerRepository` interface and refactored `useOnboardingWizard` away from SQLite, enabling end-to-end first-run onboarding on web with remote Postgres batch upserts.
- **Database Optimization & InitPlan RLS**: Authored migration `20260930_optimize_rls_and_realtime.sql` indexing foreign keys (`categories.credit_account_id`, `transactions.transfer_account_id`), hardening all 20 RLS policies with `TO authenticated` and `((select auth.uid()) = user_id)` InitPlan execution, and idempotently enrolling tables in `supabase_realtime`.
- **Coalesced Realtime Synchronization**: Wired `client.channel('user-ledger')` into `SupabaseLedgerRepository` with 200ms debounce coalescing and local mutation write counter echo suppression (`SCEN-014`, `SCEN-015`).
- **Reactive Auth Lifecycle & Identity Switching**: Implemented `onAuthStateChange` listener in client and store, flushing in-memory cache and re-hydrating on user identity changes (`SCEN-016`), with zero data loss during anonymous account claiming (`SCEN-017`).

---

## 2. Delivered Tracer-Bullet Tickets
| Ticket | Title | Pull Request | Status | Bound Scenarios |
|---|---|---|---|---|
| **01** | Compiler Baseline, Local Tooling & DX | [PR #62](https://github.com/cesarchavezcal/almotacen/pull/62) | Complete ✅ | `SCEN-009` |
| **02** | Platform-Agnostic Onboarding Storage Seam | [PR #65](https://github.com/cesarchavezcal/almotacen/pull/65) | Complete ✅ | `SCEN-010`, `SCEN-011` |
| **03** | DB Optimization, RLS InitPlan & Realtime DDL | [PR #66](https://github.com/cesarchavezcal/almotacen/pull/66) | Complete ✅ | `SCEN-012`, `SCEN-013` |
| **04** | Coalesced Realtime Synchronization | [PR #67](https://github.com/cesarchavezcal/almotacen/pull/67) | Complete ✅ | `SCEN-014`, `SCEN-015` |
| **05** | Auth Lifecycle & Identity Switching | [PR #68](https://github.com/cesarchavezcal/almotacen/pull/68) | Complete ✅ | `SCEN-016`, `SCEN-017` |

---

## 3. Specs & Baseline Status
- **Behavioral Contracts**: All 9 acceptance scenarios in `spec-tests.md` (`SCEN-009` through `SCEN-017`) verified via automated test suites:
  - `SCEN-009`: Tooling alignment & TypeScript baseline.
  - `SCEN-010`: Web onboarding commitment without SQLite dependencies.
  - `SCEN-011`: Zero-based envelope balance invariant on cloud commitment.
  - `SCEN-012`: Postgres RLS InitPlan performance & authenticated role gating.
  - `SCEN-013`: Foreign key indexing & cascade delete scan optimization.
  - `SCEN-014`: Multi-tab coalesced realtime broadcast synchronization.
  - `SCEN-015`: Local mutation echo suppression.
  - `SCEN-016`: Clean budget flush and re-hydration on account switch.
  - `SCEN-017`: Zero-data-loss identity claiming for anonymous accounts.

---

## 4. Verification Evidence
- **Automated Test Suite**: 283/283 Jest tests passing across all 35 test suites via `./init.sh`.
- **TypeScript Compilation**: `tsc --noEmit` clean pass with 0 errors.
- **Review Gates**: Two-Axis Code Reviews completed across all tickets.
- **Task Completion Gate**: 100% of tasks in `tasks.md` and ticket files completed.
