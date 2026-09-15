import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createCleanTestDatabase } from '../../../storage/testDatabase';
import { DatabaseAdapter } from '../../../storage/types';
import { isOnboardingCompleted } from '../../../storage/schema';
import { createOnboardingRepository } from '../../../storage/onboardingRepository';
import { getArchetypeTemplate } from '../archetypes';
import {
  commitOnboardingConfig,
  validateOnboardingConfig,
  OnboardingValidationError,
} from '../onboardingService';
import { CommitOnboardingConfigParams, OnboardingRepository } from '../types';

describe('Onboarding Commitment Service (Ticket 03 / SCEN-047, SCEN-048)', () => {
  let db: DatabaseAdapter;
  let repo: OnboardingRepository;

  beforeEach(() => {
    db = createCleanTestDatabase();
    repo = createOnboardingRepository(db);
  });

  afterEach(() => {
    db?.closeSync?.();
  });

  it('SCEN-048: commits depository checking account, categories, and initial allocations', () => {
    const template = getArchetypeTemplate('STANDARD_BALANCED');
    const rentCat = template.categories.find((c) => c.id === 'cat-rent')!;
    const groceriesCat = template.categories.find((c) => c.id === 'cat-groceries')!;

    const params: CommitOnboardingConfigParams = {
      depositoryAccount: {
        name: 'Primary Checking',
        startingBalanceCents: 200000, // $2,000.00
      },
      template,
      allocations: {
        [rentCat.id]: 120000, // $1,200.00
        [groceriesCat.id]: 40000, // $400.00
      },
      remainingReadyToAssignCents: 40000, // $400.00 ($1,200 + $400 + $400 = $2,000)
    };

    expect(isOnboardingCompleted(db)).toBe(false);

    commitOnboardingConfig(repo, params);

    // Verify metadata completion flag
    expect(isOnboardingCompleted(db)).toBe(true);

    // Verify readyToAssign in metadata
    const rtaRow = db.getFirstSync<{ value: string }>(
      'SELECT value FROM metadata WHERE key = ?',
      'ready_to_assign_cents'
    );
    expect(rtaRow?.value).toBe('40000');

    // Verify accounts
    const accounts = db.getAllSync<{
      id: string;
      name: string;
      account_type: string;
      balance_cents: number;
    }>('SELECT id, name, account_type, balance_cents FROM accounts');

    expect(accounts).toHaveLength(1);
    expect(accounts[0].name).toBe('Primary Checking');
    expect(accounts[0].account_type).toBe('checking');
    expect(accounts[0].balance_cents).toBe(200000);

    // Verify category groups and categories created
    const groups = db.getAllSync('SELECT * FROM category_groups');
    expect(groups.length).toBe(template.groups.length);

    const categories = db.getAllSync<{
      id: string;
      name: string;
      assigned_cents: number;
      available_cents: number;
      target_cents: number;
    }>('SELECT id, name, assigned_cents, available_cents, target_cents FROM categories');

    expect(categories.length).toBe(template.categories.length);

    const savedRent = categories.find((c) => c.id === 'cat-rent');
    expect(savedRent?.assigned_cents).toBe(120000);
    expect(savedRent?.available_cents).toBe(120000);
    expect(savedRent?.target_cents).toBe(120000);

    const savedGroceries = categories.find((c) => c.id === 'cat-groceries');
    expect(savedGroceries?.assigned_cents).toBe(40000);
    expect(savedGroceries?.available_cents).toBe(40000);

    // Unassigned category in template should have 0 allocated
    const savedAuto = categories.find((c) => c.id === 'cat-auto');
    expect(savedAuto?.assigned_cents).toBe(0);
    expect(savedAuto?.available_cents).toBe(0);
  });

  it('SCEN-048: commits optional credit card account, payment envelope, and unfunded debt tracking', () => {
    const template = getArchetypeTemplate('MINIMALIST_LIVING');

    const params: CommitOnboardingConfigParams = {
      depositoryAccount: {
        name: 'Main Checking',
        startingBalanceCents: 150000, // $1,500.00
      },
      creditCardAccount: {
        name: 'Apple Card',
        startingDebtCents: 75000, // $750.00 starting debt
      },
      template,
      allocations: {},
      remainingReadyToAssignCents: 150000,
    };

    commitOnboardingConfig(repo, params);

    expect(isOnboardingCompleted(db)).toBe(true);

    const accounts = db.getAllSync<{
      id: string;
      name: string;
      account_type: string;
      balance_cents: number;
      credit_payment_category_id: string | null;
    }>('SELECT id, name, account_type, balance_cents, credit_payment_category_id FROM accounts');

    expect(accounts).toHaveLength(2);

    const ccAccount = accounts.find((a) => a.account_type === 'credit');
    expect(ccAccount).toBeDefined();
    expect(ccAccount?.name).toBe('Apple Card');
    expect(ccAccount?.balance_cents).toBe(-75000); // Negative balance represents debt
    expect(ccAccount?.credit_payment_category_id).toBeTruthy();

    // Verify payment category created with unfunded debt
    const paymentCat = db.getFirstSync<{
      id: string;
      name: string;
      is_credit_payment: number;
      unfunded_debt_cents: number;
    }>(
      'SELECT id, name, is_credit_payment, unfunded_debt_cents FROM categories WHERE id = ?',
      ccAccount?.credit_payment_category_id!
    );

    expect(paymentCat).toBeDefined();
    expect(paymentCat?.is_credit_payment).toBe(1);
    expect(paymentCat?.unfunded_debt_cents).toBe(75000);
  });

  it('enforces zero-based budgeting cash invariant (sum(allocations) + RTA === startingCash)', () => {
    const template = getArchetypeTemplate('STANDARD_BALANCED');

    const params: CommitOnboardingConfigParams = {
      depositoryAccount: {
        name: 'Primary Checking',
        startingBalanceCents: 100000, // $1,000.00
      },
      template,
      allocations: {
        'cat-rent': 60000,
      },
      // Invariant violated: 60,000 + 50,000 = 110,000 !== 100,000
      remainingReadyToAssignCents: 50000,
    };

    expect(() => commitOnboardingConfig(repo, params)).toThrow(OnboardingValidationError);
    expect(isOnboardingCompleted(db)).toBe(false);
  });

  it('validates account names and non-negative amounts', () => {
    const template = getArchetypeTemplate('STANDARD_BALANCED');

    // Empty checking account name
    expect(() =>
      commitOnboardingConfig(repo, {
        depositoryAccount: { name: '   ', startingBalanceCents: 10000 },
        template,
        allocations: {},
        remainingReadyToAssignCents: 10000,
      })
    ).toThrow(OnboardingValidationError);

    // Negative checking balance
    expect(() =>
      commitOnboardingConfig(repo, {
        depositoryAccount: { name: 'Checking', startingBalanceCents: -500 },
        template,
        allocations: {},
        remainingReadyToAssignCents: -500,
      })
    ).toThrow(OnboardingValidationError);

    // Negative credit card debt
    expect(() =>
      commitOnboardingConfig(repo, {
        depositoryAccount: { name: 'Checking', startingBalanceCents: 10000 },
        creditCardAccount: { name: 'Card', startingDebtCents: -100 },
        template,
        allocations: {},
        remainingReadyToAssignCents: 10000,
      })
    ).toThrow(OnboardingValidationError);
  });

  it('rolls back completely if a database failure occurs during transaction', () => {
    const template = getArchetypeTemplate('STANDARD_BALANCED');

    // Passing invalid group duplicate will force SQLite error or transaction failure
    const corruptTemplate = {
      ...template,
      groups: [
        { id: 'grp-dup', name: 'Group 1', sortOrder: 1 },
        { id: 'grp-dup', name: 'Group 2', sortOrder: 2 }, // Duplicate PRIMARY KEY
      ],
    };

    const params: CommitOnboardingConfigParams = {
      depositoryAccount: {
        name: 'Checking',
        startingBalanceCents: 50000,
      },
      template: corruptTemplate,
      allocations: {},
      remainingReadyToAssignCents: 50000,
    };

    expect(() => commitOnboardingConfig(repo, params)).toThrow();

    // Verify rollback: 0 accounts, 0 categories, onboarding_completed still false
    const accounts = db.getAllSync('SELECT * FROM accounts');
    expect(accounts).toHaveLength(0);
    expect(isOnboardingCompleted(db)).toBe(false);
  });
});
