## Exploration: Reactive Cash Flow Tracking Engine & Interactive Trajectory Chart

### Current State
The Cash Flow screen (`app/(tabs)/index.tsx`) renders static placeholder values:
- A hardcoded Apple Card Titanium hero card showing `+$1,425.50` net cash flow and a static `42% of budget` burn rate.
- Static KPI cards for Total Inflow (`+$4,850.00`) and Total Outflow (`-$3,424.50`).
- A primitive static progress bar for "MONTH TRAJECTORY" with no daily curve, pace line, or interactive touch scrubbing.
- A hardcoded list of 4 static transactions without date filtering or ledger integration.

### Affected Areas
- `app/(tabs)/index.tsx` — Replace static hero, KPI, progress bar, and transaction feed with live reactive hooks and interactive chart canvas.
- `src/components/CashFlowTrajectoryChart.tsx` [NEW] — Interactive SVG/canvas component supporting:
  - Cumulative spend area curve up to the current calendar day.
  - Dotted EOM forecast line using blended fixed vs discretionary velocity.
  - Linear budget pace reference line.
  - Horizontal Income Ceiling reference marker.
  - Continuous horizontal touch-scrub gesture with micro-haptic feedback on calendar day ticks.
- `src/hooks/useCashflow.ts` [NEW] — Pure data aggregation hook computing:
  - Cumulative daily spend vectors (`day_1` to `today`).
  - Total monthly inflow and outflow sums.
  - Blended EOM projection velocity ($\text{fixed} + (\text{variable\_rate} \times \text{days\_remaining})$).
  - Selected/scrubbed day filter state.
- `src/domain/ledger/cashflowAggregator.ts` [NEW] — Pure domain math functions for calculating burn trajectory, linear pace benchmarks, and income ceiling breaches.

### Approaches
1. **Interactive Blended Trajectory Engine with Income Ceiling (Selected via Grill-Me)** —
   - Visualizes cumulative spending curve against linear budget pace and a horizontal Income Ceiling.
   - Computes EOM projected spend by isolating fixed recurring bills (Rent, Utilities) from variable daily burn rate.
   - Interactive horizontal touch-scrubbing reveals a day-by-day HUD tooltip while dynamically filtering the transaction feed below.
   - Month paging header (`< September 2026 >`) supports smooth historical review and comparison.
   - Pros: Delivers Monarch-grade financial clarity without misleading early-month rent distortions; provides tactile point-in-time day inspection.
   - Cons: Requires custom gesture handling with React Native Gesture Handler / SVG path rendering.
   - Effort: Medium

2. **Simple Progress Bar & Static Trendline** —
   - Retains a simple linear progress bar with month elapsed % vs budget spent %.
   - No daily scrubbing or EOM projection.
   - Pros: Very low effort to implement.
   - Cons: Fails the core product thesis of reactive cash flow awareness; doesn't show *when* or *why* velocity changed.
   - Effort: Low

### Recommendation
Implement **Approach 1 (Interactive Blended Trajectory Engine with Income Ceiling)**:
1. Build `CashFlowTrajectoryChart` with `react-native-svg` and gesture responders for 60fps scrubbing.
2. Implement blended EOM projection isolating fixed commitments to prevent early-month distortion.
3. Wire the scrub gesture to filter the transaction list dynamically for the focused calendar day.
4. Include month paging with animated curve transitions for historical cycle comparisons.

### Risks
- **Gesture conflict with vertical ScrollView**: Horizontal scrubbing across the chart could inadvertently trigger vertical scrolling. Mitigated by setting active pan gesture handlers that lock parent scroll during active horizontal drags.
- **Performance on low-end devices**: Heavy SVG recalculations during drag. Mitigated by precomputing daily cumulative points in `useCashflow` and animating only the vertical scrub line and tooltip HUD during gesture events.

### Ready for Proposal
Yes — All architectural branches for the Reactive Cash Flow Tracking feature have been resolved via grilling. The specification can now be authored (`/sdd-spec`).
