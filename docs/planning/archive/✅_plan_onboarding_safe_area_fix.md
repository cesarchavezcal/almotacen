# Implementation Plan: Onboarding Wizard Safe Area Insets (`ALM-014`)

## 1. Goal & Context
The onboarding wizard screen (`/onboarding`) renders with `headerShown: false` in `app/_layout.tsx`. Because `OnboardingWizardView` relies on static padding (`paddingTop: 16pt`), the progress indicator ("STEP 1 OF 4" and progress bar) directly collides with the iOS status bar clock, battery icon, and Dynamic Island/sensor notch.

This plan outlines the surgical fix to wrap the screen in `SafeAreaView` from `react-native-safe-area-context` at the container route boundary, setup proper Jest mocks, and verify live on the booted iOS Simulator.

---

## 2. Proposed Changes

### Component & Screen Changes
#### [`app/onboarding.tsx`](file:///Users/cesaradalbertochavezcalderon/orca/workspaces/almotacen/oystercatcher/app/onboarding.tsx)
- Import `SafeAreaView` from `react-native-safe-area-context`.
- Wrap `<OnboardingWizardView>` inside `<SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>`.
- Apply `backgroundColor: colors.canvas` and `flex: 1` so the dark OLED background seamlessly fills the status bar and bottom indicator areas.

### Testing & Tooling Mocks
#### `__mocks__/react-native-safe-area-context.js`
- Provide standard Jest mock for `react-native-safe-area-context` (mocking `SafeAreaView`, `SafeAreaProvider`, `useSafeAreaInsets`, and `initialWindowMetrics`).

#### [`jest.config.js`](file:///Users/cesaradalbertochavezcalderon/orca/workspaces/almotacen/oystercatcher/jest.config.js)
- Ensure `react-native-safe-area-context` is mapped to the mock file to guarantee zero regressions across the 22 test suites.

---

## 3. Verification Plan
1. **Automated Verification**:
   - Run `./init.sh` (`tsc --noEmit` + `jest`) to verify 0 type errors and 100% test pass rate across all suites.
2. **Visual Verification (iOS Simulator)**:
   - Capture a screenshot via `xcrun simctl io booted screenshot /tmp/onboarding_safe_area_fixed.png`.
   - Inspect visually to verify that "STEP 1 OF 4" and the progress bar are clearly positioned below the Dynamic Island / status bar clock (at ~`y = 75pt`).
