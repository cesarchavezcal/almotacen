# 03 — POS Quick Capture Modal & Smart Payee Memory

**What to build:** A sub-3-second point-of-sale expense capture bottom sheet (`/modal.tsx`). When the user taps `+`, a numeric keypad opens immediately with the amount input focused. Typing or selecting a payee automatically pre-selects the category and account from the user's previous transaction with that merchant. Selecting a category previews the real-time balance change (`$45.00 ➔ $30.50`), and tapping "Save" commits the transaction with a haptic tick and dismisses the sheet.

**Blocked by:** 02 — SQLite Local-First Store & Seed Data

**Status:** ready-for-agent

**Bound Test Scenarios:** `SCEN-012` (Smart Payee Prefill), `SCEN-013` (Quick Outflow Submission)

### Criteria
- [ ] Connect `app/modal.tsx` to `useLedgerStore` for live accounts and categories.
- [ ] Auto-focused numeric keypad with clean currency decimal formatting (`$0.00`).
- [ ] `useSmartPayeeMemory` hook querying recent transactions to auto-select `categoryId` and `accountId` (`SCEN-012`).
- [ ] Live category impact card previewing balance deduction (`$Current ➔ $Remaining`) and amber warning on deficit.
- [ ] Atomic `postOutflow` commit via `useLedgerStore` with light haptic confirmation and instant sheet dismissal (`SCEN-013`).
- [ ] Unit & hook test suite verifying smart payee prefill and quick transaction mutation.
