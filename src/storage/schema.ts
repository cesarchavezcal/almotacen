import { DatabaseAdapter, CategoryGroup } from './types';
import { Account, Category } from '../domain/ledger/types';

export const SCHEMA_VERSION = 1;

export const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  account_type TEXT NOT NULL,
  balance_cents INTEGER NOT NULL,
  credit_payment_category_id TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS category_groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  name TEXT NOT NULL,
  target_cents INTEGER NOT NULL DEFAULT 0,
  assigned_cents INTEGER NOT NULL DEFAULT 0,
  available_cents INTEGER NOT NULL DEFAULT 0,
  is_credit_payment INTEGER NOT NULL DEFAULT 0,
  unfunded_debt_cents INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (group_id) REFERENCES category_groups (id)
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  category_id TEXT,
  payee TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  direction TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'pending',
  unfunded_debt_cents INTEGER DEFAULT 0,
  transferred_to_reserve_cents INTEGER DEFAULT 0,
  FOREIGN KEY (account_id) REFERENCES accounts (id),
  FOREIGN KEY (category_id) REFERENCES categories (id)
);
`;

export interface SeedData {
  accounts: Account[];
  groups: CategoryGroup[];
  categories: Category[];
  readyToAssignCents: number;
}

export const DEFAULT_SEED_DATA: SeedData = {
  accounts: [
    {
      id: 'acc-checking',
      name: 'Titanium Checking',
      accountType: 'checking',
      balanceCents: 250000, // $2,500.00
    },
    {
      id: 'acc-credit',
      name: 'Apple Card',
      accountType: 'credit',
      balanceCents: 0, // $0.00
      creditPaymentCategoryId: 'cat-cc-payment',
    },
  ],
  groups: [
    { id: 'grp-payments', name: 'Credit Card Payments', sortOrder: 0 },
    { id: 'grp-immediate', name: 'Immediate Obligations', sortOrder: 1 },
    { id: 'grp-true', name: 'True Expenses', sortOrder: 2 },
    { id: 'grp-qol', name: 'Quality of Life', sortOrder: 3 },
  ],
  categories: [
    {
      id: 'cat-cc-payment',
      groupId: 'grp-payments',
      name: 'Apple Card Payment',
      targetCents: 0,
      assignedCents: 0,
      availableCents: 0,
      isCreditPayment: true,
      unfundedDebtCents: 0,
    },
    {
      id: 'cat-rent',
      groupId: 'grp-immediate',
      name: 'Rent & Housing',
      targetCents: 120000, // $1,200.00
      assignedCents: 120000,
      availableCents: 120000,
      isCreditPayment: false,
      unfundedDebtCents: 0,
    },
    {
      id: 'cat-groceries',
      groupId: 'grp-immediate',
      name: 'Groceries & Household',
      targetCents: 40000, // $400.00
      assignedCents: 40000,
      availableCents: 40000,
      isCreditPayment: false,
      unfundedDebtCents: 0,
    },
    {
      id: 'cat-utilities',
      groupId: 'grp-immediate',
      name: 'Utilities & Internet',
      targetCents: 15000, // $150.00
      assignedCents: 15000,
      availableCents: 15000,
      isCreditPayment: false,
      unfundedDebtCents: 0,
    },
    {
      id: 'cat-auto',
      groupId: 'grp-true',
      name: 'Auto Maintenance',
      targetCents: 10000, // $100.00
      assignedCents: 10000,
      availableCents: 10000,
      isCreditPayment: false,
      unfundedDebtCents: 0,
    },
    {
      id: 'cat-dining',
      groupId: 'grp-qol',
      name: 'Dining & Coffee',
      targetCents: 15000, // $150.00
      assignedCents: 15000,
      availableCents: 15000,
      isCreditPayment: false,
      unfundedDebtCents: 0,
    },
  ],
  readyToAssignCents: 50000, // $500.00 remaining unassigned
};

export function initializeDatabase(db: DatabaseAdapter, seed: SeedData = DEFAULT_SEED_DATA): void {
  db.execSync(CREATE_TABLES_SQL);

  const versionRow = db.getFirstSync<{ value: string }>(
    'SELECT value FROM metadata WHERE key = ?',
    'schema_version'
  );

  if (!versionRow) {
    seedDatabase(db, seed);
  }
}

export function seedDatabase(db: DatabaseAdapter, seed: SeedData = DEFAULT_SEED_DATA): void {
  db.withTransactionSync(() => {
    db.runSync('DELETE FROM transactions');
    db.runSync('DELETE FROM categories');
    db.runSync('DELETE FROM category_groups');
    db.runSync('DELETE FROM accounts');
    db.runSync('DELETE FROM metadata');

    db.runSync('INSERT INTO metadata (key, value) VALUES (?, ?)', 'schema_version', String(SCHEMA_VERSION));
    db.runSync('INSERT INTO metadata (key, value) VALUES (?, ?)', 'ready_to_assign_cents', String(seed.readyToAssignCents));

    const now = new Date().toISOString();
    for (const acc of seed.accounts) {
      db.runSync(
        'INSERT INTO accounts (id, name, account_type, balance_cents, credit_payment_category_id, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        acc.id,
        acc.name,
        acc.accountType,
        acc.balanceCents,
        acc.creditPaymentCategoryId || null,
        now
      );
    }

    for (const grp of seed.groups) {
      db.runSync(
        'INSERT INTO category_groups (id, name, sort_order) VALUES (?, ?, ?)',
        grp.id,
        grp.name,
        grp.sortOrder
      );
    }

    let sortOrder = 0;
    for (const cat of seed.categories) {
      db.runSync(
        'INSERT INTO categories (id, group_id, name, target_cents, assigned_cents, available_cents, is_credit_payment, unfunded_debt_cents, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        cat.id,
        cat.groupId,
        cat.name,
        cat.targetCents,
        cat.assignedCents,
        cat.availableCents,
        cat.isCreditPayment ? 1 : 0,
        cat.unfundedDebtCents || 0,
        sortOrder++
      );
    }
  });
}
