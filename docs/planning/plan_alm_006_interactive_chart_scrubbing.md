# Implementation Plan: Ticket 6 (ALM-006) — Interactive Chart Scrubbing & Dynamic Day Filter

## 1. Overview & Context
Ticket 6 (`ALM-006`) adds direct-manipulation chart scrubbing to the Cash Flow screen (`app/(tabs)/index.tsx`). Dragging horizontally across `CashflowTrajectoryChart` locks vertical screen scrolling, snaps a vertical tracking line to calendar days with micro-haptic clicks, and displays a floating HUD tooltip showing date, cumulative spend, and pace delta. Simultaneously, the Recent Outflows transaction list dynamically filters in real-time to show only expenses from the scrubbed day, smoothly restoring to the full list upon release.

---

## 2. Autonomic Steps 1 to 6 Alignment

### Step 1: Scoping & Transformation Function $y = f(x)$
- **Input ($x$)**:
  - Horizontal gesture coordinate $x \in [0, \text{chartWidth}]$.
  - Chart layout parameters: `chartWidth`, `paddingLeft`, `paddingRight`, `totalDaysInMonth`.
  - Monthly `dailyPoints`: array of daily trajectory points (cumulative outflow, linear pace).
  - Monthly `transactions`: all recorded transactions.
- **Output ($y$)**:
  - `scrubbedDay`: integer calendar day clamped to $[1, \text{totalDaysInMonth}]$.
  - `scrubbedPoint`: trajectory point for the active day with `outflowCents` and `linearBudgetPaceCents`.
  - `paceDeltaCents`: `outflowCents - linearBudgetPaceCents` (signed difference).
  - `paceDeltaLabel`: formatted string (e.g. `-$120.00 ahead of pace` or `+$45.00 behind pace`).
  - `dayFilteredOutflows`: subset of transactions where `occurredAt` matches the scrubbed date.
  - `isScrollLocked`: boolean flag disabling vertical `ScrollView` while dragging.

### Step 2: Behavioral UX State Chart Alignment
Reflects `docs/product-description/cashflow/reactive_burn_chart.md`:
- **Starting**: Touchdown on chart canvas locks vertical scroll.
- **While Extended**: As thumb scrubs horizontally:
  - Vertical tracker line moves smoothly with touch.
  - Snaps to nearest calendar day with `Haptics.selectionAsync()`.
  - Floating HUD tooltip displays date, cumulative spend, and pace delta badge.
  - Recent Outflows list updates in real-time to show that specific day's expenses.
- **Finishing / Cancel**:
  - Finger release restores vertical scrolling and returns Recent Outflows to the standard month-to-date feed.

### Step 3: Formal Specifications (`spec.md`) & Gate 1 (`/unslop`)
Add **Requirement 7: Interactive Chart Scrubbing & Dynamic Day Filter** to `openspec/specs/dual-cashflow-budgeting/spec.md`:
- **Scenario 7.1 (`SCEN-020`)**: Horizontal touch position maps accurately to integer calendar day and clamps at month boundaries.
- **Scenario 7.2 (`SCEN-021`)**: Pace delta calculation and HUD tooltip badge formatting (`ahead of pace` vs `behind pace`).
- **Scenario 7.3 (`SCEN-022`)**: Dynamic filtering of transaction feed by scrubbed calendar date.
- **Scenario 7.4 (`SCEN-023`)**: Micro-haptic trigger emitted once per calendar day boundary transition.

### Step 4: Spec Test Contracts (`spec-tests.md`)
Add scenarios `SCEN-020` through `SCEN-023` to `openspec/changes/dual-cashflow-budgeting/spec-tests.md`:
- Pure domain unit tests for `scrubbingMath.ts` testing coordinate mapping, day clamping, pace delta calculations, and date string filtering.

### Step 5: Architecture & Design
- **Clean Architecture & Container-Presentational Separation**:
  - `src/domain/cashflow/scrubbingMath.ts`: Pure mathematical functions for coordinate mapping, pace delta, and day filtering.
  - `src/domain/cashflow/scrubbingMath.test.ts`: 100% TDD unit test suite covering `SCEN-020`..`SCEN-023`.
  - `src/components/CashflowTrajectoryChart.tsx`: Enhanced with `PanResponder`, vertical tracker line, scrub point indicator dot, and floating HUD card.
  - `app/(tabs)/index.tsx`: Enhanced with active scrub state callback, dynamic transaction list filtering, and vertical scroll lock.

### Step 6: Atomic Ticket Breakdown (ALM-006)
1. **Task 1 (Contract & Spec)**: Update `spec.md`, `spec-tests.md`, and `06-interactive-chart-scrubbing.md`.
2. **Task 2 (Domain Math TDD)**: Implement `scrubbingMath.ts` and verify with Jest against `SCEN-020`..`SCEN-023`.
3. **Task 3 (Interactive Chart Component)**: Integrate `PanResponder`, vertical tracker line, HUD tooltip, and `Haptics.selectionAsync()` into `CashflowTrajectoryChart.tsx`.
4. **Task 4 (Screen Integration & Dynamic Feed)**: Connect chart scrub callback to `app/(tabs)/index.tsx`, locking `ScrollView` and filtering transaction feed.
5. **Task 5 (Verification & Two-Axis Review)**: Run `./init.sh` and `PROVIDER=gemini gga run --no-cache`.

---

## 3. Verification & Harness Invariants
- Strict integer cent arithmetic across pace delta and spend calculations.
- Zero swallowed exceptions; error-safe haptics and touch handling.
- Deterministic unit tests with 100% clean `./init.sh` pass.
- Container-Presentational UI separation strictly preserved.
