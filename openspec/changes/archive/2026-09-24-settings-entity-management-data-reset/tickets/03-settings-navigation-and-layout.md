# Ticket 03: Settings Tab Navigation & Presentational Layout

## Status
- **Phase**: Step 7 (Implementation)
- **Scenarios Bound**: `SCEN-001`

---

## Objective
Register the Settings tab in the bottom tab bar and implement the grouped inset layout with design system tokens and reactive data loading.

---

## Detailed Requirements
1. **Tab Registration (`app/(tabs)/_layout.tsx`)**:
   - Add `<Tabs.Screen name="settings" ... />` with `Ionicons` icon (`settings` / `settings-outline`).
2. **Container Screen (`app/(tabs)/settings.tsx`)**:
   - Manages top-level state via `useSettings` hook.
   - Dispatches navigation or actions.
3. **Dedicated Stack Management Sub-Screens**:
   - `app/settings/accounts.tsx`: Dedicated screen listing accounts with "+ Add Account" header, sorting, and balance summaries.
   - `app/settings/groups.tsx`: Dedicated screen listing category groups with "+ Add Group" and rename/delete actions.
   - `app/settings/categories.tsx`: Dedicated screen listing categories by group with "+ Add Category", target details, and inline edits.
4. **Primary Tab Shortcuts**:
   - Expose "+ Add" shortcuts directly on `app/(tabs)/budget.tsx` and `app/(tabs)/accounts.tsx`.
5. **Presentational Components (`src/components/settings/`)**:
   - `SettingsView`: Root layout with scrolling container and padding.
   - `SettingsSection`: Grouped inset card with section title header.
   - `SettingsRow`: Individual list row with leading icon, label, optional badge/value, and chevron indicator.
6. **Hook (`src/hooks/useSettings.ts`)**:
   - Loads diagnostics data and entity counts from repository.
   - Exposes triggers for reset tiers (Factory Reset, Clear Transactions, Load Demo Data).

---

## Verification
- Component test suite in `app/(tabs)/__tests__/settings.test.tsx`.
