import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { checkOnboardingStatus } from '../useOnboardingGuard';
import { setCustomLedgerRepository, resetRepositoryInstanceForTesting } from '../../storage/useLedgerStore';
import { LedgerRepository } from '../../storage/types';
import { fromPartial } from '@total-typescript/shoehorn';

describe('useOnboardingGuard / checkOnboardingStatus (Ticket 03 / SCEN-064)', () => {
  beforeEach(() => {
    resetRepositoryInstanceForTesting();
  });

  afterEach(() => {
    resetRepositoryInstanceForTesting();
  });

  it('SCEN-064: checks onboarding status solely via repository without DatabaseAdapter', () => {
    const mockRepo = fromPartial<LedgerRepository>({
      isOnboardingCompleted: jest.fn().mockReturnValue(false),
      getBudgetState: jest.fn().mockReturnValue({
        readyToAssignCents: 0,
        accounts: {},
        categories: {},
        transactions: [],
        totalOutflowCents: 0,
        totalInflowCents: 0,
      }),
      getCategoryGroups: jest.fn().mockReturnValue([]),
    });
    setCustomLedgerRepository(mockRepo);

    expect(checkOnboardingStatus()).toBe(false);
    expect(mockRepo.isOnboardingCompleted).toHaveBeenCalledTimes(1);

    (mockRepo.isOnboardingCompleted as jest.Mock).mockReturnValue(true);
    expect(checkOnboardingStatus()).toBe(true);
  });
});
