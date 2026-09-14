# Implementation Plan: Ticket 01 - Decouple Clean Database Initialization & Demo Seeder

**Ticket Reference**: `ALM-013` (Ticket 01 of User Onboarding)  
**Bound Scenarios**: `SCEN-047`, `SCEN-052`  
**Target Branch**: `feature/CCH/ALM-013-user-onboarding-wizard`

---

## 1. Context & Motivation

Currently, `initializeDatabase(db)` in `src/storage/schema.ts` automatically runs `seedDatabase(db, DEFAULT_SEED_DATA)` whenever `metadata.schema_version` is missing. This couples table creation with dummy data insertion (`Titanium Checking`, `Apple Card`, and dummy categories).

For the **User Onboarding Wizard**, new installations must initialize to a **clean slate** (zero accounts, zero categories, zero transactions) with `metadata.onboarding_completed = 'false'`. An explicit "Explore with Demo Data" action or test environment will invoke a standalone `seedDemoData(db)` helper.

---

## 2. Behavioral Contracts

- **`SCEN-047` (First-Run Clean Initialization)**:
  - Invoking `initializeDatabase(db)` on an uninitialized database executes `CREATE_TABLES_SQL`.
  - Sets `metadata`:
    - `schema_version = '2'`
    - `ready_to_assign_cents = '0'`
    - `onboarding_completed = 'false'`
  - Accounts, categories, category groups, and transactions remain completely empty (`COUNT = 0`).
  - `isOnboardingCompleted(db)` returns `false`.

- **`SCEN-052` (Explicit Demo Seeder Shortcut)**:
  - Invoking `seedDemoData(db)` populates `DEFAULT_SEED_DATA` (or passed custom seed).
  - Sets `metadata.onboarding_completed = 'true'`.
  - Sets `metadata.ready_to_assign_cents = '50000'` (matching default seed unassigned cash).
  - `isOnboardingCompleted(db)` returns `true`.

- **Idempotency & Safe Upgrades**:
  - Re-running `initializeDatabase(db)` on an initialized database preserves existing records and does not overwrite `onboarding_completed`.

- **Test Suite Backward Compatibility**:
  - Update `createTestDatabase(options?: { seed?: boolean })` in `src/storage/testDatabase.ts` with `seed: true` by default so existing unit tests (e.g., `ledgerRepository.test.ts`) continue to pass without modification.
  - Expose `createCleanTestDatabase()` or allow passing `{ seed: false }` for clean onboarding tests.

---

## 3. Proposed Changes

### Storage Layer (`src/storage/schema.ts`)
- Update `initializeDatabase(db: DatabaseAdapter)`:
  - Create tables via `CREATE_TABLES_SQL`.
  - Check `metadata.schema_version`.
  - If missing (first run):
    - Insert `schema_version = '2'`.
    - Insert `ready_to_assign_cents = '0'`.
    - Insert `onboarding_completed = 'false'`.
    - Do **not** call `seedDatabase`.
  - If present:
    - Run existing version migrations (e.g., v1 -> v2) if applicable.
- Add helper `isOnboardingCompleted(db: DatabaseAdapter): boolean`:
  - `SELECT value FROM metadata WHERE key = 'onboarding_completed'`.
  - Returns `true` if `value === 'true'`, otherwise `false`.
- Add helper `setOnboardingCompleted(db: DatabaseAdapter, completed: boolean): void`:
  - `INSERT OR REPLACE INTO metadata (key, value) VALUES ('onboarding_completed', ?)`
- Export `seedDemoData(db: DatabaseAdapter, seed?: SeedData)`:
  - Executes `seedDatabase(db, seed)`.
  - Sets `onboarding_completed = 'true'`.

### Test Helpers (`src/storage/testDatabase.ts`)
- Update `createTestDatabase(options: { seed?: boolean } = { seed: true })`:
  - Initializes database with `initializeDatabase(adapter)`.
  - If `options.seed !== false`, calls `seedDemoData(adapter)`.
- Export `createCleanTestDatabase()` as a convenience wrapper for `createTestDatabase({ seed: false })`.

### Tests (`src/storage/__tests__/cleanInitialization.test.ts`)
- TDD suite verifying:
  1. `initializeDatabase` leaves accounts, categories, and transactions with 0 rows.
  2. `isOnboardingCompleted(db)` returns `false` on clean init.
  3. `setOnboardingCompleted(db, true)` updates `isOnboardingCompleted(db)` to `true`.
  4. `seedDemoData(db)` populates demo accounts/categories and sets `isOnboardingCompleted(db)` to `true`.
  5. Running `initializeDatabase(db)` multiple times is idempotent and does not wipe data or reset `onboarding_completed`.

---

## 4. Execution Plan (TDD First)

1. **RED**: Create `src/storage/__tests__/cleanInitialization.test.ts` with test cases for clean init, helpers, and demo seeder. Verify failing test run.
2. **GREEN**: Update `src/storage/schema.ts` and `src/storage/testDatabase.ts` to implement clean init and seeder decoupling.
3. **REFACTOR / VERIFY**:
   - Run `npm test` to verify all test suites pass.
   - Run `npm run typecheck` to guarantee 0 TypeScript errors.
   - Run `./init.sh` for full project health validation.

---

## 5. Verification Checklist

- [ ] Clean database initialization creates zero accounts and zero categories.
- [ ] `isOnboardingCompleted` returns `false` on initial launch.
- [ ] `seedDemoData` correctly populates demo data and sets `onboarding_completed = 'true'`.
- [ ] All existing ledger and hook tests continue passing with zero regressions.
- [ ] `./init.sh` passes cleanly (typecheck + test suite).
