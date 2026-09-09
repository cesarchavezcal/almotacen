# 05 — Reactive Cash Flow Trajectory Curve & Income Ceiling

**What to build:** The reactive cash flow dashboard (`app/(tabs)/index.tsx`). Features an Apple Card Titanium hero card showing net monthly cash flow and burn rate pace, alongside an interactive SVG chart that visualizes cumulative daily spend against the linear planned budget pace. The chart projects End-of-Month (EOM) spending using a blended fixed vs discretionary velocity, and displays a horizontal Income Ceiling line that warns the user if spending pace will exceed monthly income.

**Blocked by:** 02 — SQLite Local-First Store & Seed Data

**Status:** ready-for-agent

- [ ] Implement `useCashflow` hook aggregating cumulative daily spend and blended EOM velocity.
- [ ] Render interactive SVG trajectory curve plotting actual spend through today with dashed EOM forecast.
- [ ] Render linear planned budget pace line for daily comparison.
- [ ] Render horizontal Income Ceiling line with amber/red warning when projected spend exceeds income.
- [ ] Connect Titanium Hero Card to live net cash flow (`Inflows - Outflows`) and burn pace percentage.
