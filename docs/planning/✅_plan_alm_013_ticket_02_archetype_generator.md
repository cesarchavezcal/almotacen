# Implementation Plan: Ticket 02 - Financial Archetype Template Generator

**Ticket Reference**: `ALM-013` (Ticket 02 of User Onboarding)  
**Bound Scenarios**: `SCEN-049`, `SCEN-050`  
**Target Branch**: `feature/CCH/ALM-013-user-onboarding-wizard`

---

## 1. Context & Motivation

In Almotacen's 4-step User Onboarding Wizard, users need meaningful envelope structures tailored to their lifestyle and financial goals without having to create dozens of categories manually. 

Ticket 02 delivers a pure domain template generator that provides **3 curated financial archetype presets**, allows custom additions/removals, and implements priority-based initial cash distribution (`calculateInitialAllocation`).

---

## 2. Behavioral Contracts

- **`SCEN-049` (Financial Archetype Preset Generation)**:
  - Supports 3 distinct archetype presets:
    1. **`STANDARD_BALANCED`** (Default):
       - Groups: *Immediate Obligations*, *True Expenses*, *Quality of Life*, *Savings & Goals*.
       - Categories: Rent & Housing ($1,200/mo set aside), Groceries ($400/mo spending), Utilities ($150/mo set aside), Auto Maintenance ($100/mo spending), Dining & Coffee ($150/mo spending), Emergency Fund ($200/mo set aside).
    2. **`DEBT_CRUSHER`**:
       - Groups: *Debt Payoff*, *Bare Essentials*, *Margin Buffer*.
       - Categories: Credit Card Payoff ($500/mo set aside), Minimum Housing ($1,000/mo set aside), Essential Groceries ($300/mo spending), Basic Utilities ($100/mo set aside), Emergency Buffer ($50/mo set aside).
    3. **`MINIMALIST_LIVING`**:
       - Groups: *Fixed Living*, *Flexible Daily*, *Discretionary Buffer*.
       - Categories: Shelter & Utilities ($1,300/mo set aside), Living & Food ($450/mo spending), Discretionary Buffer ($100/mo spending).
  - Invoking `getArchetypeTemplate(presetId)` returns an immutable deep clone of the preset with structured groups and categories.

- **`SCEN-050` (Initial Cash Allocation & Custom Adjustment)**:
  - `calculateInitialAllocation(cashCents, categories)`:
    - Distributes starting available cash sequentially down the category target list in priority order.
    - Each category receives `min(remainingCash, category.targetCents)`.
    - If starting cash exceeds the sum of all targets, all category targets are 100% funded and the excess remains in `readyToAssignCents` for the main dashboard.
    - If starting cash is less than total targets, categories are funded in priority order until cash hits zero; remaining categories receive `0` cents.
  - Template customization helpers:
    - Adding, removing, or updating target values recalculates allocations deterministically.

---

## 3. Proposed Module Design

### Domain Types (`src/domain/onboarding/types.ts`)
```typescript
import { TargetType } from '../ledger/types';

export type ArchetypePresetId = 'STANDARD_BALANCED' | 'DEBT_CRUSHER' | 'MINIMALIST_LIVING';

export interface CategoryTemplateItem {
  id: string;
  groupId: string;
  name: string;
  targetCents: number;
  targetType: TargetType;
  targetDueDay?: number;
  priority: number;
}

export interface CategoryGroupTemplate {
  id: string;
  name: string;
  sortOrder: number;
}

export interface ArchetypeTemplate {
  id: ArchetypePresetId;
  name: string;
  description: string;
  groups: CategoryGroupTemplate[];
  categories: CategoryTemplateItem[];
}

export interface InitialAllocationResult {
  allocations: Record<string, number>; // categoryId -> assignedCents
  totalAssignedCents: number;
  remainingReadyToAssignCents: number;
}
```

### Archetype Generator (`src/domain/onboarding/archetypes.ts`)
- `ARCHETYPE_PRESETS`: Record mapping preset IDs to immutable templates.
- `getArchetypeTemplate(presetId: ArchetypePresetId): ArchetypeTemplate`: Deep clone utility.
- `calculateInitialAllocation(cashCents: number, categories: CategoryTemplateItem[]): InitialAllocationResult`: Priority-based allocation algorithm.
- `addCategoryToTemplate(template: ArchetypeTemplate, item: Omit<CategoryTemplateItem, 'id'>): ArchetypeTemplate`.
- `removeCategoryFromTemplate(template: ArchetypeTemplate, categoryId: string): ArchetypeTemplate`.

### Unit & Behavioral Tests (`src/domain/onboarding/__tests__/archetypes.test.ts`)
- Verify all 3 archetypes have non-empty groups and categories with valid targets.
- Verify deep cloning prevents accidental mutation of base presets.
- Verify `calculateInitialAllocation` when `cash == 0`, `cash < sum(targets)`, `cash == sum(targets)`, and `cash > sum(targets)`.
- Verify category addition and removal update the template structure and subsequent allocation calculations.

---

## 4. Execution Plan (TDD First)

1. **RED**: Author `src/domain/onboarding/__tests__/archetypes.test.ts` testing template generation, immutability, priority allocation math, and customization helpers. Verify failing test run.
2. **GREEN**: Implement `src/domain/onboarding/types.ts` and `src/domain/onboarding/archetypes.ts`.
3. **REFACTOR / VERIFY**:
   - Run `npm test src/domain/onboarding/__tests__/archetypes.test.ts`.
   - Run `./init.sh` across the entire project (100% tests green, 0 typecheck errors).
   - Ensure clean Hexagonal domain isolation (pure functions, zero dependencies on storage or UI).

---

## 5. Verification Checklist

- [ ] All 3 archetype presets match specified envelopes and targets.
- [ ] Deep clone prevents mutation of preset constants.
- [ ] Sequential allocation funds categories by priority order without negative balances.
- [ ] Surplus cash correctly rolls into `remainingReadyToAssignCents`.
- [ ] Full project test suite passes cleanly via `./init.sh`.
