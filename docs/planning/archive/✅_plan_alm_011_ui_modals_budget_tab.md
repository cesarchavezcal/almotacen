# Implementation Plan — ALM-011: UI Modals & Budget Tab Integration

**Branch:** `feature/CCH/ALM-011-ui-modals-and-budget-tab`  
**Ticket:** ALM-011 (Issue 04)  
**Parent Change:** `openspec/changes/proactive-budgeting-decision-engine`  

---

## 1. Objectives & Scope
Deliver tactile, accessible UI modal bottom sheets and interactions for the proactive budgeting decision engine:
1. **Merge PR #26 (`ALM-010`)**: Finalize and squash-merge the interactive overspending coverage backend into `main`.
2. **`AutoAssignModal`**: Preview priority-based payday allocation breakdown (underfunded goals first, upcoming due dates) and execute with 1-tap haptic confirmation.
3. **`CoverOverspendingModal`**: Tap red/amber overspent badge to inspect deficit, pick a donor category with positive available balance, and rebalance funds atomically.
4. **Budget Tab Integration**: Connect tactile triggers in `app/(tabs)/budget.tsx` (Auto-Assign pill on Ready to Assign banner + Cover Overspending tap on `EnvelopePassFace` badge).
5. **Quality & Verification**: Component tests (`@testing-library/react-native`), strict TypeScript checks, `./init.sh` 100% green pass.

---

## 2. Step-by-Step Execution Plan

### Step 1: Merge PR #26 & Synchronize Branches
- Execute: `gh auth switch --user cesarchavezcal`
- Execute: `gh pr merge 26 --squash --delete-branch`
- Fetch and merge latest `main`:
  ```bash
  git fetch origin main
  git checkout -b feature/CCH/ALM-011-ui-modals-and-budget-tab origin/main
  ```

### Step 2: Build `src/components/AutoAssignModal.tsx`
- **Role**: Presentational modal bottom sheet for reviewing and confirming auto-assignment.
- **Props**:
  - `visible: boolean`
  - `readyToAssignCents: number`
  - `categories: Record<string, Category>`
  - `groups: CategoryGroup[]`
  - `onConfirm: () => void`
  - `onClose: () => void`
- **Internal Logic**:
  - Computes preview allocations using pure domain function `calculateAutoAssignPlan(readyToAssignCents, categories, groups)`.
  - Displays summary: Total available to assign vs. total allocated to targets.
  - Lists allocated categories with target type badge (`monthly_need` vs `target_by_date`), due date, and amount allocated.
  - Includes action buttons: "Confirm Allocation" (styled with `colors.accent`, triggers `safeHaptic(success)`) and "Cancel".
- **Styling**: Uses design tokens from `src/theme/` (`colors`, `radius`, `typography`, `spacing`).

### Step 3: Build `src/components/CoverOverspendingModal.tsx`
- **Role**: Modal bottom sheet for resolving cash or credit overspending deficits.
- **Props**:
  - `visible: boolean`
  - `targetCategory: Category | null`
  - `categories: Record<string, Category>`
  - `groups: CategoryGroup[]`
  - `onConfirm: (sourceCategoryId: string, amountCents: number) => void`
  - `onClose: () => void`
- **Internal Logic**:
  - Displays overspent category name and deficit amount (formatted currency).
  - Filters donor categories where `availableCents > 0` (excluding the target category).
  - Allows selecting donor envelope from a list.
  - Shows preview: source category balance before and after rebalancing.
  - Primary button: "Transfer & Cover Deficit" (triggers `safeHaptic(impactAsync)`).
- **Edge Cases**:
  - Graceful empty state if no categories have available funds.

### Step 4: Update `src/components/EnvelopePassFace.tsx`
- Add optional prop: `onCoverOverspending?: () => void`.
- When `isOverspent` is true (cash overspent or credit debt badge), wrap the status pill with a `Pressable` that triggers `onCoverOverspending`.
- Maintain existing expand toggle for the rest of the header row.

### Step 5: Integrate into `app/(tabs)/budget.tsx`
- Container state management:
  - `autoAssignVisible: boolean`
  - `overspentCoverTarget: Category | null`
- Ready to Assign banner enhancement:
  - When `readyToAssignCents > 0`, display a prominent "Auto-Assign" action button/pill next to the balance.
  - Tapping opens `AutoAssignModal`.
- Category pass interaction:
  - Pass `onCoverOverspending={() => setOverspentCoverTarget(item)}` to `EnvelopePassFace`.
- Handlers:
  - Wire `applyAutoAssign` from `useLedgerStore`.
  - Wire `rebalanceCategoryFunds` from `useLedgerStore`.

### Step 6: Automated Testing & Verification
- Author `src/components/__tests__/AutoAssignModal.test.tsx`:
  - Renders preview correctly when `readyToAssignCents > 0`.
  - Calls `onConfirm` and `onClose` appropriately.
- Author `src/components/__tests__/CoverOverspendingModal.test.tsx`:
  - Renders donor category choices with positive balances.
  - Prevents transfer if no donor is selected.
  - Calls `onConfirm` with correct category ID and deficit amount.
- Author integration test in `app/(tabs)/__tests__/budget.test.tsx` for modal triggers.
- Run test runner: `./init.sh` ensuring all test suites pass with 0 lints.

---

## 3. Verification Criteria
- [ ] `./init.sh` exits 0 with zero test failures.
- [ ] `tsc --noEmit` reports 0 type errors.
- [ ] `.gga` audit passes with zero violations.
- [ ] No regression in existing `budgetViewHelpers` or envelope pass face tests.
