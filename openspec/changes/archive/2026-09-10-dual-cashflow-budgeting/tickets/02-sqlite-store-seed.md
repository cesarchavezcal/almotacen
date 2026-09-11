# 02 — SQLite Local-First Store & Seed Data

**What to build:** Persistent local storage using SQLite that saves and restores accounts, envelope categories, and transactions with atomic dual-entry guarantees. When the app launches for the first time, default accounts (Checking, Credit Card) and essential category groups (Immediate Obligations, True Expenses, Quality of Life) are automatically seeded so the app is immediately usable.

**Blocked by:** 01 — Core Dual-Ledger with Credit Payment Reserve

**Status:** done

- [x] Define and execute SQLite schema migrations for `accounts`, `categories`, `category_groups`, and `transactions`.
- [x] Implement atomic transactional repository executing double-sided writes with rollback safety.
- [x] Provide reactive state hook (`useLedgerStore`) that emits live state updates to UI components.
- [x] Implement first-launch database seeding with standard budget envelopes and liquid accounts.
- [x] Integration test verifying state persists across database reload.
