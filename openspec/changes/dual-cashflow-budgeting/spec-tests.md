# Behavioral Test Contract: Dual Cash Flow & Zero-Based Budgeting

## Seam Definition
- **Target Seam**: `LedgerService` (Pure Domain Module) & `useQuickTransaction` Hook
- **Language/Runner**: Jest / Vitest (`@testing-library/react-native`)

---

## Scenario Matrix

| Scenario ID | Story Ref | Type | Given / When | Expected Observable Outcome (Then) |
|---|---|---|---|---|
| `SCEN-001` | Req 1.1 | Happy Path | Outflow $75 from Checking ($1,000) to Groceries ($250) | Checking = $925, Groceries = $175, Outflow Delta = +$75 |
| `SCEN-002` | Req 1.2 | Boundary | Outflow $35 from Dining Out ($20) | Dining Out = -$15, overspent flag = true |
| `SCEN-003` | Req 1 | Negative | Outflow $0.00 submitted | Throws/returns `ValidationError: Amount must be greater than zero` |
| `SCEN-004` | Req 2.1 | Happy Path | Inflow $2,000 to Checking tagged as Income | Checking = +$2,000, `readyToAssign` = +$2,000 |
| `SCEN-005` | Req 2.2 | Happy Path | Assign $1,200 from `readyToAssign` ($2,000) to Rent ($0) | `readyToAssign` = $800, Rent Available = $1,200 |
| `SCEN-006` | Req 2.2 | Boundary | Assign $2,500 when `readyToAssign` is $2,000 | `readyToAssign` becomes -$500, over-assigned warning emitted |
| `SCEN-007` | Req 3.1 | Offline | Device disconnected, transaction logged | Local record created with `syncStatus: 'pending'` |
| `SCEN-012` | Req 4.1 | Happy Path | Smart payee memory queried for existing payee | Returns most recent `categoryId` and `accountId` from ledger history |
| `SCEN-013` | Req 4.3 | Happy Path | Quick outflow submission with valid amount, payee, account, category | Persists double-sided outflow to SQLite within 50ms |
| `SCEN-014` | Req 5.2 | Happy Path | Tap quick-fill pills (+$50, +$100, Fill Remaining) on envelope | Allocates chosen amount to envelope, decrements `readyToAssign` |
| `SCEN-015` | Req 5.3 | Visual/Logic | Render envelope badges with debt or cash overspending | Distinguishes amber `CREDIT DEBT` vs red `CASH OVERSPENT` |
| `SCEN-016` | Req 6.1 | Happy Path | Compute net cash flow and burn rate pace from monthly transactions | Returns net cashflow cents (inflows - outflows) and percentage of budget burned |
| `SCEN-017` | Req 6.2 | Happy Path | Generate cumulative daily spend series and linear budget pace | Aggregates daily outflows from day 1 to current day with exact linear pace line |
| `SCEN-018` | Req 6.3 | Boundary | Blended EOM forecast with discretionary velocity + fixed commitments | Projects end-of-month spend = actual + (daily discretionary rate * remaining days) + fixed |
| `SCEN-019` | Req 6.4 | Warning | Income ceiling alert when projected spend exceeds total inflows | Flags `EXCEEDS_INCOME` when projected EOM > income, `PACING_HIGH` when above pace |
| `SCEN-020` | Req 7.1 | Happy Path | Horizontal touch coordinate maps to calendar day | Resolves day 1..totalDaysInMonth and clamps boundaries strictly |
| `SCEN-021` | Req 7.2 | Visual/Logic | Compute pace delta for scrubbed day and format HUD tooltip | Computes signed difference; formats ahead of pace or behind pace |
| `SCEN-022` | Req 7.3 | Happy Path | Dynamic filtering of transactions by scrubbed calendar date | Filters transaction feed to matching dateStr or returns empty list |
| `SCEN-023` | Req 7.4 | Sensory | Emit micro-haptic tick on calendar day transition | Triggers selection haptic feedback when scrubbedDay changes |



---

## Red-Ready Test Stubs

```typescript
describe('Dual Ledger Engine Contract', () => {
  it('SCEN-001: atomically updates account and category balances on outflow', () => {
    // RED: Must fail until LedgerService is implemented
  });

  it('SCEN-002: allows category overspending while flagging overspent status', () => {
    // RED: Must fail until negative balance handling is implemented
  });

  it('SCEN-003: rejects zero-dollar outflow submissions', () => {
    // RED: Must fail until input validation is implemented
  });

  it('SCEN-004: credits readyToAssign pool upon income inflow', () => {
    // RED: Must fail until income categorization is implemented
  });

  it('SCEN-005: transfers funds from readyToAssign into budget envelope', () => {
    // RED: Must fail until envelope allocation is implemented
  });

  it('SCEN-006: warns when envelope assignments exceed readyToAssign pool', () => {
    // RED: Must fail until over-allocation detection is implemented
  });

  it('SCEN-007: writes transaction locally with pending sync status when offline', () => {
    // RED: Must fail until offline queue is implemented
  });

  it('SCEN-012: smart payee memory returns last used account and category for existing payee', () => {
    // RED: Must fail until Smart Payee Memory lookup is implemented
  });

  it('SCEN-013: quick outflow submission parses currency amount, validates > 0, and commits to SQLite', () => {
    // RED: Must fail until modal transaction submission is connected to useLedgerStore
  });

  it('SCEN-014: 1-tap quick-fill pills allocate funds to envelope and decrement readyToAssign', () => {
    // RED: Must fail until quick-fill allocation pills are connected
  });

  it('SCEN-015: envelope badges differentiate amber credit debt from red cash overspending', () => {
    // RED: Must fail until two-axis overspending badges are rendered
  });

  it('SCEN-016: computes net monthly cash flow and burn pace percentage from inflows and outflows', () => {
    // RED: Must fail until cashflow calculations are implemented
  });

  it('SCEN-017: aggregates daily cumulative spend and linear budget pace curve points', () => {
    // RED: Must fail until daily trajectory points calculation is implemented
  });

  it('SCEN-018: calculates blended EOM velocity projection combining discretionary burn rate and fixed obligations', () => {
    // RED: Must fail until blended EOM forecasting is implemented
  });

  it('SCEN-019: evaluates income ceiling thresholds and flags EXCEEDS_INCOME or PACING_HIGH', () => {
    // RED: Must fail until income ceiling evaluation is implemented
  });

  it('SCEN-020: maps horizontal touch position to calendar day and clamps boundaries', () => {
    // RED: Must fail until touch-to-day scrubbing math is implemented
  });

  it('SCEN-021: calculates pace delta in integer cents and formats HUD tooltip badge', () => {
    // RED: Must fail until pace delta computation is implemented
  });

  it('SCEN-022: dynamically filters transactions by scrubbed calendar date', () => {
    // RED: Must fail until day-filtered transactions helper is implemented
  });

  it('SCEN-023: triggers micro-haptic selection feedback on calendar day boundary change', () => {
    // RED: Must fail until haptic gesture feedback is connected
  });
});
```
