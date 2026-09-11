# Capability Specification: Proactive Budgeting Decision Engine

## Purpose
Specifies behavioral contracts for category targets, real-time underfunded deficit calculations, deterministic payday auto-assign prioritization, and envelope overspending coverage in `almotacen`.

---

## Requirements

### Requirement: Dual Target Types & Underfunded Deficit
The system MUST support dual category target types (`NEEDED_FOR_SPENDING` and `MONTHLY_SET_ASIDE`).
Underfunded amounts MUST be calculated deterministically in real-time.

#### Scenario: Needed for Spending Target with Positive Rollover (SCEN-028)
- GIVEN a category "Groceries" with `targetType = 'NEEDED_FOR_SPENDING'` and `targetCents = 50000` ($500.00)
- AND positive rollover from previous month of $150.00 (`availableCents = 15000`)
- AND current month assigned is $0.00
- WHEN calculating the underfunded amount for "Groceries"
- THEN underfunded deficit is $350.00 (`35000` cents)
- AND `isFunded` is `false`.

#### Scenario: Monthly Set-Aside Target with Positive Rollover (SCEN-029)
- GIVEN a category "Emergency Fund" with `targetType = 'MONTHLY_SET_ASIDE'` and `targetCents = 20000` ($200.00)
- AND positive rollover from previous month of $1,000.00 (`availableCents = 100000`)
- AND current month assigned is $0.00
- WHEN calculating the underfunded amount for "Emergency Fund"
- THEN underfunded deficit is $200.00 (`20000` cents)
- AND past rollover does NOT reduce current month commitment.

#### Scenario: Fully Funded Category (SCEN-030)
- GIVEN a category "Rent" with `targetCents = 120000` ($1,200.00)
- WHEN current month assigned reaches or exceeds $1,200.00
- THEN underfunded deficit is $0.00
- AND `isFunded` is `true`.

---

### Requirement: Deterministic Payday Auto-Assign Prioritization
The system MUST provide an Auto-Assign algorithm allocating available `readyToAssignCents` without human guesswork, strictly never producing negative `readyToAssignCents`.

#### Scenario: Priority 1 - Fund Overspent Categories First (SCEN-031)
- GIVEN `readyToAssignCents` is $300.00 (`30000` cents)
- AND category "Dining Out" has cash overspending of -$50.00 (`availableCents = -5000`)
- AND category "Rent" is underfunded by $1,000.00
- WHEN the user triggers Auto-Assign
- THEN "Dining Out" receives $50.00 to restore `availableCents` to $0.00 before any other allocation
- AND remaining $250.00 is allocated to "Rent"
- AND `readyToAssignCents` becomes $0.00.

#### Scenario: Priority Order - Immediate Obligations before Quality of Life (SCEN-032)
- GIVEN `readyToAssignCents` is $500.00
- AND "Electric Bill" (group `grp-immediate`, due day 15) is underfunded by $150.00
- AND "Vacation" (group `grp-qol`, due day 30) is underfunded by $500.00
- WHEN the user triggers Auto-Assign
- THEN "Electric Bill" is fully funded with $150.00
- AND "Vacation" receives the remaining $350.00 (partial funding)
- AND `readyToAssignCents` becomes $0.00.

#### Scenario: Insufficient Ready to Assign Exhaustion Invariant (SCEN-033)
- GIVEN `readyToAssignCents` is $100.00
- AND total budget underfunded is $1,000.00 across 5 categories
- WHEN Auto-Assign runs
- THEN total allocated amount across all categories is exactly $100.00
- AND `readyToAssignCents` becomes exactly $0.00
- AND no category receives more than its underfunded amount.

---

### Requirement: Interactive Overspending Coverage ("Roll with the Punches")
When a category is overspent (cash overspent or credit debt), the system MUST allow transferring available funds from another funded category in a single atomic operation.

#### Scenario: Cover Cash Overspending from Funded Category (SCEN-034)
- GIVEN category "Dining Out" has `availableCents = -3000` (-$30.00)
- AND category "Groceries" has `availableCents = 15000` ($150.00)
- WHEN the user covers $30.00 of "Dining Out" overspending using "Groceries"
- THEN "Dining Out" `availableCents` becomes $0.00
- AND "Groceries" `availableCents` becomes $120.00 (`12000` cents)
- AND `readyToAssignCents` remains unchanged (zero-based conservation).

#### Scenario: Cover Credit Card Unfunded Debt (SCEN-035)
- GIVEN category "Electronics" has `unfundedDebtCents = 4500` ($45.00) from credit card purchase
- AND category "Emergency Fund" has `availableCents = 10000` ($100.00)
- WHEN the user covers $45.00 debt using "Emergency Fund"
- THEN "Electronics" `unfundedDebtCents` becomes $0.00
- AND credit card payment category available balance increments by $45.00
- AND "Emergency Fund" `availableCents` decrements by $45.00.
