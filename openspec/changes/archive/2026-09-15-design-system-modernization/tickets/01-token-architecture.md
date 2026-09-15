# Ticket 01: Token Architecture & Shadow Presets

## Scenario Binding
- `SCEN-039`: Hero Card Applies Elevated Shadow Token
- `SCEN-046`: Component Token Compliance Audit

## Description
Create `src/theme/shadows.ts` exposing elevation and iOS shadow presets (`card`, `hero`, `floating`). Export from `src/theme/index.ts` and add missing interactive overlay alpha tokens in `src/theme/colors.ts`.

## Acceptance Criteria
1. `src/theme/shadows.ts` defines typed `shadows` dictionary with `card`, `hero`, `floating`.
2. `src/theme/index.ts` exports `shadows`.
3. `src/theme/colors.ts` includes `pressedOverlay` and `pressedOverlayDark`.
4. `tsc --noEmit` compiles cleanly.
