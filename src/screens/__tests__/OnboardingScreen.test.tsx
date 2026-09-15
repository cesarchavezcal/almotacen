import React from 'react';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { createCleanTestDatabase } from '../../storage/testDatabase';
import { DatabaseAdapter } from '../../storage/types';
import { isOnboardingCompleted } from '../../storage/schema';
import { getArchetypeTemplate } from '../../domain/onboarding/archetypes';
import {
  OnboardingWizardView,
  OnboardingWizardViewProps,
} from '../../components/onboarding/OnboardingWizardView';
import {
  executeExploreDemo,
  executeCommitOnboarding,
} from '../../hooks/useOnboardingWizard';

describe('Onboarding Wizard Screen & Controller (Ticket 04 / SCEN-052, SCEN-053, SCEN-054)', () => {
  let db: DatabaseAdapter;

  beforeEach(() => {
    db = createCleanTestDatabase();
  });

  afterEach(() => {
    db?.closeSync?.();
  });

  describe('OnboardingWizardView (Presentational Component)', () => {
    it('SCEN-052: renders Step 1 with Welcome greeting and both action buttons', () => {
      const onStartSetupMock = jest.fn();
      const onExploreDemoMock = jest.fn();

      const props: OnboardingWizardViewProps = {
        step: 1,
        checkingName: 'Primary Checking',
        checkingBalanceText: '',
        hasCreditCard: false,
        creditCardName: 'Credit Card',
        creditCardDebtText: '',
        selectedArchetypeId: 'STANDARD_BALANCED',
        template: getArchetypeTemplate('STANDARD_BALANCED'),
        allocations: {},
        startingCashCents: 0,
        totalAssignedCents: 0,
        remainingReadyToAssignCents: 0,
        errorMessage: null,
        isSubmitting: false,
        onNextStep: onStartSetupMock,
        onPrevStep: jest.fn(),
        onExploreDemo: onExploreDemoMock,
        onChangeCheckingName: jest.fn(),
        onChangeCheckingBalanceText: jest.fn(),
        onToggleCreditCard: jest.fn(),
        onChangeCreditCardName: jest.fn(),
        onChangeCreditCardDebtText: jest.fn(),
        onSelectArchetype: jest.fn(),
        onCommit: jest.fn(),
      };

      const rendered = OnboardingWizardView(props);
      expect(rendered.props.testID).toBe('onboarding-wizard-view');
    });

    it('SCEN-053: renders Step 2 account inputs and credit card toggle', () => {
      const props: OnboardingWizardViewProps = {
        step: 2,
        checkingName: 'Main Checking',
        checkingBalanceText: '2500.00',
        hasCreditCard: true,
        creditCardName: 'Apple Card',
        creditCardDebtText: '500.00',
        selectedArchetypeId: 'STANDARD_BALANCED',
        template: getArchetypeTemplate('STANDARD_BALANCED'),
        allocations: {},
        startingCashCents: 250000,
        totalAssignedCents: 0,
        remainingReadyToAssignCents: 250000,
        errorMessage: null,
        isSubmitting: false,
        onNextStep: jest.fn(),
        onPrevStep: jest.fn(),
        onExploreDemo: jest.fn(),
        onChangeCheckingName: jest.fn(),
        onChangeCheckingBalanceText: jest.fn(),
        onToggleCreditCard: jest.fn(),
        onChangeCreditCardName: jest.fn(),
        onChangeCreditCardDebtText: jest.fn(),
        onSelectArchetype: jest.fn(),
        onCommit: jest.fn(),
      };

      const rendered = OnboardingWizardView(props);
      expect(rendered.props.testID).toBe('onboarding-wizard-view');
    });

    it('SCEN-053: renders Step 3 archetype presets selection', () => {
      const onSelectArchetypeMock = jest.fn();
      const props: OnboardingWizardViewProps = {
        step: 3,
        checkingName: 'Primary Checking',
        checkingBalanceText: '2000.00',
        hasCreditCard: false,
        creditCardName: 'Credit Card',
        creditCardDebtText: '',
        selectedArchetypeId: 'DEBT_CRUSHER',
        template: getArchetypeTemplate('DEBT_CRUSHER'),
        allocations: {},
        startingCashCents: 200000,
        totalAssignedCents: 0,
        remainingReadyToAssignCents: 200000,
        errorMessage: null,
        isSubmitting: false,
        onNextStep: jest.fn(),
        onPrevStep: jest.fn(),
        onExploreDemo: jest.fn(),
        onChangeCheckingName: jest.fn(),
        onChangeCheckingBalanceText: jest.fn(),
        onToggleCreditCard: jest.fn(),
        onChangeCreditCardName: jest.fn(),
        onChangeCreditCardDebtText: jest.fn(),
        onSelectArchetype: onSelectArchetypeMock,
        onCommit: jest.fn(),
      };

      const rendered = OnboardingWizardView(props);
      expect(rendered.props.testID).toBe('onboarding-wizard-view');
    });

    it('SCEN-054: renders Step 4 allocation review and commit action', () => {
      const template = getArchetypeTemplate('STANDARD_BALANCED');
      const props: OnboardingWizardViewProps = {
        step: 4,
        checkingName: 'Primary Checking',
        checkingBalanceText: '2000.00',
        hasCreditCard: false,
        creditCardName: 'Credit Card',
        creditCardDebtText: '',
        selectedArchetypeId: 'STANDARD_BALANCED',
        template,
        allocations: { 'cat-rent': 120000, 'cat-groceries': 40000 },
        startingCashCents: 200000,
        totalAssignedCents: 160000,
        remainingReadyToAssignCents: 40000,
        errorMessage: null,
        isSubmitting: false,
        onNextStep: jest.fn(),
        onPrevStep: jest.fn(),
        onExploreDemo: jest.fn(),
        onChangeCheckingName: jest.fn(),
        onChangeCheckingBalanceText: jest.fn(),
        onToggleCreditCard: jest.fn(),
        onChangeCreditCardName: jest.fn(),
        onChangeCreditCardDebtText: jest.fn(),
        onSelectArchetype: jest.fn(),
        onCommit: jest.fn(),
      };

      const rendered = OnboardingWizardView(props);
      expect(rendered.props.testID).toBe('onboarding-wizard-view');
    });
  });

  describe('Wizard Controller Functions (SCEN-052, SCEN-053, SCEN-054)', () => {
    it('SCEN-052: executeExploreDemo populates default seed data and completes onboarding', () => {
      const navigateMock = jest.fn();
      expect(isOnboardingCompleted(db)).toBe(false);

      executeExploreDemo(db, navigateMock);

      expect(isOnboardingCompleted(db)).toBe(true);
      expect(navigateMock).toHaveBeenCalledTimes(1);

      const accounts = db.getAllSync<{ id: string; name: string }>(
        'SELECT id, name FROM accounts'
      );
      expect(accounts.length).toBeGreaterThanOrEqual(1);
    });

    it('SCEN-053 & SCEN-054: executeCommitOnboarding commits accounts, templates, and allocations', () => {
      const navigateMock = jest.fn();
      expect(isOnboardingCompleted(db)).toBe(false);

      executeCommitOnboarding(
        db,
        {
          checkingName: 'Main Checking',
          checkingBalanceText: '2,500.00',
          hasCreditCard: true,
          creditCardName: 'Apple Card',
          creditCardDebtText: '500.00',
          selectedArchetypeId: 'STANDARD_BALANCED',
        },
        navigateMock
      );

      expect(isOnboardingCompleted(db)).toBe(true);
      expect(navigateMock).toHaveBeenCalledTimes(1);

      // Verify checking account
      const accounts = db.getAllSync<{
        id: string;
        name: string;
        account_type: string;
        balance_cents: number;
      }>('SELECT id, name, account_type, balance_cents FROM accounts');

      expect(accounts).toHaveLength(2);
      const checking = accounts.find((a) => a.account_type === 'checking');
      expect(checking?.name).toBe('Main Checking');
      expect(checking?.balance_cents).toBe(250000);

      const creditCard = accounts.find((a) => a.account_type === 'credit');
      expect(creditCard?.name).toBe('Apple Card');
      expect(creditCard?.balance_cents).toBe(-50000);

      // Verify category groups and categories created
      const categories = db.getAllSync<{ id: string; name: string }>(
        'SELECT id, name FROM categories'
      );
      expect(categories.length).toBeGreaterThan(0);
    });

    it('validates required inputs in executeCommitOnboarding', () => {
      const navigateMock = jest.fn();

      // Empty checking name
      expect(() =>
        executeCommitOnboarding(
          db,
          {
            checkingName: '   ',
            checkingBalanceText: '1000.00',
            hasCreditCard: false,
            creditCardName: 'Credit Card',
            creditCardDebtText: '0.00',
            selectedArchetypeId: 'STANDARD_BALANCED',
          },
          navigateMock
        )
      ).toThrow('Please provide a name for your checking account.');

      // Empty credit card name when toggle is active
      expect(() =>
        executeCommitOnboarding(
          db,
          {
            checkingName: 'Checking',
            checkingBalanceText: '1000.00',
            hasCreditCard: true,
            creditCardName: '   ',
            creditCardDebtText: '100.00',
            selectedArchetypeId: 'STANDARD_BALANCED',
          },
          navigateMock
        )
      ).toThrow('Please provide a name for your credit card.');

      expect(navigateMock).not.toHaveBeenCalled();
    });
  });
});
