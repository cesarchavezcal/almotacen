import { describe, it, expect } from '@jest/globals';
import { getArchetypeTemplate } from '../archetypes';
import {
  validateOnboardingConfig,
  OnboardingValidationError,
} from '../onboardingService';
import { CommitOnboardingConfigParams } from '../types';

describe('Onboarding Domain Validation Service (Ticket 04 / SCEN-021)', () => {
  it('SCEN-021: validates and normalizes depository checking account, categories, and initial allocations', () => {
    const template = getArchetypeTemplate('STANDARD_BALANCED');
    const rentCat = template.categories.find((c) => c.id === 'cat-rent')!;
    const groceriesCat = template.categories.find((c) => c.id === 'cat-groceries')!;

    const params: CommitOnboardingConfigParams = {
      depositoryAccount: {
        name: '  Primary Checking  ',
        startingBalanceCents: 200000, // $2,000.00
      },
      template,
      allocations: {
        [rentCat.id]: 120000, // $1,200.00
        [groceriesCat.id]: 40000, // $400.00
      },
      remainingReadyToAssignCents: 40000, // $400.00 ($1,200 + $400 + $400 = $2,000)
    };

    const validated = validateOnboardingConfig(params);

    expect(validated.depositoryAccount.name).toBe('Primary Checking');
    expect(validated.depositoryAccount.startingBalanceCents).toBe(200000);
    expect(validated.depositoryAccount.id).toBe('acc-checking');
    expect(validated.creditCardAccount).toBeUndefined();
    expect(validated.allocations[rentCat.id]).toBe(120000);
    expect(validated.allocations[groceriesCat.id]).toBe(40000);
    expect(validated.remainingReadyToAssignCents).toBe(40000);
    expect(validated.template.id).toBe('STANDARD_BALANCED');
  });

  it('SCEN-021: validates optional credit card account, debt values, and preserves explicit IDs', () => {
    const template = getArchetypeTemplate('MINIMALIST_LIVING');

    const params: CommitOnboardingConfigParams = {
      depositoryAccount: {
        id: 'custom-checking-id',
        name: 'Main Checking',
        startingBalanceCents: 150000, // $1,500.00
      },
      creditCardAccount: {
        id: 'custom-cc-id',
        name: '  Apple Card  ',
        startingDebtCents: 75000, // $750.00 starting debt
      },
      template,
      allocations: {},
      remainingReadyToAssignCents: 150000,
    };

    const validated = validateOnboardingConfig(params);

    expect(validated.depositoryAccount.id).toBe('custom-checking-id');
    expect(validated.depositoryAccount.name).toBe('Main Checking');
    expect(validated.creditCardAccount).toBeDefined();
    expect(validated.creditCardAccount?.id).toBe('custom-cc-id');
    expect(validated.creditCardAccount?.name).toBe('Apple Card');
    expect(validated.creditCardAccount?.startingDebtCents).toBe(75000);
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

    expect(() => validateOnboardingConfig(params)).toThrow(OnboardingValidationError);
    expect(() => validateOnboardingConfig(params)).toThrow(/Zero-based cash invariant violated/);
  });

  it('validates account names and non-negative amounts', () => {
    const template = getArchetypeTemplate('STANDARD_BALANCED');

    // Empty checking account name
    expect(() =>
      validateOnboardingConfig({
        depositoryAccount: { name: '   ', startingBalanceCents: 10000 },
        template,
        allocations: {},
        remainingReadyToAssignCents: 10000,
      })
    ).toThrow('Depository account name cannot be empty.');

    // Negative checking balance
    expect(() =>
      validateOnboardingConfig({
        depositoryAccount: { name: 'Checking', startingBalanceCents: -500 },
        template,
        allocations: {},
        remainingReadyToAssignCents: -500,
      })
    ).toThrow('Starting checking balance cannot be negative.');

    // Empty credit card name
    expect(() =>
      validateOnboardingConfig({
        depositoryAccount: { name: 'Checking', startingBalanceCents: 10000 },
        creditCardAccount: { name: '  ', startingDebtCents: 100 },
        template,
        allocations: {},
        remainingReadyToAssignCents: 10000,
      })
    ).toThrow('Credit card account name cannot be empty.');

    // Negative credit card debt
    expect(() =>
      validateOnboardingConfig({
        depositoryAccount: { name: 'Checking', startingBalanceCents: 10000 },
        creditCardAccount: { name: 'Card', startingDebtCents: -100 },
        template,
        allocations: {},
        remainingReadyToAssignCents: 10000,
      })
    ).toThrow('Credit card starting debt cannot be negative.');

    // Negative ready to assign
    expect(() =>
      validateOnboardingConfig({
        depositoryAccount: { name: 'Checking', startingBalanceCents: 10000 },
        template,
        allocations: { 'cat-rent': 15000 },
        remainingReadyToAssignCents: -5000,
      })
    ).toThrow('Remaining Ready to Assign cannot be negative.');
  });
});
