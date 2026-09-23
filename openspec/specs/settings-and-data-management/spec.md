# Spec: Settings Screen, Entity Management & Data Reset

## 1. Context & Purpose
`almotacen` requires sovereign entity lifecycle management so users can adapt their personal ledger as accounts, category groups, and budget envelopes change over time. This specification defines the behavioral requirements, validation guardrails, and data management mechanisms for managing domain entities and resetting database state.

---

## 2. Requirements & Acceptance Criteria

### Requirement 1: Settings Navigation Tab
The main application tab bar MUST include a fourth persistent navigation tab named "Settings" with a standard gear icon.

- **Scenario 1.1 (Settings Tab Navigation)**:
  - **Given** the user is on any main tab (`Cash Flow`, `Budget`, `Accounts`).
  - **When** the user taps the "Settings" tab.
  - **Then** the Settings screen is displayed.
  - **And** the active tab icon highlights with the primary tint color.

- **Scenario 1.2 (Settings Information Layout)**:
  - **Given** the user is viewing the Settings screen.
  - **When** the screen renders.
  - **Then** it presents three distinct grouped sections:
    1. `Entities` containing rows for "Accounts", "Category Groups", and "Categories".
    2. `Data Management` containing actions for "Reset All Data (Factory Reset)" and "Load Demo Data".
    3. `Diagnostics` displaying schema version and entity record counts.

---

### Requirement 2: Account Management CRUD & Integrity
The system MUST permit creating, editing, and deleting financial accounts while enforcing referential integrity.

- **Scenario 2.1 (Create Depository Account)**:
  - **Given** the user opens the Account creation form.
  - **When** the user enters name "High Yield Savings", selects type "savings", and starting balance $1,500.00.
  - **Then** a new account is persisted in `accounts`.
  - **And** `readyToAssignCents` is credited by $1,500.00 (inflow allocation pool).
  - **And** the account appears in the accounts list and `Accounts` tab.

- **Scenario 2.2 (Create Credit Card Account with Linked Payment Category)**:
  - **Given** the user opens the Account creation form.
  - **When** the user enters name "Chase Sapphire", selects type "credit", and starting balance -$450.00.
  - **Then** a new account is persisted with `balance_cents = -45000`.
  - **And** an automatic category "Chase Sapphire Payment" is created in category group "Credit Card Payments".
  - **And** the account `credit_payment_category_id` references this newly created payment category.

- **Scenario 2.3 (Update Account Name & Balance)**:
  - **Given** an existing account "Checking" with balance $500.00.
  - **When** the user edits the account name to "Primary Checking" and balance to $600.00.
  - **Then** the account name updates in `accounts`.
  - **And** the ledger reflects the balance adjustment.

- **Scenario 2.4 (Prevent Deletion of Account with Linked Transactions)**:
  - **Given** an account with at least one transaction in `transactions`.
  - **When** the user attempts to delete the account.
  - **Then** the deletion is rejected with an integrity error: `"Cannot delete account with existing transactions"`.
  - **And** zero rows are deleted from `accounts`.

- **Scenario 2.5 (Successful Deletion of Inactive Account)**:
  - **Given** an account with zero transactions and zero balance.
  - **When** the user confirms deletion.
  - **Then** the account record is removed from `accounts`.
  - **And** if it was a credit card account, its linked payment category is cleaned up if empty.

---

### Requirement 3: Category Group Management CRUD & Integrity
The system MUST permit creating, renaming, and deleting category groups.

- **Scenario 3.1 (Create Category Group)**:
  - **Given** the user submits a new category group name "Subscriptions".
  - **When** the creation executes.
  - **Then** a new record is added to `category_groups` with `sort_order = max(sort_order) + 1`.

- **Scenario 3.2 (Rename Category Group)**:
  - **Given** category group "Subscriptions".
  - **When** the user updates the name to "Monthly Subscriptions".
  - **Then** the group name is updated in `category_groups` and immediately reflects on the `Budget` tab.

- **Scenario 3.3 (Prevent Deletion of Non-Empty Category Group)**:
  - **Given** a category group containing one or more categories in `categories`.
  - **When** the user attempts to delete the category group.
  - **Then** the deletion is rejected with an integrity error: `"Cannot delete category group containing categories"`.
  - **And** zero rows are deleted from `category_groups`.

- **Scenario 3.4 (Delete Empty Category Group)**:
  - **Given** a category group with zero child categories.
  - **When** the user confirms deletion.
  - **Then** the category group is removed from `category_groups`.

---

### Requirement 4: Category Management CRUD & Integrity
The system MUST permit creating, editing, and deleting budget category envelopes.

- **Scenario 4.1 (Create Budget Category)**:
  - **Given** category group "Monthly Subscriptions".
  - **When** the user creates category "Streaming Services" with target $35.00, type "MONTHLY_SET_ASIDE", due day 15.
  - **Then** the category is persisted in `categories` with `group_id` referencing "Monthly Subscriptions".
  - **And** `assigned_cents = 0` and `available_cents = 0`.

- **Scenario 4.2 (Update Category Attributes)**:
  - **Given** category "Streaming Services".
  - **When** the user edits target amount to $45.00 and moves it to group "Entertainment".
  - **Then** `target_cents` updates to 4500 and `group_id` updates to the new group.

- **Scenario 4.3 (Prevent Deletion of Protected Credit Payment Category)**:
  - **Given** a category with `is_credit_payment = 1`.
  - **When** the user attempts to delete the category.
  - **Then** deletion is blocked: `"Credit payment categories cannot be deleted directly"`.

- **Scenario 4.4 (Prevent Deletion of Category with Positive Funds or Transactions)**:
  - **Given** a category with `available_cents > 0` or assigned transactions.
  - **When** the user attempts to delete the category.
  - **Then** deletion is rejected: `"Cannot delete category with available funds or active transactions"`.

- **Scenario 4.5 (Delete Zero-Balance Inactive Category)**:
  - **Given** an unlinked category with `available_cents = 0` and zero transactions.
  - **When** the user confirms deletion.
  - **Then** the record is deleted from `categories`.

---

### Requirement 5: Data Reset Engine
The system MUST provide atomic database reset operations with destructive confirmation alerts.

- **Scenario 5.1 (Factory Reset - Erase All Data)**:
  - **Given** a database populated with accounts, categories, and transactions.
  - **When** the user confirms "Reset All Data (Factory Reset)".
  - **Then** all records are deleted from `transactions`, `categories`, `category_groups`, and `accounts`.
  - **And** metadata `ready_to_assign_cents` is set to `0`.
  - **And** metadata `onboarding_completed` is set to `false`.
  - **And** the application navigates immediately to `/onboarding`.

- **Scenario 5.2 (Load Demo Data)**:
  - **Given** any existing database state.
  - **When** the user confirms "Load Demo Data".
  - **Then** the database is repopulated with canonical archetype accounts and categories.
  - **And** metadata `onboarding_completed` is set to `true`.
  - **And** the active view reloads with the seeded demo state.

- **Scenario 5.3 (Clear Transactions Only - Zero-Base Re-Anchor)**:
  - **Given** an existing ledger with accounts, categories, and transactions.
  - **When** the user confirms "Clear Transactions Only".
  - **Then** all rows from `transactions` are deleted.
  - **And** current account balances are preserved as the new baseline.
  - **And** all category `assigned_cents` and `available_cents` are reset to `0`.
  - **And** `ready_to_assign_cents` is set to the sum of positive depository account balances.
  - **And** `onboarding_completed` remains `true`.

---

### Requirement 6: System Diagnostics Display
The Settings screen MUST display live database diagnostics.

- **Scenario 6.1 (Diagnostics Accuracy)**:
  - **Given** an active SQLite database.
  - **When** viewing the diagnostics section.
  - **Then** the UI displays:
    - Current schema version (e.g. `v2`).
    - Total accounts count.
    - Total categories count.
    - Total transactions count.
