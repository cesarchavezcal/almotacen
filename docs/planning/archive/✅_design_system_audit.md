# Design System Audit: Oystercatcher / Almotacen

Date: 2026-09-11
Auditor: Senior Architect
Scope: `src/theme/`, `src/components/`, `constants/Colors.ts`, `components/`

---

## 1. Executive Summary

**Components reviewed:** 14 | **Issues found:** 28 | **Score:** 64/100

The application implements a high-fidelity Apple Wallet / HIG dark-mode design system located under `src/theme/` (`colors`, `spacing`, `radius`, `typography`). However, significant architectural drift exists between the legacy Expo boilerplate (`components/`, `constants/Colors.ts`) and the core financial UI (`src/components/`). Furthermore, components frequently bypass existing design tokens with hardcoded hex colors, arbitrary spacing constants, un-tokenized elevation/shadow values, and missing accessibility attributes.

---

## 2. Naming Consistency

| Issue | Components | Recommendation |
|---|---|---|
| **Dual Component Root Directories** | `components/*` (Expo template) vs `src/components/*` (Production UI) | Deprecate or consolidate `components/` into `src/components/`. Remove unused template components (`EditScreenInfo.tsx`). |
| **Dual Color Token Definitions** | `constants/Colors.ts` vs `src/theme/colors.ts` | Eliminate `constants/Colors.ts` and re-export `src/theme/colors.ts` through a unified alias `@/src/theme`. |
| **Card Suffix vs Face Suffix** | `AppleCardFace`, `CreditCardFace`, `EnvelopePassFace` vs generic `Card` | Standardize card face nomenclature. `Card` represents a container surface; pass faces should follow `<Type>PassCard` or maintain `<Type>CardFace` consistently. |
| **Direct Submodule Imports** | `TransactionRow`, `AppleCardFace`, `CreditCardFace` import `../theme/colors` instead of barrel index | Standardize all theme imports to `from '@/src/theme'`. |

---

## 3. Token Coverage

| Category | Defined | Hardcoded Values Found |
|---|---|---|
| **Colors** | 25 tokens in `src/theme/colors.ts` | **34 instances** across components (`#FFFFFF`, `#1A1A1A`, `#4A4A4D`, `#EB001B`, `#F79E1B`, `#FF6000`, `rgba(148, 163, 184, 0.15)`, `#000000`, etc.) |
| **Spacing** | 6 scale steps (`xs: 4`, `sm: 8`, `md: 16`, `lg: 24`, `xl: 32`, `xxl: 48`) | **22 instances** of raw numeric spacing (`14`, `18`, `2`, `4`, `7`, `10`, `12`, `20`, `22`, `26`) |
| **Typography** | 16 named text styles in `src/theme/typography.ts` | **19 instances** of direct `fontSize` definitions (`10`, `11`, `12`, `13`, `16`, `18`, `20`, `22`, `26`) without using typography tokens |
| **Radius** | 9 named sizes in `src/theme/radius.ts` | **11 instances** of manual numeric radiuses (`17`, `14`, `10`, `4`, `3`, `1.5`) |
| **Elevation / Shadows** | **0 tokens defined** | **14 instances** of ad-hoc `shadowOffset`, `shadowOpacity`, and `elevation` parameters |

---

## 4. Component Completeness

| Component | States | Variants | Docs | Accessibility | Score |
|---|---|---|---|---|---|
| [`Button`](file:///Users/cesaradalbertochavezcalderon/orca/workspaces/almotacen/oystercatcher/src/components/Button.tsx) | Default, Pressed, Disabled (Missing Loading) | Primary, Secondary, Ghost (sm, md, lg) | ⚠️ Types only | ❌ Missing `accessibilityRole="button"`, `accessibilityState` | 6/10 |
| [`Card`](file:///Users/cesaradalbertochavezcalderon/orca/workspaces/almotacen/oystercatcher/src/components/Card.tsx) | Static container | Hero, Outline, Elevated (🚨 White bg in dark app) | ⚠️ Types only | ⚠️ Generic View container | 4/10 |
| [`TransactionRow`](file:///Users/cesaradalbertochavezcalderon/orca/workspaces/almotacen/oystercatcher/src/components/TransactionRow.tsx) | Default, Pressed | Inflow / Outflow, Last row divider | ⚠️ Types only | ⚠️ Lacks accessible row label and amount value | 6/10 |
| [`AppleCardFace`](file:///Users/cesaradalbertochavezcalderon/orca/workspaces/almotacen/oystercatcher/src/components/AppleCardFace.tsx) | Balance populated / empty | Titanium gradient | ⚠️ Types only | ❌ Lacks `accessibilityLabel` grouping card data | 6/10 |
| [`CreditCardFace`](file:///Users/cesaradalbertochavezcalderon/orca/workspaces/almotacen/oystercatcher/src/components/CreditCardFace.tsx) | 4 Network badges (Visa, MC, Amex, Discover) | Custom gradients | ⚠️ Types only | ❌ Missing screen reader label for card details | 6/10 |
| [`EnvelopePassFace`](file:///Users/cesaradalbertochavezcalderon/orca/workspaces/almotacen/oystercatcher/src/components/EnvelopePassFace.tsx) | Collapsed, Expanded, Positive, Credit Debt, Overspent, Depleted | Zero-based pass layout + 1-Tap Quick-Fill | ⚠️ Inline JSDoc | ✅ `accessibilityRole="button"`, needs full accessibility tree | 8/10 |
| [`CardStack`](file:///Users/cesaradalbertochavezcalderon/orca/workspaces/almotacen/oystercatcher/src/components/CardStack.tsx) | Rest, Peek, Expanded, Dimmed background | Physics-based spring layout | ⚠️ Types only | ⚠️ Reanimated items need accessible expand state | 7/10 |
| [`MonthPagingHeader`](file:///Users/cesaradalbertochavezcalderon/orca/workspaces/almotacen/oystercatcher/src/components/MonthPagingHeader.tsx) | Current / Past month, Next enabled / disabled | Standard cycle header | ⚠️ Types only | ✅ Accessible buttons and clear labels | 9/10 |
| [`CashflowTrajectoryChart`](file:///Users/cesaradalbertochavezcalderon/orca/workspaces/almotacen/oystercatcher/src/components/CashflowTrajectoryChart.tsx) | Static SVG, Scrubbing HUD active/inactive | Income ceiling, Budget pace, Actual spend | ⚠️ Types only | ❌ Complex SVG path without screen reader accessibility summary | 6/10 |
| [`CashFlowView`](file:///Users/cesaradalbertochavezcalderon/orca/workspaces/almotacen/oystercatcher/src/components/CashFlowView.tsx) | Full composite view | Multiple financial states | ⚠️ Types only | ⚠️ Ad-hoc button instead of standard `Button` | 6/10 |
| [`Themed`](file:///Users/cesaradalbertochavezcalderon/orca/workspaces/almotacen/oystercatcher/components/Themed.tsx) | Light / Dark hook | Text, View wrapper | ⚠️ Basic comment | ⚠️ Legacy Expo scaffold | 5/10 |
| [`StyledText`](file:///Users/cesaradalbertochavezcalderon/orca/workspaces/almotacen/oystercatcher/components/StyledText.tsx) | Static | MonoText | ❌ None | ⚠️ Generic Text | 5/10 |
| [`ExternalLink`](file:///Users/cesaradalbertochavezcalderon/orca/workspaces/almotacen/oystercatcher/components/ExternalLink.tsx) | Link tap | Platform-specific web browser | ⚠️ None | ✅ Standard Link | 7/10 |
| [`EditScreenInfo`](file:///Users/cesaradalbertochavezcalderon/orca/workspaces/almotacen/oystercatcher/components/EditScreenInfo.tsx) | Starter template boilerplate | Demo screen | ❌ None | ⚠️ Obsolete | 2/10 |

---

## 5. Critical Vulnerabilities & Anti-Patterns

1. **Dark Mode Inversion in [`Card.tsx`](file:///Users/cesaradalbertochavezcalderon/orca/workspaces/almotacen/oystercatcher/src/components/Card.tsx#L34)**:
   The `outline` and `elevated` card variants have `backgroundColor: '#FFFFFF'`. In a pure OLED black (`#000000`) HIG application, this renders blinding white rectangles.
2. **Reinventing the Button in [`CashFlowView.tsx`](file:///Users/cesaradalbertochavezcalderon/orca/workspaces/almotacen/oystercatcher/src/components/CashFlowView.tsx#L474-L490)**:
   A custom `actionButton` style with hardcoded white background and black text is implemented instead of consuming `<Button variant="primary" />`.
3. **Missing Shadow / Elevation Tokens**:
   Every card component manually invents iOS `shadowOffset`, `shadowOpacity`, `shadowRadius` and Android `elevation` values, creating inconsistent depth hierarchies across screens.
4. **Missing Unit / Visual Tests for UI Components**:
   Zero component tests exist in `src/components/`. All existing tests target domain ledger calculations and storage.

---

## 6. Priority Actions

1. **Fix [`Card.tsx`](file:///Users/cesaradalbertochavezcalderon/orca/workspaces/almotacen/oystercatcher/src/components/Card.tsx) Dark Mode Inversion & Add Elevation Tokens**: Replace `#FFFFFF` with `colors.surfaceCard` / `colors.surface1` and declare standard elevation tokens in `src/theme/shadows.ts`.
2. **Standardize Components onto `src/theme` Tokens**: Refactor `Button`, `TransactionRow`, and `AppleCardFace` to remove hardcoded font sizes, colors, and margins.
3. **Add Accessibility Primitives**: Ensure every pressable surface has `accessibilityRole="button"`, `accessibilityLabel`, and appropriate accessibility state declarations.
