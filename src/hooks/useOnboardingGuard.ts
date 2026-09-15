import { useState, useEffect } from 'react';
import { getDatabase } from '../storage/database';
import { isOnboardingCompleted } from '../storage/schema';
import { DatabaseAdapter } from '../storage/types';

export interface OnboardingGuardState {
  isOnboardingCompleted: boolean | null;
  isLoading: boolean;
  error: Error | null;
}

export function checkOnboardingStatus(db?: DatabaseAdapter): boolean {
  const database = db ?? getDatabase();
  return isOnboardingCompleted(database);
}

export function useOnboardingGuard(db?: DatabaseAdapter): OnboardingGuardState {
  const [state, setState] = useState<OnboardingGuardState>(() => {
    try {
      const completed = checkOnboardingStatus(db);
      return { isOnboardingCompleted: completed, isLoading: false, error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.warn('[useOnboardingGuard] Initial status check failed:', error);
      return { isOnboardingCompleted: null, isLoading: true, error };
    }
  });

  useEffect(() => {
    try {
      const completed = checkOnboardingStatus(db);
      setState({ isOnboardingCompleted: completed, isLoading: false, error: null });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('[useOnboardingGuard] Status evaluation failed:', error);
      setState({ isOnboardingCompleted: null, isLoading: false, error });
    }
  }, [db]);

  return state;
}
