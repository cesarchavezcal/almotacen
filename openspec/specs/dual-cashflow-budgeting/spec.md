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
