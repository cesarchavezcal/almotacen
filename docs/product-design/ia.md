# Information Architecture & Navigation Design

## 1. Sitemap & Route Hierarchy (Expo Router)

```text
app/
├── _layout.tsx                 # Root layout with SQLite provider, Theme provider, Safe Area
├── (tabs)/
│   ├── _layout.tsx             # Native bottom tabs with SF Symbols / Material Icons
│   ├── index.tsx               # 1. Cash Flow Dashboard (Reactive - Monarch style)
│   ├── budget.tsx              # 2. Envelopes Budgeting (Proactive - YNAB style)
│   └── accounts.tsx            # 3. Liquid Accounts & Ledger History
├── modal.tsx                   # Quick Point-of-Sale Expense Entry Sheet
└── +not-found.tsx              # 404 handler
```

---

## 2. Core User Journeys

### Journey 1: Morning Check & Daily Burn Rate (Reactive)
1. User opens `almotacen`.
2. Lands on `Dashboard` (`/(tabs)/index`).
3. Sees top KPI: Net Cash Flow this month ($+1,420.00), Burn trajectory (54% of month elapsed, 42% of budget spent).
4. Inspects recent transactions feed with instant category tags.

### Journey 2: Point-of-Sale Capture in 3 Seconds
1. User makes a purchase at grocery store.
2. Taps center Floating Action Button `+` or opens `/modal`.
3. Numeric keypad is focused immediately.
4. User types `42.10`, taps "Groceries", taps "Done".
5. Haptic feedback confirms commit; sheet closes.

### Journey 3: Payday Zero-Based Budget Allocation (Proactive)
1. User receives paycheck ($2,500.00).
2. `Ready to Assign` banner turns green: **+$2,500.00 Ready to Assign**.
3. User navigates to `Budget` tab (`/(tabs)/budget`).
4. Taps "Auto-Assign" or manually taps "Rent", "Groceries", "Emergency Fund".
5. Envelopes fill up until `Ready to Assign` reaches **$0.00** ("All dollars have a job!").
