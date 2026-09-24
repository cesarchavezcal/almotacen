# Ticket 02: Data Reset Engine & System Diagnostics

## Status
- **Phase**: Step 7 (Implementation)
- **Scenarios Bound**: `SCEN-016`, `SCEN-017`, `SCEN-018`, `SCEN-019`

---

## Objective
Implement atomic Factory Reset, Clear Transactions Only (Zero-Base Re-Anchor), Demo Data Seeding, and System Diagnostics queries in `schema.ts` and `SQLiteLedgerRepository`.

---

## Detailed Requirements
1. **Factory Reset (`factoryReset()`)**:
   - Executes in a single SQLite transaction:
     - Deletes all records from `transactions`, `categories`, `category_groups`, and `accounts`.
     - Resets `metadata` table with `schema_version = '2'`, `ready_to_assign_cents = '0'`, and `onboarding_completed = 'false'`.
   - Guarantees immediate route guard transition to `/onboarding`.
2. **Clear Transactions Only (`clearTransactionsOnly()`)**:
   - Executes in a single SQLite transaction:
     - Deletes all records from `transactions`.
     - Resets all category `assigned_cents = 0`, `available_cents = 0`, `unfunded_debt_cents = 0`.
     - Preserves existing accounts and their balances.
     - Computes `sum(balance_cents)` for accounts where `account_type != 'credit'` and `balance_cents > 0`, and updates `metadata` `ready_to_assign_cents` to this sum.
     - Preserves `onboarding_completed = 'true'`.
3. **Demo Data Seeding (`seedDemoData()`)**:
   - Atomically replaces database contents with default starter archetype data (`DEFAULT_SEED_DATA`).
   - Sets `onboarding_completed = 'true'`.
4. **Diagnostics (`getDiagnostics()`)**:
   - Queries `schema_version` from metadata.
   - Computes `COUNT(*)` for `accounts`, `categories`, `category_groups`, and `transactions`.
   - Returns typed `DiagnosticsData` structure.

---

## Verification
- Unit test suite in `src/storage/__tests__/ledgerRepository.reset.test.ts`.
