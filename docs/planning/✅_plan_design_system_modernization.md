# Implementation Plan: Design System Standardization and Accessibility

## Proposed Changes

Implement the `design-system-modernization` change scoped during the design system audit and specification phases.

### 1. Token Architecture (`src/theme/`)
- Create `src/theme/shadows.ts` with cross-platform elevation and shadow definitions (`card`, `hero`, `floating`).
- Export `shadows` from `src/theme/index.ts`.
- Add interactive state alpha tokens (`pressedOverlay`, `pressedOverlayDark`) to `src/theme/colors.ts`.

### 2. Card Dark Mode Remediation (`src/components/Card.tsx`)
- Eliminate light mode `#FFFFFF` backgrounds on `outline` and `elevated` variants.
- Switch backgrounds to `colors.surfaceCard`.
- Apply `shadows.hero` and `shadows.card` to respective variants.
- Create `src/components/__tests__/Card.test.tsx` verifying dark background and shadow application (`SCEN-038`, `SCEN-039`).

### 3. Button Accessibility & Loading (`src/components/Button.tsx`)
- Add `loading` prop and integrate `ActivityIndicator`.
- Add `accessibilityRole="button"` and `accessibilityState={{ disabled, busy }}`.
- Replace arbitrary font sizes and paddings with `typography` styles and `spacing` tokens.
- Create `src/components/__tests__/Button.test.tsx` verifying press handling, disabled locks, and loading states (`SCEN-040`..`SCEN-042`).

### 4. Financial Card & Row Accessibility (`src/components/`)
- Add formatted `accessibilityLabel` and tokenized spacing to `TransactionRow.tsx`.
- Add screen reader summaries to `AppleCardFace.tsx` and `CreditCardFace.tsx`.
- Add accessible role and status announcements to `EnvelopePassFace.tsx`.
- Create component tests in `src/components/__tests__/TransactionRow.test.tsx` and `src/components/__tests__/CardFaces.test.tsx` (`SCEN-043`..`SCEN-045`).

### 5. Consolidation & Baseline Verification
- Proxy `constants/Colors.ts` to `@/src/theme`.
- Verify zero regressions with full test suite and type checking via `./init.sh`.

---

## Verification Plan

### Automated Tests
- Run `npm test` / `jest` targeting `src/components/__tests__/`:
  - `Card.test.tsx`
  - `Button.test.tsx`
  - `TransactionRow.test.tsx`
  - `CardFaces.test.tsx`
- Run `./init.sh` to execute the complete verification harness (linting, typechecks, domain tests, repository tests).

### Manual Verification
- Inspect component rendering in iOS Simulator or component harness.
