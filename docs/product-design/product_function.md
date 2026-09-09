# Product as a Function: `almotacen` Core Engine

## 1. Function Overview ($y = f(x)$)

$$\text{Financial Intentionality } (y) = f\left(\text{Cash Flow Blindness \& Rigid Budget Friction } (x)\right)$$

`almotacen` transforms the anxiety and passive disconnect of personal finance into real-time intentional cash flow management by fusing **reactive transaction awareness** (Monarch Money: where money went) with **proactive zero-based envelope budgeting** (YNAB: deciding where every dollar will go before spending).

---

## 2. Input Situation Matrix ($x$)

- **Trigger Event**: A user checks their bank account at the end of the month, discovers unexpected negative cash flow or zero savings, or experiences cognitive friction trying to manually update rigid budgeting spreadsheets after purchases.
- **Status Quo Baseline**: 
  - *Tool A (Pure Trackers like Monarch/Mint)*: Passively categorizes transactions after money has already left the account; offers zero constraint mechanism to stop impulsive overspending.
  - *Tool B (Pure Envelope Tools like YNAB)*: High setup friction, steep learning curve, desktop-heavy reconciliation, and punishing reconciliation when accounts desync.
- **Failure Condition**: The user abandons budgeting because passive tracking doesn't change behavior, while traditional envelope budgeting demands too much manual reconciliation friction at the point of sale.

---

## 3. Output Situation Matrix ($y$)

- **Target Transformed State**: 
  1. The user logs or reviews an expense in < 3 seconds on mobile.
  2. Every dollar of income is assigned to a proactive budget envelope ("To be Budgeted" = 0).
  3. Real-time cash flow visualizes current burn rate, runway, and available envelope balances before an expense occurs.
- **Fitness Criteria**:
  - Transaction entry completed in $\le 3$ gestures.
  - Instant zero-balance ledger calculation without round-trip network delays (local-first).
  - Unallocated cash visibly flagged until given a specific envelope assignment.

---

## 4. Minimal Function Scope ($f(x) \to y$)

### Core Functional Mechanism
1. **The Double-Sided Ledger Engine**:
   - Every transaction is simultaneously mapped to an **Account** (reactive balance tracking) and an **Envelope Category** (proactive spending allowance).
2. **Zero-Based Budget Allocation Table**:
   - Income inflow increases `Ready to Assign` pool.
   - User allocates pool amounts into categorized envelopes (Housing, Groceries, Discretionary, Emergency).
3. **Reactive Cash Flow Monitor**:
   - Real-time delta: Total Inflow vs Total Outflow with month-over-month trajectory.
4. **Point-of-Sale Quick Capture**:
   - Mobile-first quick entry sheet with smart category prediction based on recent payee history.

### 10x Scope-Stripping Audit
To guarantee delivery of a bulletproof core engine, the following secondary features are stripped from the initial core scope:
- ❌ **Plaid/Bank Auto-Sync**: Deferred in favor of fast manual entry and CSV import to eliminate third-party credential dependencies and flaky API sync loops in the core ledger.
- ❌ **Investment & Net Worth Tracking**: Crypto, 401k, and mortgage amortization are stripped; focus strictly on liquid cash flow and budgeting.
- ❌ **Multi-User / Shared Household Splitting**: Deferred; single-tenant personal ledger first.
- ❌ **Complex Loan Payoff Simulators**: Stripped; straightforward liability balance reduction only.

---

## 5. Pipeline Handoff Contracts

- **Downstream to `/product-description`**: Model the event-by-event interaction lifecycle of logging an expense, reallocating envelope funds, and handling offline interrupts.
- **Downstream to `/ia` & `/ooux`**:
  - Objects: `Account`, `EnvelopeCategory`, `BudgetMonth`, `Transaction`, `Payee`.
  - Routes: `/(tabs)/index` (Cash Flow Dashboard), `/(tabs)/budget` (Zero-Based Envelopes), `/(tabs)/accounts` (Liquid Accounts & Ledgers), `/modal` (Quick Capture Sheet).
