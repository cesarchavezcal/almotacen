# Foundation: The Dual Ledger Container

## 1. Overview
The foundational container of `almotacen` is the Dual Ledger. It enforces mathematical equilibrium:
1. **Physical Reality (Accounts)**: Total Liquid Cash = Sum of all Checking, Savings, and Physical Cash balances minus unpaid Credit Card liabilities.
2. **Behavioral Intent (Budget Envelopes)**: Total Assigned Cash + `Ready to Assign` pool = Total Liquid Cash.

Every transaction moves money in both realms simultaneously:
- It deducts/credits money from an Account.
- It deducts/credits available spending power from an Envelope.

> Technical note: Local SQLite transactions enforce atomic dual-entry updates so Account and Category balances never desynchronize, even during offline usage.
