# 04 — Proactive Zero-Based Budgeting & Envelope Allocator

**What to build:** The proactive envelope budgeting tab (`app/(tabs)/budget.tsx`). The screen displays a prominent `Ready to Assign` header banner (green when positive, neutral gray at $0.00, red when overassigned). Users can tap envelope rows to allocate cash using quick-fill pills (+$50, +$100, Fill Remaining) or numeric inputs until all money is assigned. Distinct visual badges differentiate unfunded credit debt (amber) from cash overspending (red).

**Blocked by:** 02 — SQLite Local-First Store & Seed Data

**Status:** ready-for-agent

- [ ] Connect `Ready to Assign` header banner to live unallocated cash balance.
- [ ] Render envelope categories grouped by obligation with progress bars and available balances.
- [ ] Implement 1-tap quick-fill pills (+$50, +$100, Fill Remaining) to assign funds from `Ready to Assign`.
- [ ] Display visual badges for amber credit debt vs red cash overspending.
- [ ] Support negative allocation (moving money back to `Ready to Assign`).
