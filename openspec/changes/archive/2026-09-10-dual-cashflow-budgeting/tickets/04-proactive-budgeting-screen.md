# 04 — Proactive Zero-Based Budgeting & Envelope Allocator

**What to build:** The proactive envelope budgeting tab (`app/(tabs)/budget.tsx`). The screen displays a prominent `Ready to Assign` header banner (green when positive, neutral gray at $0.00, red when overassigned). Users can allocate cash to envelope categories using 1-tap quick-fill pills (+$50, +$100, Fill Remaining) or custom adjustments. Visual badges clearly differentiate unfunded credit debt (amber) from cash overspending (red).

**Blocked by:** 02 — SQLite Local-First Store & Seed Data (Completed)

**Status:** done (merged in PR #19)

## Bound Behavioral Scenarios
- `SCEN-005` (Req 2.2): Transfer funds from `readyToAssign` into envelope (`allocateEnvelope`).
- `SCEN-006` (Req 2.2): Over-allocation detection and warning state when `readyToAssignCents < 0`.
- `SCEN-014` (Req 5.2): 1-tap quick-fill allocation pills (+$50, +$100, Fill Remaining).
- `SCEN-015` (Req 5.3): Visual badges differentiating amber credit debt (`unfundedDebtCents > 0`) vs red cash overspending (`availableCents < 0`).

## Acceptance Checklist
- [x] Connect `Ready to Assign` header banner to `useLedgerStore.state.readyToAssignCents` (green for > 0, slate for == 0, red for < 0).
- [x] Render envelope categories dynamically grouped by obligation using `useLedgerStore.groups` and `useLedgerStore.state.categories`.
- [x] Implement interactive allocation drawer or inline quick-fill pills (+$50, +$100, Fill Remaining, -$50).
- [x] Render two-axis visual badges: Amber `CREDIT DEBT` for unfunded credit card debt vs Red `CASH OVERSPENT` for negative available cash.
- [x] Maintain container-presentational separation and zero-swallowed-exceptions discipline.


