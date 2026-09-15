# Ticket 02: Card Dark Mode Remediation & Elevation Presets

## Scenario Binding
- `SCEN-038`: Card Renders in Dark Mode without Light Leakage
- `SCEN-039`: Hero Card Applies Elevated Shadow Token

## Description
Refactor `src/components/Card.tsx` to eliminate all `#FFFFFF` backgrounds and consume `colors.surfaceCard` and `shadows.*`. Write test suite in `src/components/__tests__/Card.test.tsx`.

## Acceptance Criteria
1. `Card` variants `outline`, `elevated`, `hero` have dark backgrounds matching `colors.surfaceCard`.
2. No `#FFFFFF` background is applied to any variant.
3. `variant="hero"` applies `shadows.hero`.
4. Unit tests in `Card.test.tsx` pass cleanly.
