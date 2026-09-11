# Implementation Plan: Ticket 7 (ALM-007) — Month Cycle Paging & Rollover

## Objective
Implement monthly cycle navigation and month-end envelope rollover for Almotacen. Users can page between months (`< September 2026 >`), view historical spending trajectories with smooth transitions, and execute dual-ledger month rollover (unspent envelope carryover, cash deficit deduction from Ready to Assign, credit debt retention on card balance).

---

## 1. Specification & Behavioral Contract Expansion

### Requirements in `openspec/specs/dual-cashflow-budgeting/spec.md`
- **Requirement 8: Month Cycle Paging & Rollover**
  - **Scenario 8.1 (Month Paging Navigation - `SCEN-024`)**: Paging header with chevron controls and swipe gestures allows navigating between past, present, and future monthly cycles.
  - **Scenario 8.2 (Historical Trajectory & Full-Month Curve - `SCEN-025`)**: Viewing a closed historical month displays the complete 1..totalDays actual trajectory, net cashflow, and final savings rate without active future projections.
  - **Scenario 8.3 (Positive Envelope Balance Rollover - `SCEN-026`)**: Unspent positive envelope balances in month $M$ carry over into month $M+1$ available balance.
  - **Scenario 8.4 (Dual-Ledger Cash Deficit Absorption & Credit Debt Isolation - `SCEN-027`)**: Uncovered cash deficits in month $M$ are deducted from month $M+1$ `Ready to Assign`, while unfunded credit overspending resets in envelopes and persists solely on credit card account debt balances.

---

## 2. Technical Architecture & Component Slices

### Slice A: Pure Domain Rollover Engine (`src/domain/ledger/rollover.ts`)
- Pure, deterministic function `performMonthRollover`:
  - Input: `BudgetState`, optional target month.
  - Logic:
    1. Iterate categories:
       - If `availableCents > 0`, keep balance in new month.
       - If `availableCents < 0`:
         - Separate cash deficit from credit debt:
           - `unfundedDebtCents = cat.unfundedDebtCents || 0`
           - `cashDeficitCents = Math.max(0, -cat.availableCents - unfundedDebtCents)`
           - Accumulate `totalCashDeficitCents += cashDeficitCents`
         - Reset category `availableCents` to `0` (absorbed by RTA or debt).
         - Reset category `unfundedDebtCents` to `0` (debt already resides on credit account balance).
       - Reset `assignedCents` to `0` for the fresh month cycle.
       - Retain credit card payment envelope available cash for bill payments.
    2. Adjust `readyToAssignCents`:
       - `readyToAssignCents = state.readyToAssignCents - totalCashDeficitCents`.
    3. Return updated `BudgetState` with audit statistics.
- Test suite: `src/domain/ledger/rollover.test.ts` (100% pure TDD).

### Slice B: Paging & Historical Trajectory in `useCashflow` (`src/hooks/useCashflow.ts`)
- Enhance `useCashflow` to support selected month state (`selectedDate: Date`, `onPrevMonth()`, `onNextMonth()`, `onResetToCurrentMonth()`):
  - Detect whether `selectedDate` is in the past, current month, or future:
    - If `past`: `currentDay = totalDaysInMonth` (displays full trajectory of actuals).
    - If `present`: `currentDay = today.getDate()` (displays actuals up to today + dashed EOM blended forecast).
    - If `future`: `currentDay = 0` (displays linear budget pace and projected commitments).
  - Filter transactions strictly by the selected month cycle (`YYYY-MM`).
  - Calculate accurate month label (e.g. `"September 2026"`, `"August 2026"`).

### Slice C: UI Month Paging Header (`src/components/MonthPagingHeader.tsx`)
- Container-Presentational component:
  - Left chevron (`<`) and right chevron (`>`) buttons with tactile touch targets (min 44x44 pt).
  - Current month / year title display (e.g. `"September 2026"`).
  - "Today" / "Current" quick indicator badge when viewing a past or future month.
  - Haptic feedback (`Haptics.selectionAsync()`) on cycle changes.

### Slice D: Storage & Repository Integration (`src/storage/ledgerRepository.ts` & `src/storage/useLedgerStore.ts`)
- Add `performMonthRollover()` to `LedgerRepository` and `SQLiteLedgerRepository`.
- Persist updated category balances, ready to assign, and metadata in a single atomic SQLite transaction (`db.withTransactionSync`).
- Expose `performRollover` and `selectedMonth` in `useLedgerStore`.

### Slice E: Screen Integration in `app/(tabs)/index.tsx`
- Integrate `MonthPagingHeader` atop `CashFlowScreen` above the titanium hero card.
- Pass selected month to `useCashflow` and update chart curve + metrics dynamically.
- Test in container-presentational view with mocked months and gestures.

---

## 3. Verification Plan & Test Strategy

### Automated Verification
1. `src/domain/ledger/rollover.test.ts`:
   - Positive envelope balance carryover (`SCEN-026`).
   - Cash deficit deduction from Ready to Assign (`SCEN-027`).
   - Credit overspending debt isolation without RTA deduction (`SCEN-027`).
   - Credit card payment reserve balance retention across months.
2. `src/domain/cashflow/cashflowCalculations.test.ts`:
   - Historical month full-trajectory curve generation (`SCEN-025`).
3. `src/storage/ledgerRepository.test.ts`:
   - Database persistence of rollover state in SQLite.
4. Full Suite & Typecheck:
   - `./init.sh` (must pass 100% with 0 errors).
   - `PROVIDER=gemini gga run --no-cache` (strict code review pass).
