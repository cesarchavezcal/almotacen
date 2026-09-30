# Ticket 02: Platform-Agnostic Onboarding Storage Seam

- **Change**: `web-supabase-hardening`
- **Ticket ID**: `02`
- **Bound Scenarios**: `SCEN-010`, `SCEN-011`

---

## Objective
Decouple `useOnboardingWizard` from direct SQLite calls (`getDatabase()`). Elevate `commitOnboardingConfig` to the unified `LedgerRepository` interface and implement it across both `SQLiteLedgerRepository` and `SupabaseLedgerRepository`, allowing new web users to complete onboarding and explore demo data without errors.

---

## Tasks
1. Extend `LedgerRepository` interface in `src/storage/types.ts`:
   - `commitOnboardingConfig(config: ValidatedOnboardingConfig): void;`
2. Implement `commitOnboardingConfig` in `src/storage/ledgerRepository.ts` (`SQLiteLedgerRepository`):
   - Wrap in `withTransactionSync` to insert checking account, optional credit account & category, initial category allocations, and `metadata (onboarding_completed: true)`.
3. Implement `commitOnboardingConfig` in `src/storage/supabase/supabaseLedgerRepository.ts`:
   - Use `executeOptimisticMutation` to update in-memory `BudgetState` (readyToAssignCents, accounts, categories) immediately.
   - Dispatch background batch inserts to Supabase tables (`accounts`, `category_groups`, `categories`, and `metadata`).
4. Refactor `src/hooks/useOnboardingWizard.ts`:
   - Accept optional `customRepo?: LedgerRepository` defaulting to `getRepository()`.
   - In `handleCommit`, call `repo.commitOnboardingConfig(params)` instead of `executeCommitOnboarding(db, ...)`.
   - In `handleExploreDemo`, call `repo.seedDemoData()` instead of `seedDemoData(db)`.
5. Author tests in `src/storage/__tests__/` and `src/hooks/__tests__/` verifying web onboarding completes with mocked Supabase client and zero SQLite dependencies.

---

## Verification Criteria
- [ ] Onboarding wizard runs on Web without invoking `getDatabase()`.
- [ ] In-memory `BudgetState` reflects new accounts and allocated envelopes immediately upon commitment.
- [ ] `repo.isOnboardingCompleted()` returns `true` post-commitment.
- [ ] All unit and component tests pass.
