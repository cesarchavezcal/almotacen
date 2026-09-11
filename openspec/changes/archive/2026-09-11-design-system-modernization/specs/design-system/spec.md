# Capability Specification: Design System Standardization and Accessibility

## Purpose
Establishes the behavioral contracts, visual hierarchy, theme token integration, and accessibility requirements for all reusable interface elements in `almotacen`.

---

## Requirements

### Requirement 1: OLED Dark Surface Compliance
All visual surfaces, containers, and card variants MUST render using dark palette surface tokens, strictly preventing white or light-mode background leakage.

#### Scenario: Card Renders in Dark Mode without Light Leakage (SCEN-038)
- GIVEN a `Card` component rendered with variant `outline` or `elevated`
- WHEN the component mounts in the application
- THEN its background color matches `colors.surfaceCard` or `colors.surface1`
- AND its border color matches `colors.border` or `colors.borderSubtle`
- AND no `#FFFFFF` background style is applied.

---

### Requirement 2: Unified Elevation and Shadow Hierarchy
The system MUST provide standardized elevation tokens for depth levels (card, modal, floating), ensuring identical visual hierarchy across iOS and Android platforms.

#### Scenario: Hero Card Applies Elevated Shadow Token (SCEN-039)
- GIVEN a `Card` component rendered with variant `hero`
- WHEN inspecting its applied styles
- THEN it uses `shadows.hero` containing corresponding iOS shadow properties (`shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`) and Android `elevation`.

---

### Requirement 3: Button Interaction and Accessibility Contracts
The `Button` component MUST expose explicit accessibility traits (`accessibilityRole="button"`), reflect disabled and loading states accurately in `accessibilityState`, and prevent interactions while disabled or loading.

#### Scenario: Button Exposes Accessibility Attributes and Handles Press (SCEN-040)
- GIVEN a standard `Button` with title "Log Outflow"
- WHEN the component mounts
- THEN it has `accessibilityRole="button"` and accessible text "Log Outflow"
- AND pressing the button calls the provided `onPress` callback.

#### Scenario: Disabled Button Blocks Interactions (SCEN-041)
- GIVEN a `Button` with `disabled={true}`
- WHEN the user taps the button
- THEN `onPress` is NOT invoked
- AND `accessibilityState.disabled` is `true`
- AND the button visual opacity reflects the disabled token.

#### Scenario: Loading Button Renders Activity Indicator and Blocks Input (SCEN-042)
- GIVEN a `Button` with `loading={true}`
- WHEN the component renders
- THEN an `ActivityIndicator` is displayed in place of or alongside the text
- AND `accessibilityState.busy` is `true`
- AND user taps do NOT trigger `onPress`.

---

### Requirement 4: Financial Card and Row Accessibility Summaries
Financial display elements (`TransactionRow`, `AppleCardFace`, `CreditCardFace`, `EnvelopePassFace`) MUST provide descriptive `accessibilityLabel` strings summarizing their financial status for assistive technologies.

#### Scenario: Transaction Row Accessibility Announcement (SCEN-043)
- GIVEN a `TransactionRow` for merchant "Supermarket" with amount "$45.00", category "Groceries", and date "Today"
- WHEN an assistive reader focuses the row
- THEN its `accessibilityLabel` reads "Supermarket, Groceries, Today, Outflow $45.00"
- AND if `onPress` is provided, `accessibilityRole` is set to "button".

#### Scenario: Credit Card Face Accessibility Summary (SCEN-044)
- GIVEN a `CreditCardFace` for issuer "Chase Sapphire", last 4 "4521", and balance "$1,120.30"
- WHEN focused by a screen reader
- THEN its `accessibilityLabel` contains "Chase Sapphire ending in 4521, Current Balance $1,120.30".

#### Scenario: Envelope Pass Face Accessibility Tree (SCEN-045)
- GIVEN an `EnvelopePassFace` with category "Groceries", available balance "$350.00", and badge "Positive"
- WHEN focused by a screen reader
- THEN the header pressable announces the envelope name, badge status, and available balance
- AND provides action hints to expand or collapse quick fill options.

---

### Requirement 5: Design Token Purity
All UI components in `src/components/` MUST consume tokens exclusively from `@/src/theme` for spacing, colors, radii, and typography, with zero raw numeric padding/margin values or hardcoded hex strings.

#### Scenario: Component Token Compliance Audit (SCEN-046)
- GIVEN any component in `src/components/`
- WHEN verifying style declarations
- THEN all font sizes correspond to `typography.*` styles
- AND all padding and margin values resolve to `spacing.*` tokens
- AND all border radiuses resolve to `radius.*` tokens.
