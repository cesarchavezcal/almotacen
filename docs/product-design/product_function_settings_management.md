# Product as a Function: Settings, Entity Management & Data Reset

## 1. Function Overview ($y = f(x)$)

$$\text{Structural Autonomy \& State Recovery } (y) = f\left(\text{Configuration Lock-In \& Irreversible Data Accumulation } (x)\right)$$

`almotacen` provides users with full sovereign control over their financial domain model. This feature transforms the friction of immutable initial onboarding choices and corrupted test data into effortless, guarded entity management and atomic data reset operations.

---

## 2. Input Situation Matrix ($x$)

- **Trigger Event**:
  1. The user completes onboarding, but subsequently opens a new bank account, closes a credit card, or needs to adjust category groupings as life circumstances evolve.
  2. The user enters test transactions during exploration and now needs a clean slate or desires to reload standard demo data without deleting the application binary.
- **Status Quo Baseline**:
  - Currently, no Settings interface exists in `almotacen`.
  - Accounts and categories configured during onboarding are locked in SQLite; there is no UI to add, edit, or delete them.
  - Data reset requires developer-level intervention (terminal SQLite commands or reinstalling the app).
- **Failure Condition**:
  - The user abandons the app when their real-world financial structure diverges from their frozen onboarding setup, or when experimental transactions pollute their budget envelope balances permanently.

---

## 3. Output Situation Matrix ($y$)

- **Target Transformed State**:
  1. **Dedicated Settings Screen**: Accessible via a 4th tab (`/(tabs)/settings`), styled with native iOS grouped inset list patterns.
  2. **Entity Management**: Fast, intuitive modals to create, edit, and safely delete Accounts, Category Groups, and Categories with referential integrity safeguards.
  3. **Atomic Data Reset**: One-tap Factory Reset with double-confirmation that wipes all records, resets metadata, and immediately routes the user back to `/onboarding`.
  4. **Demo Data Seeding**: Instant ability to populate the database with realistic demo archetypes for immediate exploration.
  5. **System Diagnostics**: Transparent display of local database version, table row counts, and storage status.
- **Fitness Criteria**:
  - Entity mutations (name change, balance adjustment, category target edit) update active ledger state and reflect across all tabs in $< 16\text{ms}$ (synchronous local SQLite).
  - Deletion of entities with active dependencies (transactions, non-zero balances) is guarded by explicit validation errors, never silent crashes or orphaned records.
  - Factory reset executes in $< 100\text{ms}$ and routes directly to `/onboarding`.

---

## 4. Minimal Function Scope ($f(x) \to y$)

### Core Functional Mechanism
1. **Settings Tab Navigation**:
   - Add `settings.tsx` to `app/(tabs)/` with grouped list sections: `Entities`, `Data Management`, `Diagnostics`.
2. **Entity CRUD Modals / Sheets**:
   - `AccountModal`: Add/Edit account (name, account type, starting/adjusted balance).
   - `CategoryGroupModal`: Add/Rename category groups.
   - `CategoryModal`: Add/Edit category (name, group selector, target amount, target type, target due day).
3. **Guardrails & Referential Integrity**:
   - Block account deletion if transactions exist for that account.
   - Block category group deletion if categories exist within that group.
   - Block category deletion if transactions or positive available funds exist.
   - Block deletion or modification of automated credit card payment categories unless the associated credit account is deleted.
4. **Data Reset Engine**:
   - `factoryReset()`: Truncates transactions, categories, category_groups, accounts; resets `ready_to_assign_cents = 0` and `onboarding_completed = false`.
   - `seedDemoData()`: Invokes `seedDemoData()` to reset state to default starter archetype.

### 10x Scope-Stripping Audit
To maintain lean architectural boundaries and eliminate bloat:
- ❌ **Cloud Backup / Export to Cloud**: Stripped. Local SQLite database only.
- ❌ **Custom Icon / Color Picker**: Stripped. Categories inherit default group icons and system theme tokens.
- ❌ **Drag-and-Drop Reordering**: Stripped. Sort order is managed via sequential index ordering or simple move up/down controls.
- ❌ **Multi-Currency Converter**: Stripped. Base ledger currency remains USD (integer cents).

---

## 5. Pipeline Handoff Contracts

- **Downstream to `/product-description`**:
  - Behavioral state chart of Entity CRUD and Data Reset confirmation workflows, including destructive alert interrupts.
- **Downstream to `/to-spec` & `/spec-to-tests`**:
  - Boundary contracts for entity validation, deletion prevention, and factory reset transaction isolation.
- **Downstream to `/ia` & `/ooux`**:
  - Objects: `AccountSetting`, `CategoryGroupSetting`, `CategorySetting`, `ResetAction`.
  - Routes: `/(tabs)/settings`, `/modal/entity-editor`.
