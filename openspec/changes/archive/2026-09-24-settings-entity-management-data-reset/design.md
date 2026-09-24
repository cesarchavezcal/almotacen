# Technical Architecture & Design: Settings, Entity Management & Data Reset

## 1. Architectural Strategy

The implementation strictly follows the repository's Clean / Hexagonal Architecture standards and Container-Presentational separation:
1. **Domain Layer (`src/domain/settings/` & `src/domain/ledger/`)**:
   - Pure validation logic and integrity checks (e.g. checking whether an account, group, or category can be safely deleted).
   - Factory reset and demo seed orchestration invariants.
2. **Storage / Adapter Layer (`src/storage/ledgerRepository.ts` & `src/storage/schema.ts`)**:
   - Concrete SQLite transactional implementations for CRUD operations:
     - `createAccount`, `updateAccount`, `deleteAccount`
     - `createCategoryGroup`, `updateCategoryGroup`, `deleteCategoryGroup`
     - `createCategory`, `updateCategory`, `deleteCategory`
     - `factoryReset`, `seedDemoData`, `getDiagnostics`
3. **Application & Hook Layer (`src/hooks/useSettings.ts`)**:
   - Custom hook managing diagnostics loading, entity summaries, and invoking reset / seed actions with optimistic or reactive state updates.
4. **Presentational UI Layer (`src/components/settings/` & `app/(tabs)/settings.tsx`)**:
   - `app/(tabs)/settings.tsx`: Container screen handling navigation and alerts.
   - `SettingsGroupedView.tsx`: Presentational component rendering native grouped cards with iOS/Android design tokens from `src/theme`.
   - `EntityManagementModals.tsx`: Form modals for adding and editing accounts, category groups, and categories.

---

## 2. Interface Contracts

### 2.1 Repository Extensions (`src/storage/types.ts`)

```typescript
export interface DiagnosticsData {
  schemaVersion: number;
  accountCount: number;
  categoryCount: number;
  categoryGroupCount: number;
  transactionCount: number;
}

export interface CreateAccountInput {
  name: string;
  accountType: 'checking' | 'savings' | 'credit' | 'investment';
  balanceCents: number;
}

export interface UpdateAccountInput {
  id: string;
  name: string;
  balanceCents: number;
}

export interface CreateCategoryGroupInput {
  name: string;
}

export interface UpdateCategoryGroupInput {
  id: string;
  name: string;
}

export interface CreateCategoryInput {
  groupId: string;
  name: string;
  targetCents?: number;
  targetType?: 'NEEDED_FOR_SPENDING' | 'MONTHLY_SET_ASIDE' | 'DEBT_PAYMENT';
  targetDueDay?: number;
}

export interface UpdateCategoryInput {
  id: string;
  groupId?: string;
  name?: string;
  targetCents?: number;
  targetType?: 'NEEDED_FOR_SPENDING' | 'MONTHLY_SET_ASIDE' | 'DEBT_PAYMENT';
  targetDueDay?: number;
}

export interface LedgerRepository {
  // Existing methods...
  createAccount(input: CreateAccountInput): Account;
  updateAccount(input: UpdateAccountInput): Account;
  deleteAccount(id: string): void;
  createCategoryGroup(input: CreateCategoryGroupInput): CategoryGroup;
  updateCategoryGroup(input: UpdateCategoryGroupInput): CategoryGroup;
  deleteCategoryGroup(id: string): void;
  createCategory(input: CreateCategoryInput): Category;
  updateCategory(input: UpdateCategoryInput): Category;
  deleteCategory(id: string): void;
  factoryReset(): void;
  seedDemoData(): void;
  getDiagnostics(): DiagnosticsData;
}
```

---

## 3. Referential Integrity Rules

1. **Account Deletion**:
   ```sql
   SELECT COUNT(*) as count FROM transactions WHERE account_id = ?
   ```
   If `count > 0`, throw `DomainValidationError('Cannot delete account with existing transactions.')`.
   If the account is a credit card, also remove the linked `credit_payment_category_id` if that category has 0 transactions and 0 balance.

2. **Category Group Deletion**:
   ```sql
   SELECT COUNT(*) as count FROM categories WHERE group_id = ?
   ```
   If `count > 0`, throw `DomainValidationError('Cannot delete category group containing categories.')`.

3. **Category Deletion**:
   If `category.isCreditPayment == true`, throw `DomainValidationError('Credit payment categories cannot be deleted directly.')`.
   ```sql
   SELECT COUNT(*) as count FROM transactions WHERE category_id = ?
   ```
   If `count > 0` or `availableCents > 0`, throw `DomainValidationError('Cannot delete category with available funds or active transactions.')`.

4. **Factory Reset**:
   Must execute in a single SQLite synchronous transaction:
   ```sql
   DELETE FROM transactions;
   DELETE FROM categories;
   DELETE FROM category_groups;
   DELETE FROM accounts;
   DELETE FROM metadata;
   INSERT INTO metadata (key, value) VALUES ('schema_version', '2');
   INSERT INTO metadata (key, value) VALUES ('ready_to_assign_cents', '0');
   INSERT INTO metadata (key, value) VALUES ('onboarding_completed', 'false');
   ```

---

## 4. UI Architecture & Container-Presentational Separation

```text
app/(tabs)/settings.tsx (Route / Container)
  │
  ├──> useSettings(db) (Hook: loads diagnostics, triggers reset/seed, state sync)
  │
  └──> SettingsView (Presentational UI)
         ├──> SettingsSection ("Entities")
         │      ├──> SettingsRow ("Accounts", count, onPress)
         │      ├──> SettingsRow ("Category Groups", count, onPress)
         │      └──> SettingsRow ("Categories", count, onPress)
         │
         ├──> SettingsSection ("Data Management")
         │      ├──> SettingsRow ("Load Demo Data", onPress)
         │      └──> SettingsRow ("Reset All Data (Factory Reset)", destructive, onPress)
         │
         └──> SettingsSection ("System Diagnostics")
                ├──> SettingsRow ("Schema Version", "v2")
                ├──> SettingsRow ("Total Transactions", count)
                └──> SettingsRow ("Storage Engine", "SQLite (local)")
```
