# Technical Design: Dual Cash Flow & Zero-Based Budgeting

## 1. Architectural Principles
1. **Integer Arithmetic (Cents)**: All currency calculations use integer cents (`bigint` or `number` representing cents) to eliminate floating point rounding errors (`$14.50` = `1450`).
2. **Double-Sided Atomic Ledgers**: An outflow transaction updates account balance and category balance in a single database transaction.
3. **Local-First & Reactive**: All state changes execute against local SQLite via `expo-sqlite` immediately, returning optimistic results to UI hooks while enqueuing Supabase sync operations.

---

## 2. Component & Directory Layout

```text
src/
├── domain/
│   ├── ledger/
│   │   ├── types.ts            # Account, Category, Transaction, Budget types
│   │   ├── ledgerEngine.ts     # Pure arithmetic functions for dual balancing
│   │   └── ledgerEngine.test.ts # Anti-tautological unit test suite (SCEN-001..006)
│   └── errors.ts               # Domain-specific typed errors
├── storage/
│   ├── database.ts             # SQLite initialization & schema migration
│   └── ledgerRepository.ts     # CRUD & transactional atomic batch operations
├── hooks/
│   ├── useCashflow.ts          # Reactive metrics (Inflows, Outflows, Burn trajectory)
│   ├── useBudget.ts            # Envelope allocations & Ready to Assign pool
│   └── useTransactions.ts      # Transaction feed & quick logging mutation
└── components/
    ├── QuickEntryModal.tsx     # Native bottom sheet with @expo/ui numeric keypad
    ├── CategoryRow.tsx         # Swipeable envelope allocation card
    └── CashFlowBar.tsx         # Monthly burn indicator
```
