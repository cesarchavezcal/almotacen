# Implementation Plan: Ticket 5 (ALM-005) — Reactive Cash Flow Trajectory Curve & Income Ceiling

## 1. Overview & Scope
Ticket 5 (`ALM-005`) implements the reactive cash flow dashboard on the main screen (`app/(tabs)/index.tsx`). It visualizes the user's spending trajectory against their linear planned budget and projected End-of-Month (EOM) burn rate, complete with a horizontal Income Ceiling threshold and a live Titanium Hero Card connected to SQLite.

---

## 2. Autonomic Steps 1 to 6 Alignment

### Step 1: Scoping & Transformation Function $y = f(x)$
- **Input ($x$)**:
  - `transactions`: All transactions logged for the active month (amount in cents, direction, occurredAt).
  - `categories`: Envelope categories with `targetCents` and `assignedCents` (differentiating fixed obligations vs discretionary envelopes).
  - `calendarContext`: Current date $D$, days in month $M$ (e.g. 30 days in September).
  - `incomeInflowCents`: Total income logged this month.
- **Output ($y$)**:
  - `netCashflowCents`: `totalInflowCents - totalOutflowCents`.
  - `linearBudgetPaceCents`: `(totalBudgetPlannedCents / M) * D`.
  - `dailySpendTrajectory`: Array of points $[1..M]$ with cumulative actual outflow cents, linear pace cents, and dashed forecast points.
  - `projectedEomSpendCents`: Blended forecast factoring actual spend to date + daily discretionary burn rate * remaining days + remaining unpaid fixed obligations.
  - `incomeCeilingCents`: Inflow benchmark.
  - `burnStatus`: `'ON_TRACK'` (pace <= 100%), `'PACING_HIGH'` (pace > 100% and <= income), `'EXCEEDS_INCOME'` (projected EOM > income ceiling).

### Step 2: Behavioral UX State Chart
Reflects `docs/product-description/cashflow/reactive_burn_chart.md`:
- **Default Dashboard State**: Renders Titanium Hero Card, Inflow/Outflow KPIs, Trajectory Curve with Income Ceiling marker, and real Recent Outflows list.
- **Visual Encodings**:
  - Actual spend curve: Solid emerald/teal line up to Day $D$.
  - EOM Projection: Dashed line from Day $D$ to Day $M$.
  - Linear budget pace: Thin muted guideline.
  - Income Ceiling: Horizontal dashed line with amber/red badge if breached.

### Step 3: Formal Specifications (`spec.md`) & Gate 1 (`/unslop`)
Add **Requirement 6: Reactive Cash Flow Trajectory & Income Ceiling** to `openspec/specs/dual-cashflow-budgeting/spec.md`:
- **Scenario 6.1 (`SCEN-016`)**: Net monthly cash flow & Titanium Hero Card metrics calculation.
- **Scenario 6.2 (`SCEN-017`)**: Cumulative daily spend points & linear budget pace curve.
- **Scenario 6.3 (`SCEN-018`)**: Blended EOM velocity forecasting (fixed + discretionary).
- **Scenario 6.4 (`SCEN-019`)**: Horizontal Income Ceiling breach alerts (warning flags when projected spend exceeds total income).

### Step 4: Spec Test Contracts (`spec-tests.md`)
Add scenarios `SCEN-016` through `SCEN-019` to `openspec/changes/dual-cashflow-budgeting/spec-tests.md`:
- Pure domain unit assertions for `cashflowEngine.ts` asserting strict integer cents, edge case days (Day 1, mid-month, Day $M$, leap year/31-day months), and ceiling breach boundaries.

### Step 5: Architecture & Design
- **Clean Architecture Separation**:
  - `src/domain/cashflow/cashflowCalculations.ts`: Pure domain calculations (cumulative aggregation, linear pace, blended EOM velocity, income ceiling check, SVG path generation).
  - `src/domain/cashflow/cashflowCalculations.test.ts`: 100% TDD test suite covering `SCEN-016`..`SCEN-019`.
  - `src/hooks/useCashflow.ts`: React hook bridging `useLedgerStore` state into reactive cash flow model.
  - `src/components/CashflowTrajectoryChart.tsx`: SVG / Canvas / Native chart component rendering actual curve, projection, pace line, and income ceiling.
  - `app/(tabs)/index.tsx`: Split into Container (`CashFlowScreen`) and Presenter (`CashFlowView`).

### Step 6: Atomic Ticket Breakdown (ALM-005)
1. **Task 1 (Contract & Spec)**: Update `spec.md`, `spec-tests.md`, and `05-reactive-cashflow-trajectory.md`.
2. **Task 2 (Domain Math TDD)**: Implement `cashflowCalculations.ts` and verify with Jest against `SCEN-016`..`SCEN-019`.
3. **Task 3 (Dependencies)**: Install `react-native-svg` via `npx expo install react-native-svg` (or verify native SVG rendering) and update Jest config/mocks if necessary.
4. **Task 4 (Chart & Hook)**: Implement `useCashflow.ts` and `CashflowTrajectoryChart.tsx`.
5. **Task 5 (Screen Integration)**: Refactor `app/(tabs)/index.tsx` into Container-Presentational structure, replacing mock data with live SQLite cash flow data and real recent transactions.
6. **Task 6 (Verification & Review)**: Run `./init.sh` and `PROVIDER=gemini gga run --no-cache`.

---

## 3. Verification & Harness Invariants
- Strict integer cents across all calculations (`bigint` / `number` cents). Zero floating-point leaks.
- Zero tautological tests: tests derive from `SCEN-016`..`SCEN-019` contracts.
- Container-Presentational UI separation enforced.
- `./init.sh` green pass + GGA AI pre-commit code review clean pass.
