# Implementation Plan: Ticket 1 (ALM-008) — Dual Category Targets & Underfunded Deficit Engine

## Goal Description
Implement the foundation of the proactive budgeting engine by adding dual category target types (`NEEDED_FOR_SPENDING` vs `MONTHLY_SET_ASIDE`), optional `targetDueDay` (1–31), SQLite Schema version 2 migration, and the pure functional Underfunded calculation engine fulfilling behavioral test contracts `SCEN-028`, `SCEN-029`, and `SCEN-030`.

## User Review Required

> [!IMPORTANT]
> **Database Schema Migration (v1 -> v2)**:
> - `categories` table gains `target_type TEXT NOT NULL DEFAULT 'NEEDED_FOR_SPENDING'` and `target_due_day INTEGER`.
> - `initializeDatabase` in `src/storage/schema.ts` checks `schema_version`. If `1`, it issues `ALTER TABLE` commands and updates `schema_version` to `2`.
> - All existing categories retain their current targets with default `NEEDED_FOR_SPENDING` behavior.

---

## Proposed Changes

### 1. Domain Types Layer

#### [MODIFY] [`src/domain/ledger/types.ts`](file:///Users/cesaradalbertochavezcalderon/orca/workspaces/almotacen/oystercatcher/src/domain/ledger/types.ts)
- Define `TargetType`:
  ```typescript
  export type TargetType = 'NEEDED_FOR_SPENDING' | 'MONTHLY_SET_ASIDE';
  ```
- Extend `Category`:
  ```typescript
  export interface Category {
    id: string;
    groupId: string;
    name: string;
    targetCents: number;
    targetType?: TargetType;
    targetDueDay?: number;
    assignedCents: number;
    availableCents: number;
    isCreditPayment?: boolean;
    unfundedDebtCents?: number;
  }
  ```
- Define `CategoryUnderfundedInfo`:
  ```typescript
  export interface CategoryUnderfundedInfo {
    categoryId: string;
    targetCents: number;
    targetType: TargetType;
    underfundedCents: number;
    isFunded: boolean;
  }
  ```

---

### 2. Pure Functional Domain Engine (TDD)

#### [NEW] [`src/domain/ledger/targets.ts`](file:///Users/cesaradalbertochavezcalderon/orca/workspaces/almotacen/oystercatcher/src/domain/ledger/targets.ts)
- `calculateCategoryUnderfunded(category: Category, rolledOverAvailableCents: number): CategoryUnderfundedInfo`
  - If `category.targetCents === 0`: `underfundedCents = 0`, `isFunded = true`.
  - If `category.targetType === 'MONTHLY_SET_ASIDE'`:
    - `underfundedCents = Math.max(0, category.targetCents - category.assignedCents)`
  - If `category.targetType === 'NEEDED_FOR_SPENDING'` (default):
    - Available from rollover reduces needed amount:
    - `currentEffectiveFunds = Math.max(0, rolledOverAvailableCents) + category.assignedCents`
    - `underfundedCents = Math.max(0, category.targetCents - currentEffectiveFunds)`
  - `isFunded = underfundedCents === 0`
- `calculateTotalUnderfunded(categories: Category[], rollovers?: Record<string, number>): number`
  - Sums `underfundedCents` across non-credit categories.

#### [NEW] [`src/domain/ledger/targets.test.ts`](file:///Users/cesaradalbertochavezcalderon/orca/workspaces/almotacen/oystercatcher/src/domain/ledger/targets.test.ts)
- **`SCEN-028`**: Needed for spending target with positive rollover.
- **`SCEN-029`**: Monthly set-aside target with positive rollover.
- **`SCEN-030`**: Fully funded category when assigned matches target.
- Edge cases:
  - Negative rollover (category was cash-overspent at end of prior month).
  - Target = 0 (no target set).
  - Overassigned beyond target.

---

### 3. Database & Storage Layer

#### [MODIFY] [`src/storage/schema.ts`](file:///Users/cesaradalbertochavezcalderon/orca/workspaces/almotacen/oystercatcher/src/storage/schema.ts)
- Set `SCHEMA_VERSION = 2`.
- Update `CREATE_TABLES_SQL`:
  ```sql
  CREATE TABLE IF NOT EXISTS categories (
    ...
    target_type TEXT NOT NULL DEFAULT 'NEEDED_FOR_SPENDING',
    target_due_day INTEGER,
    ...
  );
  ```
- Update `initializeDatabase` to run migration if existing `version < 2`:
  ```typescript
  if (currentVersion === 1) {
    db.runSync("ALTER TABLE categories ADD COLUMN target_type TEXT NOT NULL DEFAULT 'NEEDED_FOR_SPENDING'");
    db.runSync("ALTER TABLE categories ADD COLUMN target_due_day INTEGER");
    db.runSync("UPDATE metadata SET value = '2' WHERE key = 'schema_version'");
  }
  ```
- Update `DEFAULT_SEED_DATA` with realistic `targetType` and `targetDueDay` on seed categories.

#### [MODIFY] [`src/storage/ledgerRepository.ts`](file:///Users/cesaradalbertochavezcalderon/orca/workspaces/almotacen/oystercatcher/src/storage/ledgerRepository.ts)
- Update `CategoryRow` interface:
  ```typescript
  export interface CategoryRow {
    ...
    target_type?: string;
    target_due_day?: number | null;
  }
  ```
- Update `updateCategoryTarget`:
  ```typescript
  updateCategoryTarget(
    categoryId: string,
    targetCents: number,
    targetType?: TargetType,
    targetDueDay?: number
  ): void
  ```

---

## Verification Plan

### Automated Tests
```bash
# 1. Run new domain targets tests
npm test src/domain/ledger/targets.test.ts

# 2. Run repository tests including schema migration
npm test src/storage/ledgerRepository.test.ts

# 3. Full project regression suite
./init.sh
```

### Invariants Verified
- Zero regressions across existing 77 tests.
- Full type safety (`tsc --noEmit`).
- Spec scenario compliance for `SCEN-028`, `SCEN-029`, and `SCEN-030`.
