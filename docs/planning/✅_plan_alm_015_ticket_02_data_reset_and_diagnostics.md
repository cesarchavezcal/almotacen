# Implementation Plan: Ticket 02 — Data Reset Engine & System Diagnostics

## Goal Description
Implement the three-tier data reset engine (`factoryReset`, `clearTransactionsOnly`, `seedDemoData`) and telemetry diagnostics query (`getDiagnostics`) in `schema.ts`, `SQLiteLedgerRepository`, and `useLedgerStore`, fully locked by automated behavioral tests (`SCEN-016`, `SCEN-017`, `SCEN-018`, `SCEN-019`).

---

## User Review Required
> [!IMPORTANT]
> - **Three-Tier Reset Semantics**:
>   1. **Factory Reset (`SCEN-016`)**: Hard wipe of all user data (`transactions`, `categories`, `category_groups`, `accounts`), resets `ready_to_assign_cents = '0'`, and resets `onboarding_completed = 'false'`. Automatically triggers route redirection to `/onboarding`.
>   2. **Clear Transactions Only (`SCEN-019`)**: Zero-base re-anchor. Deletes `transactions`, resets all envelope balances (`assigned_cents = 0`, `available_cents = 0`, `unfunded_debt_cents = 0`), preserves existing account structures and balances, and recalculates `ready_to_assign_cents = sum(positive depository account balances)`. Preserves `onboarding_completed = 'true'`.
>   3. **Demo Data Seeding (`SCEN-017`)**: Overwrites database with default starter archetype data (`DEFAULT_SEED_DATA`) and sets `onboarding_completed = 'true'`.
> - **System Diagnostics (`SCEN-018`)**: Queries schema version and entity row counts (`accounts`, `categories`, `category_groups`, `transactions`).

---

## Proposed Changes

### Storage Types & Interfaces
#### `src/storage/types.ts`
- Define `DiagnosticsData` interface:
  ```typescript
  export interface DiagnosticsData {
    schemaVersion: number;
    accountCount: number;
    categoryCount: number;
    categoryGroupCount: number;
    transactionCount: number;
  }
  ```
- Add reset and diagnostics methods to `LedgerRepository`:
  - `factoryReset(): void`
  - `clearTransactionsOnly(): void`
  - `seedDemoData(): void`
  - `getDiagnostics(): DiagnosticsData`

---

### Pure Schema Operations
#### `src/storage/schema.ts`
- Implement atomic reset helpers:
  - `factoryReset(db: DatabaseAdapter): void`: Transactional delete across all tables, resets metadata with `schema_version = '2'`, `ready_to_assign_cents = '0'`, `onboarding_completed = 'false'`.
  - `clearTransactionsOnly(db: DatabaseAdapter): void`: Transactional delete on `transactions`, zeroes envelope balances in `categories`, computes `sum(balance_cents)` for depository accounts with positive balance, and sets `ready_to_assign_cents = sum`.

---

### Storage Adapter Implementation
#### `src/storage/ledgerRepository.ts`
- Implement `factoryReset()`, `clearTransactionsOnly()`, `seedDemoData()`, and `getDiagnostics()` in `SQLiteLedgerRepository`.
- `getDiagnostics()` queries `schema_version` from `metadata` and runs `SELECT COUNT(*) as count` across `accounts`, `category_groups`, `categories`, and `transactions`.

---

### Reactive State Store
#### `src/storage/useLedgerStore.ts`
- Expose `factoryReset`, `clearTransactionsOnly`, `seedDemoData`, and `getDiagnostics` in `UseLedgerStoreResult`.
- Ensure mutating reset methods invoke `notifyListeners()` so all connected React Native screens update reactively.

---

### Test-Driven Verification
#### `src/storage/__tests__/ledgerRepository.reset.test.ts`
- Create test suite covering:
  - `SCEN-016`: Factory reset wipes tables and unsets `onboarding_completed`.
  - `SCEN-017`: Seed demo data resets database and sets `onboarding_completed` to true.
  - `SCEN-018`: Diagnostics returns accurate counts and schema version.
  - `SCEN-019`: Clear transactions only preserves accounts, zeroes envelopes, recalculates RTA, and preserves `onboarding_completed`.

---

## Verification Plan

### Automated Tests
1. **Reset Test Suite**: Run `npx jest src/storage/__tests__/ledgerRepository.reset.test.ts`.
2. **Full Harness Verification**: Run `./init.sh` to ensure all 24 test suites pass and `tsc --noEmit` reports 0 errors.

### Manual / Integration Verification
- Verify `isOnboardingCompleted(db)` state transitions between `false` (after `factoryReset`) and `true` (after `seedDemoData` and `clearTransactionsOnly`).
