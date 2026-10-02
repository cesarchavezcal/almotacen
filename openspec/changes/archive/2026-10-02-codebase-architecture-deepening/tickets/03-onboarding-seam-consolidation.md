# Ticket 03: Onboarding Seam Consolidation & Guard Decoupling

- **Change**: `codebase-architecture-deepening`
- **Ticket ID**: `03`
- **Bound Scenarios**: `SCEN-064`

---

## Objective

Eliminate the orphaned `SQLiteOnboardingRepository` wrapper by moving SQL transaction logic directly into `SQLiteLedgerRepository.commitOnboardingConfig()`. Decouple `useOnboardingGuard` so it checks onboarding status strictly through the repository seam, removing all references to `DatabaseAdapter`.

---

## Tasks

1. In `src/storage/ledgerRepository.ts` (`SQLiteLedgerRepository`):
   - Move SQL statements from `src/storage/onboardingRepository.ts` directly into `commitOnboardingConfig`.
   - Remove instantiation of `new SQLiteOnboardingRepository(this.db)`.
2. Delete `src/storage/onboardingRepository.ts`.
3. Refactor `src/hooks/useOnboardingGuard.ts`:
   - Simplify `checkOnboardingStatus`:
     ```typescript
     export function checkOnboardingStatus(): boolean {
       const repo = getRepository();
       return repo.isOnboardingCompleted();
     }
     ```
   - Remove `db?: DatabaseAdapter` parameter from `useOnboardingGuard` and `checkOnboardingStatus`.
   - Purge `import { DatabaseAdapter } from '../storage/types'`.
4. Update callers and tests:
   - Update `app/_layout.tsx`: call `useOnboardingGuard()` without arguments.
   - Update `src/hooks/__tests__/useOnboardingGuard.test.ts` to test against repository mock rather than low-level database adapter.
5. Author tests asserting `SCEN-064`.

---

## Verification Criteria

- [ ] `src/storage/onboardingRepository.ts` is deleted.
- [ ] `useOnboardingGuard.ts` has zero imports or usages of `DatabaseAdapter`.
- [ ] Onboarding status check works identically on native (SQLite) and web (Supabase).
