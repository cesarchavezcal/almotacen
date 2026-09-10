# 06 — Interactive Chart Scrubbing & Dynamic Day Filter

**What to build:** Direct-manipulation scrubbing across the Cash Flow chart. Dragging horizontally across the curve locks vertical scrolling, snaps a vertical tracker to calendar days with micro-haptic clicks, and renders a floating HUD tooltip displaying date, cumulative spend, and pace delta. Simultaneously, the Recent Outflows transaction list below the chart dynamically filters in real-time to display only expenses that occurred on the scrubbed calendar day.

**Blocked by:** 05 — Reactive Cash Flow Trajectory Curve & Income Ceiling

**Status:** ready-for-review
**Contract Binding:** `SCEN-020`, `SCEN-021`, `SCEN-022`, `SCEN-023`

- [x] Implement `src/domain/cashflow/scrubbingMath.ts` and unit test suite (`SCEN-020`..`SCEN-023`).
- [x] Implement touch coordinate to calendar day mapping with boundary clamping (`SCEN-020`).
- [x] Implement pace delta calculation and HUD tooltip badge formatting (`SCEN-021`).
- [x] Render interactive PanResponder with vertical tracker line and floating HUD card on `CashflowTrajectoryChart.tsx`.
- [x] Connect micro-haptic clicks on day tick boundary transitions with `Haptics.selectionAsync()` (`SCEN-023`).
- [x] Implement dynamic day filtering for transaction feed and parent `ScrollView` scroll lock in `app/(tabs)/index.tsx` (`SCEN-022`).


