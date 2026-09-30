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
   - Dispatch background idempotent batch upserts to Supabase tables (`category_groups`, `accounts`, `categories`, and `metadata`) without destructive deletions.
4. Refactor `src/hooks/useOnboardingWizard.ts`:
   - Accept optional `customRepo?: LedgerRepository` defaulting to `getRepository()`.
   - In `executeCommitOnboarding`, validate inputs using domain `validateOnboardingConfig(params)` and pass the resulting `ValidatedOnboardingConfig` to `repo.commitOnboardingConfig(config)`.
   - In `executeExploreDemo`, call `repo.seedDemoData()` directly on `LedgerRepository`.
5. Author tests in `src/storage/__tests__/onboardingSeam.test.ts` and `src/hooks/__tests__/useOnboardingWizard.test.ts` verifying web onboarding completes with mocked Supabase client and zero SQLite dependencies.

---

## Verification Criteria
- [x] Onboarding wizard runs on Web without invoking `getDatabase()`.
- [x] In-memory `BudgetState` reflects new accounts and allocated envelopes immediately upon commitment.
- [x] `repo.isOnboardingCompleted()` returns `true` post-commitment.
- [x] All unit and component tests pass.
