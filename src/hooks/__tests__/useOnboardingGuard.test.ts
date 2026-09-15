import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createCleanTestDatabase } from '../../storage/testDatabase';
import { setOnboardingCompleted } from '../../storage/schema';
import { DatabaseAdapter } from '../../storage/types';
import { checkOnboardingStatus } from '../useOnboardingGuard';

describe('useOnboardingGuard / checkOnboardingStatus (Ticket 03 / SCEN-051)', () => {
  let db: DatabaseAdapter;

  beforeEach(() => {
    db = createCleanTestDatabase();
  });

  afterEach(() => {
    db?.closeSync?.();
  });

  it('SCEN-051: returns false when database is freshly initialized and onboarding is incomplete', () => {
    expect(checkOnboardingStatus(db)).toBe(false);
  });

  it('SCEN-051: returns true when onboarding completion flag has been persisted', () => {
    setOnboardingCompleted(db, true);
    expect(checkOnboardingStatus(db)).toBe(true);
  });
});
