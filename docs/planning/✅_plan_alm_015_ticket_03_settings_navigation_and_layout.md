# Implementation Plan: Ticket 03 — Settings Tab Navigation & Presentational Layout

## Goal Description
Implement the Settings tab, its grouped inset presentational layout components, the `useSettings` controller hook, dedicated stack management sub-screens (`accounts`, `groups`, `categories`), and primary tab "+ Add" shortcuts, verified by automated component tests for `SCEN-001`.

---

## User Review Required
> [!IMPORTANT]
> - **Navigation Topology**:
>   - Add persistent `settings` tab to bottom navigation in `app/(tabs)/_layout.tsx` (`Ionicons` `settings`/`settings-outline`).
>   - Register nested stack route `app/settings/_layout.tsx` and sub-screens (`accounts.tsx`, `groups.tsx`, `categories.tsx`) in `app/_layout.tsx`.
>   - Factory Reset confirms via alert and redirects immediately to `/onboarding`.
> - **Shortcuts**:
>   - `app/(tabs)/budget.tsx` exposes "+ Add" navigating to `/settings/categories` / `/settings/groups`.
>   - `app/(tabs)/accounts.tsx` exposes "+ Add Account" navigating to `/settings/accounts`.
> - **Component Architecture (Container / Presentational)**:
>   - `src/components/settings/SettingsView.tsx`: Pure presentational root container rendering 3 grouped sections.
>   - `src/components/settings/SettingsSection.tsx`: Reusable iOS grouped inset card with section title.
>   - `src/components/settings/SettingsRow.tsx`: Row item with icon, label, optional count badge, and chevron indicator.
>   - `src/hooks/useSettings.ts`: Business controller managing diagnostics data, navigation, and reset confirmation dialogs.

---

## Proposed Changes

### 1. Presentational Components (`src/components/settings/`)

#### `src/components/settings/SettingsRow.tsx`
- Inset row with leading icon (or icon badge), title, subtitle/value, trailing chevron indicator or action button.
- Support destructive styling for factory reset row (`colors.error`).
- Border hairline divider between adjacent rows.

#### `src/components/settings/SettingsSection.tsx`
- Grouped inset container (`colors.surface1`, `radius.card`, hairline border).
- Uppercase section header label (`typography.sectionHdr`) and optional footnote text.

#### `src/components/settings/SettingsView.tsx`
- Root scroll view with 16pt horizontal inset padding.
- Section 1 — **ENTITIES**:
  - Accounts (displays count, navigates to `/settings/accounts`)
  - Category Groups (displays count, navigates to `/settings/groups`)
  - Categories (displays count, navigates to `/settings/categories`)
- Section 2 — **DATA MANAGEMENT**:
  - Clear Transactions Only (Re-Anchor) -> triggers confirmation alert
  - Load Demo Starter Data -> triggers confirmation alert
  - Reset All Data (Factory Reset) -> triggers destructive confirmation alert
- Section 3 — **DIAGNOSTICS & SYSTEM**:
  - Schema Version (`v2`)
  - Total Transactions (`diagnostics.transactionCount`)
  - Total Accounts (`diagnostics.accountCount`)
  - Total Categories (`diagnostics.categoryCount`)
  - Database Driver (`SQLite (local)`)

#### `src/components/settings/index.ts`
- Export `SettingsView`, `SettingsSection`, `SettingsRow`.

---

### 2. Controller Hook (`src/hooks/useSettings.ts`)
- Consumes `useLedgerStore()` to retrieve `diagnostics` via `getDiagnostics()`, `state`, and `groups`.
- Exposes:
  - `diagnostics: DiagnosticsData`
  - `handleFactoryReset: () => void` (presents native `Alert` before invoking `factoryReset()` and `router.replace('/onboarding')`)
  - `handleClearTransactions: () => void` (presents native `Alert` before invoking `clearTransactionsOnly()`)
  - `handleSeedDemoData: () => void` (presents native `Alert` before invoking `seedDemoData()`)
  - `navigateToAccounts: () => void` (`router.push('/settings/accounts')`)
  - `navigateToGroups: () => void` (`router.push('/settings/groups')`)
  - `navigateToCategories: () => void` (`router.push('/settings/categories')`)

---

### 3. Screen Registration & Routing

#### `app/(tabs)/_layout.tsx`
- Add `Tabs.Screen` for `settings`:
  ```tsx
  <Tabs.Screen
    name="settings"
    options={{
      title: 'Settings',
      tabBarIcon: ({ color, focused }) => (
        <Ionicons
          name={focused ? 'settings' : 'settings-outline'}
          size={24}
          color={color}
        />
      ),
    }}
  />
  ```

#### `app/(tabs)/settings.tsx`
- Container component wiring `useSettings()` to `<SettingsView />`.

#### `app/settings/_layout.tsx` & Sub-Screens
- Create `app/settings/_layout.tsx` as a Stack navigator with dark theme colors.
- `app/settings/accounts.tsx`: Dedicated screen listing accounts with "+ Add Account" header, balance summary, and account items.
- `app/settings/groups.tsx`: Dedicated screen listing category groups with "+ Add Group" button.
- `app/settings/categories.tsx`: Dedicated screen listing categories by group with "+ Add Category" button.
- Register `settings` stack in root `app/_layout.tsx`.

---

### 4. Tab Shortcuts

#### `app/(tabs)/budget.tsx`
- Add quick shortcut button/header icon to navigate to `/settings/categories` or `/settings/groups` for rapid budget setup.

#### `app/(tabs)/accounts.tsx`
- Add "+ Add Account" button in net worth header or navigation action navigating to `/settings/accounts`.

---

### 5. Automated Behavioral Component Tests

#### `app/(tabs)/__tests__/settings.test.tsx`
- Test suite verifying `SCEN-001`:
  - Renders Settings title and all 3 sections ("ENTITIES", "DATA MANAGEMENT", "DIAGNOSTICS & SYSTEM").
  - Displays accurate counts for Accounts, Category Groups, Categories.
  - Displays diagnostics values (schema version, transaction count, etc.).
  - Navigates to `/settings/accounts`, `/settings/groups`, `/settings/categories` when rows are tapped.
  - Triggers alerts for Clear Transactions, Demo Data, and Factory Reset.

---

## Verification Plan

### Automated Tests
1. **Settings Component Test**: `npx jest app/(tabs)/__tests__/settings.test.tsx`.
2. **Full Harness Verification**: Run `./init.sh` (0 typecheck errors, 100% test pass rate across all suites).

### Manual / Integration Verification
- Verify that tapping Settings in bottom tabs opens the grouped inset screen.
- Verify that tapping Accounts, Category Groups, or Categories pushes the corresponding stack sub-screen.
- Verify that triggering Factory Reset prompts for confirmation and transitions to `/onboarding`.
