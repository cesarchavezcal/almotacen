# Proposal: Design System Standardization and Accessibility Modernization

## Intent
Eliminate visual drift, fix OLED dark-mode inversions (such as blinding white card surfaces in `Card.tsx`), establish standard elevation and shadow tokens, and equip all reusable UI components with accessibility contracts and deterministic state handling.

## Scope

### In Scope
- Define shadow and elevation design tokens in `src/theme/shadows.ts` supporting both iOS and Android.
- Extend `src/theme/colors.ts` with standard alpha overlays for pressed, surface, and outline states.
- Refactor `Card.tsx` to eliminate light-mode background leakage (`#FFFFFF`) and strictly consume dark surface tokens (`colors.surfaceCard`, `colors.surface1`).
- Refactor `Button.tsx` to support loading states, accessibility roles, accessibility states, and replace arbitrary font sizes/spacings with theme tokens.
- Add accessibility labels and roles to `TransactionRow.tsx`, `AppleCardFace.tsx`, `CreditCardFace.tsx`, and `EnvelopePassFace.tsx`.
- Deprecate duplicate tokens in `constants/Colors.ts` and consolidate exports into `@/src/theme`.
- Author component-level unit tests for all updated components under `src/components/__tests__/`.

### Out of Scope
- Authoring light mode color palettes (the application is exclusively designed for OLED dark mode).
- Gesture recalculations in `CardStack.tsx`.

## Capabilities

### New Capabilities
- `design-system`: Complete specification for design tokens (colors, typography, spacing, radius, shadows) and component state/accessibility contracts.

### Modified Capabilities
- None

## Affected Areas
| Area | Impact | Description |
|---|---|---|
| `src/theme/shadows.ts` | New | Shared elevation and shadow presets for iOS and Android |
| `src/theme/colors.ts` | Modified | Surface alpha tokens and unified color hierarchy |
| `src/theme/index.ts` | Modified | Export shadow tokens and convenience presets |
| `src/components/Card.tsx` | Modified | Surface tokens, dark-mode compliance, elevation presets |
| `src/components/Button.tsx` | Modified | Loading state, accessibility contracts, tokenized typography |
| `src/components/TransactionRow.tsx` | Modified | Accessibility labels, tokenized spacing and borders |
| `src/components/AppleCardFace.tsx` | Modified | Screen reader summary, tokenized spacing |
| `src/components/CreditCardFace.tsx` | Modified | Screen reader summary, tokenized typography |
| `src/components/__tests__/` | New | Comprehensive component tests for public interfaces |
| `constants/Colors.ts` | Modified | Alias or proxy to `@/src/theme` |
