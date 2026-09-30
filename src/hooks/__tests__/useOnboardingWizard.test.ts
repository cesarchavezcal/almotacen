import { describe, it, expect, jest } from '@jest/globals';
import { executeCommitOnboarding, executeExploreDemo } from '../useOnboardingWizard';
import { LedgerRepository } from '../../storage/types';
import { ValidatedOnboardingConfig } from '../../domain/onboarding/types';
import { OnboardingValidationError } from '../../domain/onboarding/onboardingService';
import { fromPartial } from '@total-typescript/shoehorn';

describe('useOnboardingWizard Controller Seam (SCEN-010, SCEN-011)', () => {
  it('SCEN-011: executeExploreDemo calls repo.seedDemoData() and navigates', () => {
    const seedDemoDataMock = jest.fn<() => void>();
    const navigateMock = jest.fn<() => void>();

    const mockRepo = fromPartial<LedgerRepository>({
      seedDemoData: seedDemoDataMock,
    });

    executeExploreDemo(mockRepo, navigateMock);

    expect(seedDemoDataMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledTimes(1);
  });

  it('SCEN-010: executeCommitOnboarding validates and commits config via LedgerRepository', () => {
    const commitOnboardingConfigMock = jest.fn<(config: ValidatedOnboardingConfig) => void>();
    const navigateMock = jest.fn<() => void>();

    const mockRepo = fromPartial<LedgerRepository>({
      commitOnboardingConfig: commitOnboardingConfigMock,
    });

    executeCommitOnboarding(
      mockRepo,
      {
        checkingName: 'Web Checking',
        checkingBalanceText: '3,000.00',
        hasCreditCard: true,
        creditCardName: 'Web Credit',
        creditCardDebtText: '500.00',
        selectedArchetypeId: 'STANDARD_BALANCED',
      },
      navigateMock
    );

    expect(commitOnboardingConfigMock).toHaveBeenCalledTimes(1);
    const passedConfig = commitOnboardingConfigMock.mock.calls[0][0];
    expect(passedConfig.depositoryAccount.name).toBe('Web Checking');
    expect(passedConfig.depositoryAccount.startingBalanceCents).toBe(300000);
    expect(passedConfig.creditCardAccount?.name).toBe('Web Credit');
    expect(passedConfig.creditCardAccount?.startingDebtCents).toBe(50000);
    expect(navigateMock).toHaveBeenCalledTimes(1);
  });

  it('rejects empty checking account name', () => {
    const mockRepo = fromPartial<LedgerRepository>({
      commitOnboardingConfig: jest.fn(),
    });

    expect(() =>
      executeCommitOnboarding(
        mockRepo,
        {
          checkingName: '   ',
          checkingBalanceText: '1000.00',
          hasCreditCard: false,
          creditCardName: '',
          creditCardDebtText: '0.00',
          selectedArchetypeId: 'STANDARD_BALANCED',
        },
        jest.fn()
      )
    ).toThrow(OnboardingValidationError);
  });

  it('rejects empty credit card name when credit card is active', () => {
    const mockRepo = fromPartial<LedgerRepository>({
      commitOnboardingConfig: jest.fn(),
    });

    expect(() =>
      executeCommitOnboarding(
        mockRepo,
        {
          checkingName: 'Primary Checking',
          checkingBalanceText: '1000.00',
          hasCreditCard: true,
          creditCardName: '   ',
          creditCardDebtText: '100.00',
          selectedArchetypeId: 'STANDARD_BALANCED',
        },
        jest.fn()
      )
    ).toThrow('Please provide a name for your credit card.');
  });
});
