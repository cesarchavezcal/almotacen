import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { DatabaseAdapter } from '../types';
import {
  initializeDatabase,
  seedDemoData,
  isOnboardingCompleted,
  setOnboardingCompleted,
} from '../schema';
import { createCleanTestDatabase, createTestDatabase } from '../testDatabase';

describe('Clean Database Initialization & Demo Seeder (Ticket 01 / SCEN-047, SCEN-052)', () => {
  let db: DatabaseAdapter;

  afterEach(() => {
    db?.closeSync?.();
  });

  it('SCEN-047: initializeDatabase on fresh database creates clean tables with zero accounts and categories', () => {
    db = createCleanTestDatabase();

    // Verify metadata values
    const versionRow = db.getFirstSync<{ value: string }>(
      'SELECT value FROM metadata WHERE key = ?',
      'schema_version'
    );
    expect(versionRow?.value).toBe('2');

    const rtaRow = db.getFirstSync<{ value: string }>(
      'SELECT value FROM metadata WHERE key = ?',
      'ready_to_assign_cents'
    );
    expect(rtaRow?.value).toBe('0');

    // Invariant: isOnboardingCompleted is false on fresh init
    expect(isOnboardingCompleted(db)).toBe(false);

    // Verify all domain tables have 0 rows
    const accounts = db.getAllSync('SELECT * FROM accounts');
    expect(accounts).toHaveLength(0);

    const categories = db.getAllSync('SELECT * FROM categories');
    expect(categories).toHaveLength(0);

    const categoryGroups = db.getAllSync('SELECT * FROM category_groups');
    expect(categoryGroups).toHaveLength(0);

    const transactions = db.getAllSync('SELECT * FROM transactions');
    expect(transactions).toHaveLength(0);
  });

  it('SCEN-047: setOnboardingCompleted correctly toggles and persists the completion flag in metadata', () => {
    db = createCleanTestDatabase();
    expect(isOnboardingCompleted(db)).toBe(false);

    setOnboardingCompleted(db, true);
    expect(isOnboardingCompleted(db)).toBe(true);

    setOnboardingCompleted(db, false);
    expect(isOnboardingCompleted(db)).toBe(false);
  });

  it('SCEN-052: seedDemoData populates default accounts, categories, and marks onboarding as completed', () => {
    db = createCleanTestDatabase();

    // Explicit demo data shortcut
    seedDemoData(db);

    expect(isOnboardingCompleted(db)).toBe(true);

    const accounts = db.getAllSync<{ id: string; name: string }>('SELECT id, name FROM accounts');
    expect(accounts.length).toBeGreaterThanOrEqual(2);
    expect(accounts.some((a) => a.id === 'acc-checking')).toBe(true);
    expect(accounts.some((a) => a.id === 'acc-credit')).toBe(true);

    const categories = db.getAllSync<{ id: string }>('SELECT id FROM categories');
    expect(categories.length).toBeGreaterThan(0);

    const rtaRow = db.getFirstSync<{ value: string }>(
      'SELECT value FROM metadata WHERE key = ?',
      'ready_to_assign_cents'
    );
    expect(rtaRow?.value).toBe('50000');
  });

  it('idempotency: multiple calls to initializeDatabase do not wipe existing data or reset onboarding_completed', () => {
    db = createCleanTestDatabase();
    setOnboardingCompleted(db, true);

    // Insert dummy account to check non-destructive idempotency
    db.runSync(
      'INSERT INTO accounts (id, name, account_type, balance_cents, created_at) VALUES (?, ?, ?, ?, ?)',
      'acc-custom',
      'My Custom Checking',
      'checking',
      10000,
      new Date().toISOString()
    );

    // Re-run initialization
    initializeDatabase(db);

    expect(isOnboardingCompleted(db)).toBe(true);
    const customAccount = db.getFirstSync<{ name: string }>(
      'SELECT name FROM accounts WHERE id = ?',
      'acc-custom'
    );
    expect(customAccount?.name).toBe('My Custom Checking');
  });

  it('createTestDatabase backward compatibility: defaults to seeded state for existing test suites', () => {
    db = createTestDatabase();

    // Default createTestDatabase should still be seeded so existing tests continue passing
    const accounts = db.getAllSync('SELECT * FROM accounts');
    expect(accounts.length).toBeGreaterThanOrEqual(2);
    expect(isOnboardingCompleted(db)).toBe(true);
  });
});
