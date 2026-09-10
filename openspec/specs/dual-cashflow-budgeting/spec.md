# Spec: Dual Cash Flow & Zero-Based Budgeting Engine

## 1. Context & Purpose
`almotacen` merges reactive cash flow visibility (Monarch Money) with proactive envelope budgeting (YNAB). Every financial transaction updates both liquid account balances and envelope category allocations simultaneously.

---

## 2. Requirements & Acceptance Criteria

### Requirement 1: Double-Sided Atomic Transaction Posting
Every recorded outflow MUST decrement the selected account balance and decrement the specified category available balance in a single atomic transaction.

- **Scenario 1.1 (Standard Outflow Entry)**:
  - **Given** an account "Checking" with balance $1,000.00 and an envelope category "Groceries" with available balance $250.00.
  - **When** the user logs an outflow of $75.00 for payee "Supermarket" assigned to "Groceries" using "Checking".
  - **Then** the "Checking" balance becomes $925.00.
  - **And** the "Groceries" available balance becomes $175.00.
  - **And** the monthly cash flow outflow total increments by $75.00.

- **Scenario 1.2 (Overspending Category)**:
  - **Given** category "Dining Out" with available balance $20.00.
  - **When** the user logs an outflow of $35.00.
  - **Then** the category balance becomes -$15.00.
  - **And** the interface flags an overspent warning without blocking the transaction.

### Requirement 2: Zero-Based Income Allocation
Every recorded income inflow MUST increase the selected account balance and credit the `Ready to Assign` pool.

- **Scenario 2.1 (Paycheck Inflow)**:
  - **Given** `Ready to Assign` is $0.00 and "Checking" balance is $500.00.
  - **When** the user logs an inflow of $2,000.00 tagged as "Income".
  - **Then** "Checking" balance becomes $2,500.00.
  - **And** `Ready to Assign` becomes $2,000.00.

- **Scenario 2.2 (Category Assignment)**:
  - **Given** `Ready to Assign` is $2,000.00 and category "Rent" has assigned $0.00.
  - **When** the user assigns $1,200.00 to "Rent".
  - **Then** `Ready to Assign` decreases to $800.00.
  - **And** "Rent" available balance increases by $1,200.00.

### Requirement 3: Offline-First Optimistic Persistence
Transactions entered while disconnected MUST commit immediately to local SQLite storage and synchronize when connectivity resumes.

- **Scenario 3.1 (Offline Transaction)**:
  - **Given** the device has no network connection.
  - **When** the user enters a transaction.
  - **Then** local ledger and category balances update instantly (< 50ms).
  - **And** the transaction is marked with `pending_sync` status.

### Requirement 4: Point-of-Sale Quick Capture & Smart Payee Memory
The transaction capture modal MUST minimize point-of-sale friction (< 3 seconds entry) by auto-focusing numeric input, intelligently recalling past categories and accounts by payee, and previewing envelope balance impact before saving.

- **Scenario 4.1 (Smart Payee Prefill)**:
  - **Given** a historical transaction with payee "Trader Joe's" using account "Apple Card" and category "Groceries".
  - **When** the user enters or selects "Trader Joe's" in the quick capture modal.
  - **Then** the category is automatically preselected as "Groceries".
  - **And** the account is automatically preselected as "Apple Card".

- **Scenario 4.2 (Live Envelope Balance Impact Preview)**:
  - **Given** an envelope "Dining Out" with available balance $50.00.
  - **When** the user types amount $20.00 for category "Dining Out".
  - **Then** the interface displays an impact preview showing `$50.00 ➔ $30.00`.
  - **And** if amount exceeds available balance ($65.00), the preview badges overspending in amber warning style (`$50.00 ➔ -$15.00`).

- **Scenario 4.3 (Atomic Commit & Haptic Dismissal)**:
  - **Given** a completed entry with positive amount, account, and category.
  - **When** the user taps "Save".
  - **Then** an atomic outflow transaction is committed to SQLite.
  - **And** a success haptic notification fires.
  - **And** the modal dismisses immediately.

### Requirement 5: Proactive Envelope Allocation & Overspending Badges
The budgeting tab MUST display a dynamic `Ready to Assign` header banner reflecting unallocated cash, render categories grouped by obligation, provide 1-tap quick-fill allocation pills, and visually distinguish unfunded credit debt from liquid cash overspending.

- **Scenario 5.1 (Ready to Assign Header Banner States)**:
  - **Given** positive `readyToAssignCents`.
  - **When** viewing the budgeting tab.
  - **Then** the header banner renders in emerald green with total available to assign.
  - **And** if `readyToAssignCents` is exactly zero, it displays a neutral zero-based badge.
  - **And** if `readyToAssignCents` is negative, it displays a red over-assigned warning.

- **Scenario 5.2 (1-Tap Quick-Fill Allocation)**:
  - **Given** an envelope category and a positive `readyToAssign` pool.
  - **When** tapping quick-fill pills (+$50, +$100, or "Fill Remaining").
  - **Then** the envelope assigned amount increases by the chosen amount.
  - **And** `readyToAssignCents` decreases accordingly in real-time.

- **Scenario 5.3 (Dual-Axis Debt vs Cash Overspending Badges)**:
  - **Given** envelope categories with negative or debt status.
  - **When** a category has unfunded credit debt.
  - **Then** an amber `CREDIT DEBT` badge is displayed.
  - **When** a category has negative available cash.
  - **Then** a red `CASH OVERSPENT` badge is displayed.

### Requirement 6: Reactive Cash Flow Trajectory & Income Ceiling
The cash flow dashboard MUST compute net cash flow from recorded transactions, calculate daily cumulative spend and linear planned budget pace, project end-of-month (EOM) spending using a blended velocity model, and warn when projected spending breaches the monthly income ceiling.

- **Scenario 6.1 (Net Cash Flow & Titanium Hero Card - `SCEN-016`)**:
  - **Given** recorded inflows of $4,850.00 and outflows of $3,424.50.
  - **When** the dashboard computes net cash flow and burn rate.
  - **Then** net cash flow equals +$1,425.50 (inflows minus outflows).
  - **And** burn rate pace displays the spent percentage relative to monthly budget.

- **Scenario 6.2 (Cumulative Daily Spend & Linear Budget Pace - `SCEN-017`)**:
  - **Given** calendar day 15 in a 30-day month and a planned monthly budget of $3,000.00.
  - **When** generating trajectory series points.
  - **Then** linear budget pace for day 15 equals $1,500.00 (`(totalBudget / 30) * 15`).
  - **And** actual cumulative spend plots aggregated daily outflows from day 1 through day 15.

- **Scenario 6.3 (Blended EOM Velocity Forecasting - `SCEN-018`)**:
  - **Given** day 10 in a 30-day month with $600.00 spent on discretionary categories ($60.00/day velocity) and $1,200.00 in remaining committed fixed expenses.
  - **When** calculating projected EOM spend.
  - **Then** projected discretionary spend for remaining 20 days is $1,200.00 (`$60.00 * 20`).
  - **And** total projected EOM spend is actual spend ($600.00) + projected discretionary ($1,200.00) + committed fixed ($1,200.00) = $3,000.00.

- **Scenario 6.4 (Horizontal Income Ceiling Warning - `SCEN-019`)**:
  - **Given** total monthly income inflows of $3,200.00 (income ceiling).
  - **When** projected EOM spend reaches $3,400.00.
  - **Then** the ceiling status triggers an `EXCEEDS_INCOME` warning flag.
  - **When** projected EOM spend is within 100% of income but exceeds linear pace.
  - **Then** the status triggers a `PACING_HIGH` warning flag.
  - **When** projected EOM spend is at or below linear pace.
  - **Then** the status evaluates as `ON_TRACK`.



