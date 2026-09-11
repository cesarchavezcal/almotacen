# Behavioral Test Contracts: Proactive Budgeting Decision Engine

Defines test contracts for `SCEN-028` through `SCEN-035` without implementation contamination.

---

### SCEN-028: Needed for Spending Target with Positive Rollover
- **Target**: `src/domain/ledger/targets.test.ts`
- **Given**: Category with `targetType: 'NEEDED_FOR_SPENDING'`, `targetCents: 50000`, `availableCents: 15000`, `assignedCents: 0`.
- **When**: `calculateCategoryUnderfunded(...)` is evaluated.
- **Then**: Returns `underfundedCents: 35000`, `isFunded: false`.

### SCEN-029: Monthly Set-Aside Target with Positive Rollover
- **Target**: `src/domain/ledger/targets.test.ts`
- **Given**: Category with `targetType: 'MONTHLY_SET_ASIDE'`, `targetCents: 20000`, `availableCents: 100000`, `assignedCents: 0`.
- **When**: `calculateCategoryUnderfunded(...)` is evaluated.
- **Then**: Returns `underfundedCents: 20000`, `isFunded: false`.

### SCEN-030: Fully Funded Category
- **Target**: `src/domain/ledger/targets.test.ts`
- **Given**: Category with `targetCents: 120000`, `assignedCents: 120000`.
- **When**: `calculateCategoryUnderfunded(...)` is evaluated.
- **Then**: Returns `underfundedCents: 0`, `isFunded: true`.

### SCEN-031: Priority 1 - Fund Overspent Categories First in Auto-Assign
- **Target**: `src/domain/ledger/autoAssign.test.ts`
- **Given**: `readyToAssignCents = 30000`, category A has `availableCents = -5000`, category B underfunded by `100000`.
- **When**: `calculateAutoAssignAllocations(...)` is executed.
- **Then**: Category A gets `5000`, Category B gets `25000`, `remainingReadyToAssignCents = 0`.

### SCEN-032: Priority Order - Immediate Obligations before Quality of Life
- **Target**: `src/domain/ledger/autoAssign.test.ts`
- **Given**: `readyToAssignCents = 50000`, Category "Electric" in `grp-immediate` (due day 15) underfunded by `15000`, Category "Vacation" in `grp-qol` (due day 30) underfunded by `50000`.
- **When**: `calculateAutoAssignAllocations(...)` is executed.
- **Then**: "Electric" receives `15000`, "Vacation" receives `35000`, `remainingReadyToAssignCents = 0`.

### SCEN-033: Insufficient Ready to Assign Exhaustion Invariant
- **Target**: `src/domain/ledger/autoAssign.test.ts`
- **Given**: `readyToAssignCents = 10000`, total budget underfunded `100000`.
- **When**: `calculateAutoAssignAllocations(...)` is executed.
- **Then**: Total sum of allocations is exactly `10000`, remaining is `0`.

### SCEN-034: Cover Cash Overspending from Funded Category
- **Target**: `src/domain/ledger/overspendingCoverage.test.ts`
- **Given**: Overspent category with `availableCents = -3000`, source category with `availableCents = 15000`.
- **When**: `coverOverspending(overspentId, sourceId, 3000)` is executed.
- **Then**: Overspent category available becomes `0`, source category available becomes `12000`.

### SCEN-035: Cover Credit Card Unfunded Debt
- **Target**: `src/domain/ledger/overspendingCoverage.test.ts`
- **Given**: Category with `unfundedDebtCents = 4500`, source category with `availableCents = 10000`.
- **When**: `coverCreditDebt(categoryId, sourceId, 4500, ccPaymentCategoryId)` is executed.
- **Then**: Category `unfundedDebtCents` becomes `0`, CC payment available increases by `4500`, source available decreases by `4500`.
