# Tasks: Design System Modernization

Tracer-bullet implementation breakdown bound to `SCEN-038`..`SCEN-046`.

---

## Task 1: Token Architecture & Shadow Presets [x]
- Create `src/theme/shadows.ts` with `card`, `hero`, and `floating` presets for iOS and Android.
- Export `shadows` from `src/theme/index.ts`.
- Add interactive state alpha tokens to `src/theme/colors.ts`.
- **Spec Scenario**: `SCEN-039`, `SCEN-046`
- **Verification**: Typechecks pass, theme exports include shadows.

---

## Task 2: Card Dark Mode Remediation & Elevation Presets [x]
- Refactor `src/components/Card.tsx` to eliminate all `#FFFFFF` background styles.
- Bind `outline`, `elevated`, and `hero` variants to `colors.surfaceCard` and `shadows.*`.
- Create unit test in `src/components/__tests__/Card.test.tsx`.
- **Spec Scenario**: `SCEN-038`, `SCEN-039`
- **Verification**: `Card.test.tsx` passes cleanly with dark background assertions.

---

## Task 3: Button Accessibility & Loading State [x]
- Refactor `src/components/Button.tsx`:
  - Add `loading` prop and integrate `ActivityIndicator`.
  - Add `accessibilityRole="button"`.
  - Add `accessibilityState={{ disabled: Boolean(disabled || loading), busy: Boolean(loading) }}`.
  - Map font sizes and paddings to `typography` and `spacing` tokens.
- Create unit test in `src/components/__tests__/Button.test.tsx`.
- **Spec Scenario**: `SCEN-040`, `SCEN-041`, `SCEN-042`, `SCEN-046`
- **Verification**: `Button.test.tsx` verifies accessibility states, press behavior, and loading lock.

---

## Task 4: Financial Card & Row Accessibility Summaries [x]
- Refactor `src/components/TransactionRow.tsx` to provide formatted `accessibilityLabel` and tokenized spacing.
- Refactor `src/components/AppleCardFace.tsx` and `src/components/CreditCardFace.tsx` to declare full card summary `accessibilityLabel`.
- Refactor `src/components/EnvelopePassFace.tsx` header to expose accessible status and balances.
- Create unit tests in `src/components/__tests__/TransactionRow.test.tsx` and `src/components/__tests__/CardFaces.test.tsx`.
- **Spec Scenario**: `SCEN-043`, `SCEN-044`, `SCEN-045`
- **Verification**: All component accessibility tests pass.

---

## Task 5: Component Consolidation & Clean Barrel Exports [x]
- Deprecate duplicate tokens in `constants/Colors.ts` by proxying to `@/src/theme`.
- Update any lingering relative imports to use `@/src/theme`.
- Run complete `./init.sh` test suite to verify 0 regressions across all existing domain and storage tests.
- **Spec Scenario**: `SCEN-046`
- **Verification**: Full test suite green via `./init.sh`.
