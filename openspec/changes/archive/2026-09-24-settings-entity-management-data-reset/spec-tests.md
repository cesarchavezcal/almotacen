# Behavioral Test Contract: Settings, Entity Management & Data Reset

## Seam Definition
- **Target Seam**: `LedgerRepository` / Domain Service Layer & Settings View Component
- **Language/Runner**: Jest / ts-jest / `@testing-library/react-native`

---

## Scenario Matrix

| Scenario ID | Story Ref | Type | Given / When | Expected Observable Outcome (Then) |
|---|---|---|---|---|
| `SCEN-001` | Req 1.1, 1.2 | Navigation & UI | Viewing main app tabs / User taps "Settings" tab | Renders Settings screen with 3 grouped sections: Entities, Data Management, Diagnostics |
| `SCEN-002` | Req 2.1 | Happy Path | User creates Depository Account (Checking/Savings) | Account inserted in `accounts`; `readyToAssignCents` credited by starting balance |
| `SCEN-003` | Req 2.2 | Happy Path | User creates Credit Card Account with starting debt | Credit account inserted in `accounts`; linked payment category auto-provisioned in `cat-cc-payment` |
| `SCEN-004` | Req 2.3 | Happy Path | User updates account name and balance | Account name and balance updated in `accounts` |
| `SCEN-005` | Req 2.4 | Boundary / Guard | User attempts to delete account with existing transactions | Throws/returns validation error: `"Cannot delete account with existing transactions"`; account retained |
| `SCEN-006` | Req 2.5 | Happy Path | User deletes empty account with zero transactions | Account record deleted from `accounts` |
| `SCEN-007` | Req 3.1 | Happy Path | User creates new category group | Record inserted into `category_groups` with incremented `sort_order` |
| `SCEN-008` | Req 3.2 | Happy Path | User renames category group | `name` updated in `category_groups` |
| `SCEN-009` | Req 3.3 | Boundary / Guard | User attempts to delete category group containing categories | Throws/returns validation error: `"Cannot delete category group containing categories"`; group retained |
| `SCEN-010` | Req 3.4 | Happy Path | User deletes empty category group | Record removed from `category_groups` |
| `SCEN-011` | Req 4.1 | Happy Path | User creates new category under existing group | Record inserted into `categories` with specified target type, cents, due day; zero assigned/available |
| `SCEN-012` | Req 4.2 | Happy Path | User updates category name, target, and group | Category record updated in `categories` |
| `SCEN-013` | Req 4.3 | Boundary / Guard | User attempts to delete credit payment category (`is_credit_payment = 1`) | Throws/returns error: `"Credit payment categories cannot be deleted directly"` |
| `SCEN-014` | Req 4.4 | Boundary / Guard | User attempts to delete category with `available_cents > 0` or transactions | Throws/returns error: `"Cannot delete category with available funds or active transactions"` |
| `SCEN-015` | Req 4.5 | Happy Path | User deletes inactive, zero-balance category | Record deleted from `categories` |
| `SCEN-016` | Req 5.1 | Destructive / State | User triggers "Reset All Data (Factory Reset)" | All rows removed from `transactions`, `categories`, `category_groups`, `accounts`; `ready_to_assign_cents = 0`; `onboarding_completed = false` |
| `SCEN-017` | Req 5.2 | Destructive / State | User triggers "Load Demo Data" | Database re-seeded with default archetype seed data; `onboarding_completed = true` |
| `SCEN-018` | Req 6.1 | Read / Diagnostics | Querying diagnostics counts | Returns accurate schema version and record counts for accounts, categories, and transactions |
| `SCEN-019` | Req 5.3 | Destructive / State | User triggers "Clear Transactions Only" | `transactions` table cleared; account balances preserved; envelope balances zeroed; `ready_to_assign_cents = sum(positive accounts)` |

---

## Red-Ready Test Stubs

```typescript
import { createTestDatabase } from '../../src/storage/testDatabase';
import { SQLiteLedgerRepository } from '../../src/storage/ledgerRepository';
import { DatabaseAdapter } from '../../src/storage/types';
import { isOnboardingCompleted } from '../../src/storage/schema';

describe('Settings & Entity Management Contract (Spec Contract)', () => {
  let db: DatabaseAdapter;
  let repo: SQLiteLedgerRepository;

  beforeEach(() => {
    db = createTestDatabase();
    repo = new SQLiteLedgerRepository(db);
  });

  afterEach(() => {
    db.closeSync?.();
  });

  describe('Account Management', () => {
    it('SCEN-002: creates depository account and credits readyToAssign', () => {
      const account = repo.createAccount({
        name: 'High Yield Savings',
        accountType: 'savings',
        balanceCents: 150000,
      });

      expect(account.id).toBeDefined();
      expect(account.name).toBe('High Yield Savings');
      expect(account.balanceCents).toBe(150000);

      const state = repo.getBudgetState();
      expect(state.accounts[account.id]).toBeDefined();
      expect(state.readyToAssignCents).toBe(150000);
    });

    it('SCEN-003: creates credit card account with auto-provisioned payment category', () => {
      const account = repo.createAccount({
        name: 'Chase Sapphire',
        accountType: 'credit',
        balanceCents: -45000,
      });

      expect(account.accountType).toBe('credit');
      expect(account.creditPaymentCategoryId).toBeDefined();

      const state = repo.getBudgetState();
      const paymentCategory = state.categories[account.creditPaymentCategoryId!];
      expect(paymentCategory).toBeDefined();
      expect(paymentCategory.isCreditPayment).toBe(true);
    });

    it('SCEN-004: updates account name and balance', () => {
      const account = repo.createAccount({
        name: 'Old Name',
        accountType: 'checking',
        balanceCents: 50000,
      });

      repo.updateAccount({
        id: account.id,
        name: 'New Name',
        balanceCents: 75000,
      });

      const updated = repo.getBudgetState().accounts[account.id];
      expect(updated.name).toBe('New Name');
      expect(updated.balanceCents).toBe(75000);
    });

    it('SCEN-005: prevents deletion of account with existing transactions', () => {
      const account = repo.createAccount({
        name: 'Checking',
        accountType: 'checking',
        balanceCents: 10000,
      });
      const group = repo.createCategoryGroup({ name: 'Expenses' });
      const cat = repo.createCategory({
        groupId: group.id,
        name: 'Supplies',
        targetCents: 0,
      });

      repo.postOutflow({
        id: 'tx-1',
        accountId: account.id,
        categoryId: cat.id,
        amountCents: 2000,
        payee: 'Office Depot',
      });

      expect(() => {
        repo.deleteAccount(account.id);
      }).toThrow(/transactions/i);
    });

    it('SCEN-006: deletes empty account with zero transactions', () => {
      const account = repo.createAccount({
        name: 'Temporary',
        accountType: 'checking',
        balanceCents: 0,
      });

      repo.deleteAccount(account.id);
      expect(repo.getBudgetState().accounts[account.id]).toBeUndefined();
    });
  });

  describe('Category Group Management', () => {
    it('SCEN-007: creates category group with auto-incremented sort order', () => {
      const group1 = repo.createCategoryGroup({ name: 'Group 1' });
      const group2 = repo.createCategoryGroup({ name: 'Group 2' });

      expect(group2.sortOrder).toBeGreaterThan(group1.sortOrder);
    });

    it('SCEN-008: renames category group', () => {
      const group = repo.createCategoryGroup({ name: 'Subscriptions' });
      repo.updateCategoryGroup({ id: group.id, name: 'Monthly Subscriptions' });

      const groups = repo.getCategoryGroups();
      const updated = groups.find((g) => g.id === group.id);
      expect(updated?.name).toBe('Monthly Subscriptions');
    });

    it('SCEN-009: prevents deletion of category group containing categories', () => {
      const group = repo.createCategoryGroup({ name: 'Obligations' });
      repo.createCategory({
        groupId: group.id,
        name: 'Rent',
        targetCents: 100000,
      });

      expect(() => {
        repo.deleteCategoryGroup(group.id);
      }).toThrow(/categories/i);
    });

    it('SCEN-010: deletes empty category group', () => {
      const group = repo.createCategoryGroup({ name: 'Empty Group' });
      repo.deleteCategoryGroup(group.id);

      const groups = repo.getCategoryGroups();
      expect(groups.find((g) => g.id === group.id)).toBeUndefined();
    });
  });

  describe('Category Management', () => {
    it('SCEN-011: creates category with target configuration', () => {
      const group = repo.createCategoryGroup({ name: 'Fixed' });
      const cat = repo.createCategory({
        groupId: group.id,
        name: 'Internet',
        targetCents: 7500,
        targetType: 'MONTHLY_SET_ASIDE',
        targetDueDay: 20,
      });

      expect(cat.id).toBeDefined();
      expect(cat.targetCents).toBe(7500);
      expect(cat.targetType).toBe('MONTHLY_SET_ASIDE');
      expect(cat.targetDueDay).toBe(20);
      expect(cat.assignedCents).toBe(0);
      expect(cat.availableCents).toBe(0);
    });

    it('SCEN-012: updates category attributes and moves to new group', () => {
      const g1 = repo.createCategoryGroup({ name: 'G1' });
      const g2 = repo.createCategoryGroup({ name: 'G2' });
      const cat = repo.createCategory({ groupId: g1.id, name: 'Phone', targetCents: 5000 });

      repo.updateCategory({
        id: cat.id,
        groupId: g2.id,
        name: 'Cell Phone',
        targetCents: 6000,
        targetType: 'NEEDED_FOR_SPENDING',
        targetDueDay: 10,
      });

      const updated = repo.getBudgetState().categories[cat.id];
      expect(updated.name).toBe('Cell Phone');
      expect(updated.groupId).toBe(g2.id);
      expect(updated.targetCents).toBe(6000);
      expect(updated.targetDueDay).toBe(10);
    });

    it('SCEN-013: prevents direct deletion of credit payment category', () => {
      const acc = repo.createAccount({
        name: 'Credit Card',
        accountType: 'credit',
        balanceCents: 0,
      });
      const paymentCatId = acc.creditPaymentCategoryId!;

      expect(() => {
        repo.deleteCategory(paymentCatId);
      }).toThrow(/credit payment/i);
    });

    it('SCEN-014: prevents deletion of category with available balance', () => {
      const g = repo.createCategoryGroup({ name: 'Living' });
      const cat = repo.createCategory({ groupId: g.id, name: 'Food', targetCents: 10000 });

      // Simulate assignment
      db.runSync('UPDATE categories SET available_cents = 5000 WHERE id = ?', cat.id);

      expect(() => {
        repo.deleteCategory(cat.id);
      }).toThrow(/available funds|transactions/i);
    });

    it('SCEN-015: deletes empty category', () => {
      const g = repo.createCategoryGroup({ name: 'Living' });
      const cat = repo.createCategory({ groupId: g.id, name: 'Misc', targetCents: 0 });

      repo.deleteCategory(cat.id);
      expect(repo.getBudgetState().categories[cat.id]).toBeUndefined();
    });
  });

  describe('Data Reset & Diagnostics', () => {
    it('SCEN-016: factory reset wipes all tables and unsets onboarding_completed', () => {
      repo.createAccount({ name: 'Acc', accountType: 'checking', balanceCents: 1000 });
      repo.factoryReset();

      const state = repo.getBudgetState();
      expect(Object.keys(state.accounts)).toHaveLength(0);
      expect(Object.keys(state.categories)).toHaveLength(0);
      expect(repo.getCategoryGroups()).toHaveLength(0);
      expect(state.readyToAssignCents).toBe(0);
      expect(isOnboardingCompleted(db)).toBe(false);
    });

    it('SCEN-017: seed demo data resets database and sets onboarding_completed to true', () => {
      repo.factoryReset();
      repo.seedDemoData();

      const state = repo.getBudgetState();
      expect(Object.keys(state.accounts).length).toBeGreaterThan(0);
      expect(Object.keys(state.categories).length).toBeGreaterThan(0);
      expect(isOnboardingCompleted(db)).toBe(true);
    });

    it('SCEN-018: provides diagnostics counts accurately', () => {
      repo.factoryReset();
      repo.createAccount({ name: 'A1', accountType: 'checking', balanceCents: 100 });
      const g = repo.createCategoryGroup({ name: 'G1' });
      repo.createCategory({ groupId: g.id, name: 'C1', targetCents: 0 });

      const diag = repo.getDiagnostics();
      expect(diag.accountCount).toBe(1);
      expect(diag.categoryCount).toBe(1);
      expect(diag.transactionCount).toBe(0);
      expect(diag.schemaVersion).toBe(2);
    });
  });
});
```
