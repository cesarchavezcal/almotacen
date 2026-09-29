# Session Handoff: Almotacen (Oystercatcher)

**Date**: 2026-09-29  
**Current State**: Idle / Clean slate (Cycle `web-supabase-integration` fully closed & archived)  
**Base Commit**: Synced to `origin/main` (`8eb02bd`)  
**Workspace**: `/Users/cesaradalbertochavezcalderon/orca/workspaces/almotacen/oystercatcher`

---

## 1. Executive Summary & Context

The change `web-supabase-integration` has been delivered, reviewed across two axes, merged, and archived under `openspec/changes/archive/2026-09-28-web-supabase-integration/`. The project now possesses a production-ready hybrid storage architecture:
- **Web**: Supabase Postgres with anonymous session authentication (`signInAnonymously()`), RLS tenant isolation, and an in-memory caching repository (`SupabaseLedgerRepository`) providing zero-latency synchronous reads for `useSyncExternalStore` and background optimistic persistence with rollback safety.
- **Native (iOS / Android)**: Embedded SQLite (`expo-sqlite`) as primary local-first storage.
- **Bootstrapping**: Transparent repository resolution via platform factory in `src/storage/useLedgerStore.ts` and `useWebBootstrap` hook delaying splash screen until cache hydration completes.

All planning documents have been renamed to `✅_*.md` and archived under `docs/planning/archive/`.

---

## 2. Recent Merged Deliverables

| Deliverable | Pull Request | Merge Commit | Artifacts & Documentation |
|---|---|---|---|
| Ticket 01: Schema & Client | [PR #42](https://github.com/cesarchavezcal/almotacen/pull/42) | `2f1384e` | `supabase/migrations/20260925_init_ledger_schema.sql`, `src/storage/supabase/client.ts` |
| Ticket 02: Cached Supabase Repository | [PR #56](https://github.com/cesarchavezcal/almotacen/pull/56) | `4183bba` | `src/storage/supabase/supabaseLedgerRepository.ts`, unit test suite |
| Ticket 03: Platform Factory & Bootstrap | [PR #57](https://github.com/cesarchavezcal/almotacen/pull/57) | `8e3c61e` | `src/storage/useLedgerStore.ts`, `src/hooks/useWebBootstrap.ts`, `app/_layout.tsx` |
| Planning Documents Archival | [PR #58](https://github.com/cesarchavezcal/almotacen/pull/58) | `f372caa` | `docs/planning/archive/` |
| SDD Change Archival | [PR #59](https://github.com/cesarchavezcal/almotacen/pull/59) | `a175702` | `openspec/changes/archive/2026-09-28-web-supabase-integration/archive-report.md` |
| Progress Log Update | [PR #60](https://github.com/cesarchavezcal/almotacen/pull/60) | `8eb02bd` | `progress.md` |

---

## 3. Verification & Repository Health

- **Automated Test Suite**: 30/30 test suites passing, 236/236 unit and integration tests green via `./init.sh`.
- **Static Analysis**: `npx tsc --noEmit` clean pass with 0 errors.
- **Web Export**: `npx expo export --platform web` cleanly builds bundle.
- **Git Tree**: Clean working tree on `cesarchavezcal/oystercatcher`, fully in sync with `origin/main`.

---

## 4. Suggested Skills for Next Agent

When picking up the next task, the incoming agent should leverage these specialized skills:

1. **`autonomic`**: Run `/autonomic plan [idea]` to autonomously execute the 7-step architecture pipeline (Steps 1–6: Scoping, UX charts, specs, test contracts, IA/OOUX, and tickets).
2. **`harness`**: For executing single tickets using strict Red ➔ Green ➔ Refactor TDD with failure-first enumeration.
3. **`code-review`**: For two-axis code review (Axis 1: Spec Compliance vs `spec-tests.md`, Axis 2: Clean architecture and `.gga` standards).
4. **`expo-router`**: When developing or structuring navigation routes, stack layouts, or modals.
5. **`expo-ui` / `expo-native-ui`**: For native controls, sheets, and Apple HIG patterns.
6. **`supabase` / `supabase-postgres-best-practices`**: If adding new relational tables, RLS policies, or Supabase queries.
7. **`react-native-testing`**: For component, screen, and interaction tests using React Native Testing Library.
8. **`unslop`**: Mandatory gate for PR descriptions and documentation, removing AI boilerplate.

---

## 5. Critical Invariants & Rules

1. **Git & GitHub Identity**:
   - Ensure `git config user.name "cesarchavezcal"` and `git config user.email "cesarchavezcal@gmail.com"`.
   - GitHub CLI operations must bind `GH_TOKEN=$(gh auth token -u cesarchavezcal)` or execute `gh auth switch --user cesarchavezcal` to avoid 403 authorization rejections.
   - Never add `Co-Authored-By` or AI attribution to commits. Use conventional commits only.
2. **Anti-Tautology Invariant (Tests Before Code)**:
   - NEVER write unit tests after writing code. Tests must originate from specification contracts (`spec-tests.md`) before code is implemented.
3. **Integer Cents Discipline**:
   - All financial balances, transactions, and envelope calculations strictly use integer cents (`bigint` in Postgres, integer in TypeScript domain).
4. **Clean Architecture Boundaries**:
   - Domain layer (`src/domain/`) must never import SQLite, Supabase, or React dependencies. All persistence operations go through typed repository interfaces (`LedgerRepository`).
5. **No SQLite on Web**:
   - `getDatabase()` must never execute on web; all web persistence uses `SupabaseLedgerRepository`.

---

## 6. Next Session Startup Checklist

1. Run `./init.sh` to confirm baseline test suite and typecheck health.
2. Inspect `progress.md` and `openspec/` for active changes.
3. Query the user or inspect `feature_list.json` to select the next feature milestone.
4. Launch the next cycle via `/autonomic plan [idea]` or `/autonomic work [ticket]`.
