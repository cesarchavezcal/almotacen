# Verification Checklist: Transactions & Quick Entry

## Checklist

### TC-TX-001: Floating Action Button Opens Keypad Sheet
- **Priority**: P1
- **Setup**: App launched on Dashboard, balance > $0.
- **Steps**:
  1. Tap the persistent `+` action button.
  2. Observe sheet animation and focus.
- **Expected Result**: Bottom sheet slides up smoothly (<300ms) with numeric pad automatically active and focused.
- **Status**: pass

### TC-TX-002: Fast Expense Entry & Envelope Deduction
- **Priority**: P1
- **Setup**: "Groceries" envelope balance = $200.00.
- **Steps**:
  1. Open quick entry sheet.
  2. Enter `45.50`.
  3. Select "Groceries" category.
  4. Tap "Save Transaction".
- **Expected Result**: Sheet dismisses with haptic tick. Groceries envelope balance reflects `$154.50` immediately.
- **Status**: pass

### TC-TX-003: Offline Transaction Persistence
- **Priority**: P1
- **Setup**: Device in Airplane mode / network disabled.
- **Steps**:
  1. Log a $10.00 expense under "Coffee".
  2. Restart the application.
- **Expected Result**: Expense remains visible in local ledger and envelope reflects deduction without network error popups.
- **Status**: pass
