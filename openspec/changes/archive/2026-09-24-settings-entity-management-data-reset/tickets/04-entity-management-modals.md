# Ticket 04: Entity Management Modals & Confirmation Alerts

## Status
- **Phase**: Step 7 (Implementation)
- **Scenarios Bound**: `SCEN-002`, `SCEN-004`, `SCEN-007`, `SCEN-008`, `SCEN-011`, `SCEN-012`

---

## Objective
Implement reusable modal forms and action sheets for creating, updating, and safely deleting Accounts, Category Groups, and Categories, including confirmation alerts.

---

## Detailed Requirements
1. **Account Modal / Sheet**:
   - Fields: Name (text), Account Type (segment/picker: Checking, Savings, Credit), Starting/Adjusted Balance (currency input).
   - Validations: Non-empty name, valid integer cents.
   - Deletion action with error banner if linked transactions exist.
2. **Category Group Modal / Sheet**:
   - Fields: Name (text).
   - Validations: Non-empty name.
   - Deletion action with error banner if child categories exist.
3. **Category Modal / Sheet**:
   - Fields: Name (text), Group (picker), Target Amount (currency input), Target Type (picker), Target Due Day (number 1..31).
   - Validations: Non-empty name, valid group, valid cents.
   - Deletion action with error banner if non-zero available funds or transactions exist.
4. **Destructive Alerts**:
   - Native double-confirmation alert for Factory Reset and entity deletion.

---

## Verification
- Component test suite covering form validation, modal state, and deletion rejection handling.
