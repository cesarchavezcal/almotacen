# 03 — POS Quick Capture Modal & Smart Payee Memory

**What to build:** A sub-3-second point-of-sale expense capture bottom sheet (`/modal.tsx`). When the user taps `+`, a numeric keypad opens immediately with the amount input focused. Typing or selecting a payee automatically pre-selects the category and account from the user's previous transaction with that merchant. Selecting a category previews the real-time balance change (`$45.00 ➔ $30.50`), and tapping "Save" commits the transaction with a haptic tick and dismisses the sheet.

**Blocked by:** 02 — SQLite Local-First Store & Seed Data

**Status:** ready-for-agent

- [ ] Open modal with auto-focused numeric keypad and clean currency formatting.
- [ ] Smart Payee Memory automatically prefills category and account from the last transaction with that payee.
- [ ] Live category card shows remaining balance preview before commit.
- [ ] Debounced save action with light haptic confirmation and instant dismissal.
- [ ] Graceful cancel on backdrop tap or drag-down without writing mutations.
