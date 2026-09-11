# 07 — Month Cycle Paging & Rollover

**What to build:** Monthly cycle navigation and month-end rollover. A paging header (`< September 2026 >`) allows users to page between months, animating the curve to inspect past spending trajectories and final savings rates. At month rollover, unspent envelope balances roll over into the new month's category balance, while any uncovered cash deficits are deducted directly from the new month's `Ready to Assign` pool.

**Blocked by:** 05 — Reactive Cash Flow Trajectory Curve & Income Ceiling

**Status:** ready-for-review

- [x] Implement month paging header with chevron controls and swipe gestures.
- [x] Load historical monthly ledger records and animate curve transitions between months.
- [x] Carry over unspent positive envelope balances to the next month's available amount.
- [x] Deduct uncovered cash deficits from next month's `Ready to Assign` pool at rollover.
- [x] Retain unfunded credit debt as ongoing card balance across month boundaries.

