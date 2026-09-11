# Spec Tests: Design System Standardization and Accessibility

Defines pure, implementation-free behavioral test contracts for `SCEN-038` through `SCEN-046`.

---

### SCEN-038: Card Renders in Dark Mode without Light Leakage
- **Target**: `Card` component
- **Preconditions**: Mount `Card` with `variant="outline"` and `variant="elevated"`
- **Inputs**: Render component with child text
- **Expected Outcome**:
  - Background color is `colors.surfaceCard` or `colors.surface1`
  - Border color is `colors.border` or `colors.borderSubtle`
  - No background style equals `#FFFFFF`
  - Child content renders within the container.

---

### SCEN-039: Hero Card Applies Elevated Shadow Token
- **Target**: `Card` component
- **Preconditions**: Mount `Card` with `variant="hero"`
- **Inputs**: None
- **Expected Outcome**:
  - Applies `shadows.hero` (or equivalent theme shadow token)
  - iOS shadow properties (`shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`) and Android `elevation` are present and match theme constants.

---

### SCEN-040: Button Exposes Accessibility Attributes and Handles Press
- **Target**: `Button` component
- **Preconditions**: Mount `Button` with `title="Continue"`, `onPress=spyFn`
- **Inputs**: Fire press event
- **Expected Outcome**:
  - `accessibilityRole` equals `"button"`
  - Accessible element displays text "Continue"
  - `spyFn` is called exactly once.

---

### SCEN-041: Disabled Button Blocks Interactions
- **Target**: `Button` component
- **Preconditions**: Mount `Button` with `title="Submit"`, `disabled={true}`, `onPress=spyFn`
- **Inputs**: Fire press event
- **Expected Outcome**:
  - `accessibilityState.disabled` is `true`
  - `spyFn` is not invoked
  - Button visual opacity matches disabled token style.

---

### SCEN-042: Loading Button Renders Activity Indicator and Blocks Input
- **Target**: `Button` component
- **Preconditions**: Mount `Button` with `title="Saving..."`, `loading={true}`, `onPress=spyFn`
- **Inputs**: Fire press event
- **Expected Outcome**:
  - `accessibilityState.busy` is `true`
  - ActivityIndicator is rendered
  - `spyFn` is not invoked.

---

### SCEN-043: Transaction Row Accessibility Announcement
- **Target**: `TransactionRow` component
- **Preconditions**: Mount `TransactionRow` with `merchant="Trader Joe's"`, `amount="$32.50"`, `date="Today"`, `category="Groceries"`, `isOutflow={true}`
- **Inputs**: Inspect rendered node accessibility properties
- **Expected Outcome**:
  - Accessibility label includes merchant, category, date, and amount
  - When `onPress` is supplied, root element has `accessibilityRole="button"`.

---

### SCEN-044: Credit Card Face Accessibility Summary
- **Target**: `CreditCardFace` component
- **Preconditions**: Mount `CreditCardFace` with `issuer="Apple Card"`, `last4="1234"`, `balance="$500.00"`
- **Inputs**: Inspect rendered node
- **Expected Outcome**:
  - Has `accessibilityLabel` containing issuer, last 4 digits, and balance
  - Has `accessible={true}`.

---

### SCEN-045: Envelope Pass Face Accessibility Tree
- **Target**: `EnvelopePassFace` component
- **Preconditions**: Mount `EnvelopePassFace` with `name="Rent"`, `availableCents={120000}`, `assignedCents={120000}`, `activityCents={0}`
- **Inputs**: Inspect header pressable
- **Expected Outcome**:
  - Header has `accessibilityRole="button"`
  - Accessible announcement includes category name and available balance
  - Quick fill buttons have distinct accessibility labels and roles.

---

### SCEN-046: Component Token Compliance Audit
- **Target**: All components under `src/components/`
- **Preconditions**: Static/runtime style sheet inspection
- **Inputs**: Verify style properties
- **Expected Outcome**:
  - Zero hardcoded hex colors outside brand-specific assets
  - Zero raw numeric padding/margin values not matching `spacing.*` tokens
  - Zero raw font size declarations not derived from `typography.*`.
