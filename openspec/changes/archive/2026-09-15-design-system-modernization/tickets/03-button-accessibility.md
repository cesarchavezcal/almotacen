# Ticket 03: Button Accessibility & Loading State

## Scenario Binding
- `SCEN-040`: Button Exposes Accessibility Attributes and Handles Press
- `SCEN-041`: Disabled Button Blocks Interactions
- `SCEN-042`: Loading Button Renders Activity Indicator and Blocks Input
- `SCEN-046`: Component Token Compliance Audit

## Description
Refactor `src/components/Button.tsx` to add `loading` state, set `accessibilityRole="button"`, set `accessibilityState`, and replace arbitrary font sizes/paddings with theme tokens. Create test suite in `src/components/__tests__/Button.test.tsx`.

## Acceptance Criteria
1. `Button` renders with `accessibilityRole="button"`.
2. When `loading={true}`, `ActivityIndicator` displays and press events are blocked.
3. When `disabled={true}`, press events are blocked and `accessibilityState.disabled` is true.
4. Font size uses `typography` styles; padding uses `spacing` tokens.
5. Unit tests in `Button.test.tsx` pass cleanly.
