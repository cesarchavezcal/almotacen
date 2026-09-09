# Implementation Tasks: Dual Cash Flow & Zero-Based Budgeting

## Phase 1: Core Domain Ledger Engine (Pure TypeScript)
- [ ] **Task 1.1: Domain Models & Types** (`src/domain/ledger/types.ts`)
  - Define exact TypeScript types for `Account`, `Category`, `Transaction`, and `BudgetMonth`.
  - Enforce integer cents (`bigint` or `number`).
- [ ] **Task 1.2: Pure Arithmetic Ledger Engine** (`src/domain/ledger/ledgerEngine.ts`)
  - Implement `postOutflowTransaction`: atomically decrements account balance and category balance (Satisfies `SCEN-001`, `SCEN-002`).
  - Implement zero-amount validation guard (Satisfies `SCEN-003`).
  - Implement `postInflowTransaction`: credits account and increments `readyToAssign` (Satisfies `SCEN-004`).
  - Implement `allocateEnvelope`: moves funds from `readyToAssign` to category (Satisfies `SCEN-005`, `SCEN-006`).
- [ ] **Task 1.3: Red ➔ Green Domain Test Suite** (`src/domain/ledger/ledgerEngine.test.ts`)
  - Execute automated tests verifying all `SCEN-001`..`SCEN-006` scenarios.

## Phase 2: Local Persistence & Repository
- [ ] **Task 2.1: SQLite Database Scaffolding** (`src/storage/database.ts`)
  - Configure table migrations for accounts, categories, and transactions with offline sync flag (Satisfies `SCEN-007`).
- [ ] **Task 2.2: Transactional Repository** (`src/storage/ledgerRepository.ts`)
  - Atomic double-sided write operations with rollback guards.

## Phase 3: Application Hooks & UI Screens (Expo Router)
- [ ] **Task 3.1: Reactive State Hooks** (`src/hooks/`)
  - Provide `useCashflow`, `useBudget`, and `useTransactions`.
- [ ] **Task 3.2: Quick Point-of-Sale Entry Modal** (`app/modal.tsx`)
  - Render native numeric keypad and category picker using `@expo/ui` and `expo-native-ui`.
- [ ] **Task 3.3: Cash Flow Dashboard Tab** (`app/(tabs)/index.tsx`)
  - Display net burn, monthly inflow vs outflow, and recent activity.
- [ ] **Task 3.4: Zero-Based Budget Tab** (`app/(tabs)/budget.tsx`)
  - Display `Ready to Assign` banner, category groups, and available envelope balances.

## Phase 4: Verification & Delivery
- [ ] **Task 4.1: Static Quality Verification**
  - Run `./init.sh` with clean zero-error typecheck and test pass.
- [ ] **Task 4.2: Open Pull Request**
  - Commit on feature branch and open PR with `/unslop` description.
