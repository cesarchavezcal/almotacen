import { useState, useEffect } from 'react';
import { getRepository } from '../storage/useLedgerStore';

export interface OnboardingGuardState {
  isOnboardingCompleted: boolean | null;
  isLoading: boolean;
  error: Error | null;
}

export function checkOnboardingStatus(): boolean {
  const repo = getRepository();
  return repo.isOnboardingCompleted();
}

export function useOnboardingGuard(): OnboardingGuardState {
  const [state, setState] = useState<OnboardingGuardState>(() => {
    try {
      const completed = checkOnboardingStatus();
      return { isOnboardingCompleted: completed, isLoading: false, error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.warn('[useOnboardingGuard] Initial status check failed:', error);
      return { isOnboardingCompleted: null, isLoading: true, error };
    }
  });

  useEffect(() => {
    try {
      const completed = checkOnboardingStatus();
      setState({ isOnboardingCompleted: completed, isLoading: false, error: null });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('[useOnboardingGuard] Status evaluation failed:', error);
      setState({ isOnboardingCompleted: null, isLoading: false, error });
    }
  }, []);

  return state;
}
