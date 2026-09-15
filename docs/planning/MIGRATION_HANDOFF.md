# Almotacen Native iOS Migration Handoff

> **Reference Implementation**: TypeScript / React Native Expo (`almotacen`)  
> **Target Project**: Pure Native iOS 17+ Swift / SwiftUI (`almotacen-ios`)  
> **Status**: Ready for Agent Implementation  

---

## 1. Executive Summary & Vision

**Almotacen** is a private, local-first personal finance application that bridges **zero-based envelope budgeting** (every dollar gets a job before you spend it) with **forward-looking daily cashflow trajectory projection** and an **Apple Wallet physical card aesthetic**.

The reference implementation in TypeScript/Expo verified all mathematical models, state machines, and UX workflows across **19 test suites and 128 automated tests**. 

Your mission in this repository is to build the **pure native Swift / SwiftUI implementation** targeting iOS 17+ using **GRDB.swift** for SQLite persistence and Swift Testing / XCTest.

### Strict MVP Boundaries
1. **Zero External Sync**: No Plaid, no bank sync, no Apple Wallet APIs (PassKit), no cloud backends. Pure on-device local SQLite.
2. **Strict Integer Cents**: All money is `Int64` cents. Never use `Double`, `Float`, or floating-point decimals for domain math or persistence.
3. **No Slop / AI Tells**: Commit messages use Conventional Commits without AI attribution.

---

## 2. Mathematical Invariants & Domain Rules

### A. The Core Ledger Balance Sheet
Every inflow of cash enters the **Ready to Assign** pool. Money is moved out of Ready to Assign by assigning it to category envelopes.

$$\text{Ready to Assign} = \sum(\text{Cash Account Inflows}) - \sum(\text{Allocated to Categories})$$

### B. Credit Card Liability & Reserve Transfer Model
Almotacen handles credit cards using a dual-ledger reserve model:
1. **Funded Credit Outflow**:
   - When an outflow occurs on a credit account assigned to category $C$:
   - The category's `availableCents` decreases by the transaction amount:
     $$\Delta \text{category.availableCents} = -\text{amount}$$
   - The credit account's balance increases (more negative / higher liability):
     $$\Delta \text{creditAccount.balanceCents} = -\text{amount}$$
   - **Automatic Reserve Transfer**: The amount spent is automatically allocated to the credit card's payment category (`isCreditPayment = true`):
     $$\Delta \text{creditPaymentCategory.availableCents} = +\text{amount}$$
   - *Result*: The user always has cash set aside to pay the credit card balance in full.
2. **Underfunded / Overspent Credit Outflow**:
   - If the category has insufficient funds (e.g. available is $30, but charge is $50):
   - Category available becomes $0 (or negative if partially cash-funded).
   - Only the available portion ($30) is transferred to the credit card payment category.
   - The remaining portion ($20) becomes **Unfunded Debt**:
     $$\Delta \text{category.unfundedDebtCents} = +2000$$
   - The total cash Ready to Assign is NOT depleted, but credit debt increases.
3. **Credit Card Payment**:
   - Paying a credit card is an outflow from a cash account (checking) directed to the credit account:
   - Cash account balance decreases: $\Delta \text{checking.balanceCents} = -\text{payment}$
   - Credit card payment category decreases: $\Delta \text{creditPaymentCategory.availableCents} = -\text{payment}$
   - Credit card account balance improves: $\Delta \text{creditAccount.balanceCents} = +\text{payment}$

---

## 3. Proven Domain Engines to Port

### 1. `LedgerEngine` (`ALM-001`)
- **Location in reference**: `src/domain/ledger/ledgerEngine.ts`
- **Responsibilities**:
  - `postOutflowTransaction(account, category, creditPaymentCategory, amountCents)`
  - `postInflowTransaction(account, amountCents)`
  - `postTransferTransaction(fromAccount, toAccount, amountCents)`
  - Atomic double-entry consistency; maintains invariant that cash accounts equal assigned cash + Ready to Assign.

### 2. `TargetsEngine` (`ALM-008`, `ALM-013`)
- **Location in reference**: `src/domain/ledger/targets.ts`
- **Target Types**:
  1. `NEEDED_FOR_SPENDING`: Due by day of month (or recurring cycle). Underfunded = `max(0, targetCents - (assignedCents + availableCents))`.
  2. `MONTHLY_SET_ASIDE`: Fixed amount saved each cycle regardless of spending. Underfunded = `max(0, targetCents - assignedCents)`.
  3. `SAVINGS_BALANCE`: Target total balance reached by a target date.
  4. `DEBT_PAYDOWN`: Fixed monthly payoff amount for liability accounts.
- **Formulas**:
  - `calculateCategoryTargetStatus(category, currentCycle)` $\to$ `TargetStatus` (`met`, `underfunded`, `unfunded`).

### 3. `AutoAssignEngine` (`ALM-009`)
- **Location in reference**: `src/domain/ledger/autoAssign.ts`
- **Logic**:
  - Takes `readyToAssignCents` and all categories grouped by group sort order.
  - Sequentially allocates available cash to underfunded categories in strict priority order:
    1. Immediate Obligations (Rent, Utilities, Groceries)
    2. True Expenses (Auto Maintenance, Medical)
    3. Quality of Life (Dining, Entertainment)
  - Allocation is capped by `readyToAssignCents`; does not over-assign into negative.

### 4. `OverspendingCoverageEngine` (`ALM-010`)
- **Location in reference**: `src/domain/ledger/overspendingCoverage.ts`
- **Logic**:
  - Detects categories where `availableCents < 0` (cash overspending) or `unfundedDebtCents > 0` (credit overspending).
  - Finds donor categories with `availableCents > 0` sorted by lowest priority group.
  - Generates recommended reallocations to bring overspent categories back to zero.

### 5. `RolloverEngine` (`ALM-007`)
- **Location in reference**: `src/domain/ledger/rollover.ts`
- **Month Cycle Transition**:
  - Positive available balances roll over: $\text{available}_{m+1} = \text{available}_m + \text{assigned}_{m+1}$.
  - Cash overspending: negative balance is deducted from next month's Ready to Assign:
    $$\text{ReadyToAssign}_{m+1} = \text{ReadyToAssign}_{m+1} - |\text{negativeAvailable}|$$
  - Credit overspending: category resets to $0; unpaid liability remains as credit card balance.

### 6. `CashflowEngine` & Scrubbing Math (`ALM-005`, `ALM-006`)
- **Location in reference**: `src/domain/cashflow/cashflowCalculations.ts` & `scrubbingMath.ts`
- **Logic**:
  - Projects daily cash balance over 30/60/90 days based on scheduled transactions, upcoming bills, and recurring income.
  - Haptic-driven scrubbing math that snaps to transaction event days.

---

## 4. SQLite Database Architecture (GRDB.swift)

Recommended schema structure in Swift using **GRDB.swift**:

```sql
-- Schema v1
CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  account_type TEXT NOT NULL, -- 'checking', 'savings', 'credit'
  balance_cents INTEGER NOT NULL,
  credit_payment_category_id TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE category_groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  name TEXT NOT NULL,
  target_cents INTEGER NOT NULL DEFAULT 0,
  target_type TEXT NOT NULL DEFAULT 'NEEDED_FOR_SPENDING',
  target_due_day INTEGER,
  assigned_cents INTEGER NOT NULL DEFAULT 0,
  available_cents INTEGER NOT NULL DEFAULT 0,
  is_credit_payment INTEGER NOT NULL DEFAULT 0,
  unfunded_debt_cents INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (group_id) REFERENCES category_groups (id)
);

CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  category_id TEXT,
  payee TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  direction TEXT NOT NULL, -- 'inflow', 'outflow'
  occurred_at TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'pending',
  unfunded_debt_cents INTEGER DEFAULT 0,
  transferred_to_reserve_cents INTEGER DEFAULT 0,
  FOREIGN KEY (account_id) REFERENCES accounts (id),
  FOREIGN KEY (category_id) REFERENCES categories (id)
);

-- Schema v3 Additions
CREATE TABLE transaction_splits (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  memo TEXT,
  FOREIGN KEY (transaction_id) REFERENCES transactions (id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories (id)
);

CREATE TABLE metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

---

## 5. UI Architecture & Apple Card Design System

The reference design system is documented in [`docs/product-design/design/DESIGN-swiftui.md`](file:///Users/cesaradalbertochavezcalderon/Personal/almotacen-ios/docs/product-design/design/DESIGN-swiftui.md).

### Components Available in SwiftUI
1. **`AppleCardFace`**:
   - Titanium mesh gradient with subtle shimmer reflection.
   - Dynamic balance, chip glyph, contactless symbol, and account number.
2. **`CreditCardFace`**:
   - High-contrast dark titanium pass with dual indicators: Payment Due & Available to Pay reserve.
3. **`EnvelopePassFace`**:
   - Physical boarding pass / concert ticket aesthetic with barcode glyph, category name, target progress gauge, and status pill.
4. **`CardStack`**:
   - Interactive wallet stack with vertical overlap (`yOffset = index * 44`), tap-to-expand animation, and haptic feedback (`UIImpactFeedbackGenerator(style: .medium)`).

---

## 6. How to Pick Up Work as a Coding Agent

When you start a session in `almotacen-ios`:
1. Check `progress.md`: It points to **`ALM-001: Core Dual-Ledger with Credit Payment Reserve`**.
2. Read the scenario contract: Open `openspec/changes/01-dual-cashflow-budgeting/spec-tests.md` and read `SCEN-001` through `SCEN-004`.
3. Open `openspec/changes/01-dual-cashflow-budgeting/tickets/01-core-dual-ledger.md`.
4. Follow **Red ➔ Green ➔ Refactor TDD**:
   - Write failing unit tests in `almotacen-iosTests/Domain/LedgerTests.swift`.
   - Implement `Account`, `Category`, `Transaction`, and `LedgerEngine` in `almotacen-ios/Domain/`.
   - Run `./init.sh` to confirm all tests pass.
   - Commit cleanly using Conventional Commits (`feat(ledger): implement core dual-ledger value types and payment reserve (ALM-001)`).
5. Mark the ticket complete and move to `ALM-002: SQLite Local-First Store & Seed Data (GRDB.swift)`.
