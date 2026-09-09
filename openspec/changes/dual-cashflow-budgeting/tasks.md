# Tracer-Bullet Tickets: Dual Cash Flow & Zero-Based Budgeting

## Dependency Graph
```text
Ticket 1: Core Dual-Ledger with Credit Payment Reserve
   │
   ▼
Ticket 2: SQLite Local-First Store & Seed Data
   │
   ├──► Ticket 3: POS Quick Capture Modal & Smart Payee Memory
   ├──► Ticket 4: Proactive Zero-Based Budgeting & Envelope Allocator
   └──► Ticket 5: Reactive Cash Flow Trajectory Curve & Income Ceiling
           │
           ├──► Ticket 6: Interactive Chart Scrubbing & Dynamic Day Filter
           └──► Ticket 7: Month Cycle Paging & Rollover
```

---

### Ticket 1: Core Dual-Ledger with Credit Payment Reserve
- **Blocked by**: None — can start immediately
- **What it delivers**: Pure domain ledger engine supporting atomic cash and credit card outflows. Credit charges automatically transfer available cash from the spending category to a dedicated credit card payment envelope, flagging any deficit as unfunded credit debt.
- **Criteria**:
  - [x] `Account`, `Category`, `Transaction` types updated with credit payment envelope IDs and debt flags.
  - [x] `postOutflowTransaction` transfers cash to payment envelope up to available category balance.
  - [x] Unfunded credit debt calculated and flagged without throwing errors.
  - [x] Unit test suite verifying credit reserve transfers and cash deficit scenarios.

### Ticket 2: SQLite Local-First Store & Seed Data
- **Blocked by**: Ticket 1
- **What it delivers**: Persistent local SQLite database layer with atomic transactions and reactive state hook (`useLedgerStore`). App launches with instant default accounts and envelope groups.
- **Criteria**:
  - [x] SQLite tables created for accounts, categories, and transactions with offline sync markers.
  - [x] Transactional repository executes atomic double-sided updates.
  - [x] Initial database seed initializes Checking, Credit Card, and primary category groups.
  - [x] Integration test verifies state persists across app reloads.

### Ticket 3: POS Quick Capture Modal & Smart Payee Memory
- **Blocked by**: Ticket 2
- **What it delivers**: Sub-3-second point-of-sale quick expense capture modal (`/modal.tsx`). Typing or tapping a payee auto-populates category and account from the last transaction with that payee, with live envelope balance impact preview and haptic feedback.
- **Criteria**:
  - [x] Auto-focused numeric pad with amount formatting.
  - [x] Smart Payee Memory prefills category and account from payee history.
  - [x] Real-time category preview reflects available balance before saving.
  - [x] Single-tap save with debouncing and instant haptic tick.

### Ticket 4: Proactive Zero-Based Budgeting & Envelope Allocator
- **Blocked by**: Ticket 2
- **What it delivers**: Live zero-based budget tab (`app/(tabs)/budget.tsx`) with interactive category allocation steppers, quick-fill pills (+$50, +$100, Fill Remaining), and distinct visual badges for credit debt (amber) vs cash overspending (red).
- **Criteria**:
  - [ ] `Ready to Assign` header banner updates live with color state (green/neutral/red).
  - [ ] Category rows render progress bars and available balances from SQLite.
  - [ ] Quick-pill buttons allow 1-tap envelope funding from unassigned pool.
  - [ ] Visual indicators differentiate unfunded credit debt from liquid cash deficits.

### Ticket 5: Reactive Cash Flow Trajectory Curve & Income Ceiling
- **Blocked by**: Ticket 2
- **What it delivers**: Live cash flow dashboard (`app/(tabs)/index.tsx`) rendering an interactive SVG cumulative spending curve against linear budget pace, blended EOM projected velocity (isolating fixed bills), and a horizontal Income Ceiling marker.
- **Criteria**:
  - [ ] `useCashflow` hook computes daily cumulative spend and blended EOM velocity.
  - [ ] SVG trajectory curve plots actual spend through today with dashed EOM forecast.
  - [ ] Horizontal Income Ceiling line renders with warning styling if spend crosses it.
  - [ ] Titanium Hero Card metrics reflect live net cash flow and burn rate percentage.

### Ticket 6: Interactive Chart Scrubbing & Dynamic Day Filter
- **Blocked by**: Ticket 5
- **What it delivers**: Horizontal thumb drag gesture across the Cash Flow chart that locks vertical scroll, displays a point-in-time HUD tooltip with micro-haptics on day ticks, and dynamically filters the transaction feed below to the scrubbed date.
- **Criteria**:
  - [ ] Pan gesture tracks touch coordinates to calendar day boundaries.
  - [ ] Micro-haptic ticks fire upon crossing day tick markers.
  - [ ] Floating tooltip HUD displays scrubbed date, cumulative spend, and pace delta.
  - [ ] Recent Outflows list dynamically filters to the scrubbed date during drag.

### Ticket 7: Month Cycle Paging & Rollover
- **Blocked by**: Ticket 5
- **What it delivers**: Month paging header (`< September 2026 >`) allowing users to navigate between calendar months, view historical spend curves, and execute month rollover (carrying forward positive balances and settling cash deficits against next month's Ready to Assign).
- **Criteria**:
  - [ ] Month selector component with animated curve transitions.
  - [ ] Historical queries load previous month ledger records cleanly.
  - [ ] Rollover logic carries forward positive category balances and deducts cash deficits.
