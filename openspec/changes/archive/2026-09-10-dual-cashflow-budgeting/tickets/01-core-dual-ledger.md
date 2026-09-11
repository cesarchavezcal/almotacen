# 01 — Core Dual-Ledger with Credit Payment Reserve

**What to build:** The pure domain ledger engine that records outflows across cash/checking and credit card accounts. When spending on a credit card, cash from the budgeted envelope is automatically transferred to a dedicated Credit Card Payment envelope to ensure the user can pay off their balance in full. When spending exceeds envelope cash, the deficit is flagged as unfunded credit debt without halting the transaction.

**Blocked by:** None — can start immediately

**Status:** done

- [x] Update domain models (`Account`, `Category`, `Transaction`) to support credit payment envelopes and debt tracking.
- [x] Implement automated cash transfer from expense category to credit payment envelope on credit card outflow.
- [x] Calculate and flag unfunded credit debt when an envelope does not have enough cash to cover the credit charge.
- [x] Maintain full support for standard checking/cash outflows and inflows.
- [x] Unit test suite verifying double-entry arithmetic, credit reserve funding, and deficit scenarios.
