# 06 — Interactive Chart Scrubbing & Dynamic Day Filter

**What to build:** Direct-manipulation scrubbing across the Cash Flow chart. Dragging horizontally across the curve locks vertical scrolling, snaps a vertical tracker to calendar days with micro-haptic clicks, and renders a floating HUD tooltip displaying date, cumulative spend, and pace delta. Simultaneously, the Recent Outflows transaction list below the chart dynamically filters in real-time to display only expenses that occurred on the scrubbed calendar day.

**Blocked by:** 05 — Reactive Cash Flow Trajectory Curve & Income Ceiling

**Status:** ready-for-agent

- [ ] Implement pan gesture handler that tracks horizontal touch coordinates and locks vertical scroll.
- [ ] Emit micro-haptic feedback as touch crosses calendar day boundary ticks.
- [ ] Render floating HUD tooltip with scrubbed date, cumulative outflow, and pace delta.
- [ ] Dynamically filter the Recent Outflows list below to the scrubbed date during drag.
- [ ] Smoothly restore recent transactions list and summary metrics upon touch release.
