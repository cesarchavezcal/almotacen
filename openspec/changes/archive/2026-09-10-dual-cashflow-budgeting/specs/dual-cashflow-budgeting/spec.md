# Delta for Dual Cash Flow & Zero-Based Budgeting

## ADDED Requirements

### Requirement: Reactive Cash Flow Trajectory & Blended EOM Projection
The system MUST calculate and render a cumulative daily spending curve up to the current day against a linear planned budget pace line, and MUST project End-of-Month (EOM) spending using a blended fixed versus discretionary daily burn velocity.

#### Scenario: Normal Spend Trajectory within Budget Pace
- GIVEN a month with 30 days and total planned budget of $3,000.00 ($100.00/day linear pace)
- WHEN the user views the Cash Flow Dashboard on Day 15 having spent $1,200.00
- THEN the system displays the actual spend curve at $1,200.00
- AND indicates spending is $300.00 ahead of pace with positive trajectory styling

#### Scenario: Blended EOM Forecast with Fixed Obligation Isolation
- GIVEN a user with $1,500.00 in fixed expenses (Rent paid on Day 1) and $600.00 spent in variable categories through Day 10 ($60.00/day variable velocity)
- WHEN the system calculates projected end-of-month spend for a 30-day month
- THEN the projected EOM total is calculated as $1,500.00 + ($60.00 * 29 days) = $3,240.00
- AND renders a dashed forecast trajectory converging to $3,240.00

### Requirement: Interactive Touch Scrubbing & Contextual Day Filter
The Cash Flow Trajectory Chart MUST support horizontal pan scrubbing that reveals a floating point-in-time HUD tooltip, emits micro-haptic ticks on calendar day transitions, and dynamically filters the transaction feed to the scrubbed date.

#### Scenario: Scrubbing Historical Spend Day
- GIVEN 10 logged transactions across the current month
- WHEN the user touches and drags horizontally to Day 12
- THEN the vertical tracker line aligns with Day 12
- AND a floating HUD displays Day 12 cumulative outflow and pace delta
- AND the transaction list below updates immediately to show only Day 12 transactions

#### Scenario: Scrub Gesture Release
- GIVEN the user is actively scrubbing Day 12
- WHEN the user lifts touch from the chart canvas
- THEN the scrubber HUD smoothly fades out
- AND the transaction list restores display of the most recent transactions

### Requirement: Income Ceiling Marker & Runway Warning
The Cash Flow Chart MUST render a horizontal Income Ceiling line representing total monthly inflows, and MUST visually shift the trajectory curve to warning amber or red if projected spending breaches the ceiling.

#### Scenario: Projected Spend Breaches Income
- GIVEN total monthly inflow is $4,000.00 and projected EOM spend is $4,300.00
- WHEN the Cash Flow screen renders the trajectory
- THEN the forecast line turns amber/red as it crosses the $4,000.00 ceiling
- AND the Titanium Hero Card status updates to "Pace Alert: Projected Outflow Exceeds Inflow"

### Requirement: Smart Payee Memory & Fast Prefill
The Point-of-Sale Quick Capture sheet MUST record the most recent Category and Account used for each unique Payee, and MUST automatically prefill those fields when that Payee is selected or typed.

#### Scenario: Auto-fill from Recent Payee History
- GIVEN the user previously logged a transaction with Payee "Trader Joe's" using category "Groceries" and account "Sapphire Card"
- WHEN the user opens Quick Capture and types or taps "Trader Joe's"
- THEN category "Groceries" and account "Sapphire Card" are prefilled automatically
- AND can be overridden with a single tap

## MODIFIED Requirements

### Requirement: Double-Sided Atomic Transaction Posting
Every recorded outflow MUST decrement the selected account balance and decrement the specified category available balance in a single atomic transaction. When the transaction uses a credit account, the system MUST automatically transfer available category cash to the dedicated Credit Card Payment envelope, flagging any deficit as unfunded credit debt.
(Previously: Outflows decremented account and category without automated credit payment reserve transfers)

#### Scenario: Standard Checking Outflow Entry
- GIVEN an account "Checking" with balance $1,000.00 and an envelope category "Groceries" with available balance $250.00
- WHEN the user logs an outflow of $75.00 for payee "Supermarket" assigned to "Groceries" using "Checking"
- THEN the "Checking" balance becomes $925.00
- AND the "Groceries" available balance becomes $175.00
- AND the monthly cash flow outflow total increments by $75.00

#### Scenario: Credit Outflow with Automated Payment Reserve Transfer
- GIVEN category "Dining" has $50.00 available and "Credit Card Payment" envelope has $0.00 available
- WHEN the user logs a $50.00 charge on "Credit Card" for "Dining"
- THEN the credit card liability balance increases by $50.00
- AND "Dining" available balance becomes $0.00
- AND "Credit Card Payment" available balance increases by $50.00

#### Scenario: Credit Outflow Exceeding Envelope Available Cash
- GIVEN category "Dining" has $30.00 available and "Credit Card Payment" has $0.00 available
- WHEN the user logs a $50.00 charge on "Credit Card" for "Dining"
- THEN credit card liability increases by $50.00
- AND $30.00 of cash moves to "Credit Card Payment" envelope
- AND "Dining" reflects an amber alert with $20.00 of unfunded credit debt
