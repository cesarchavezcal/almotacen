# 05 — Reactive Cash Flow Trajectory Curve & Income Ceiling

**What to build:** The reactive cash flow dashboard (`app/(tabs)/index.tsx`). Features an Apple Card Titanium hero card showing net monthly cash flow and burn rate pace, alongside an interactive SVG chart that visualizes cumulative daily spend against the linear planned budget pace. The chart projects End-of-Month (EOM) spending using a blended fixed vs discretionary velocity, and displays a horizontal Income Ceiling line that warns the user if spending pace will exceed monthly income.

**Blocked by:** 02 — SQLite Local-First Store & Seed Data

**Status:** ready-for-review
**Contract Binding:** `SCEN-016`, `SCEN-017`, `SCEN-018`, `SCEN-019`

- [x] Implement `src/domain/cashflow/cashflowCalculations.ts` with strict integer cents arithmetic and test suite (`SCEN-016`..`SCEN-019`).
- [x] Connect Titanium Hero Card to live net cash flow (`Inflows - Outflows`) and burn pace percentage (`SCEN-016`).
- [x] Render trajectory curve plotting actual spend through today with linear planned budget pace line (`SCEN-017`).
- [x] Render dashed EOM forecast curve using blended fixed + discretionary velocity (`SCEN-018`).
- [x] Render horizontal Income Ceiling line with amber/red status when projected spend exceeds income (`SCEN-019`).
- [x] Implement `useCashflow` hook aggregating cumulative daily spend and connecting `useLedgerStore` to `app/(tabs)/index.tsx`.
- [x] Refactor `app/(tabs)/index.tsx` into Container-Presentational architecture with live SQLite state and real recent transactions.


