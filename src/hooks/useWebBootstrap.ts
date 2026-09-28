import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { ensureAnonymousSession } from '../storage/supabase/client';
import { getRepository } from '../storage/useLedgerStore';
import { SupabaseLedgerRepository } from '../storage/supabase/supabaseLedgerRepository';

export interface WebBootstrapState {
  isReady: boolean;
  error: Error | null;
}

/**
 * Pure asynchronous orchestrator for web bootstrapping:
 * 1. Guarantees anonymous session exists on Supabase.
 * 2. Hydrates in-memory BudgetState and CategoryGroup[] cache.
 */
export async function bootstrapWeb(): Promise<void> {
  if (Platform.OS !== 'web') {
    return;
  }
  await ensureAnonymousSession();
  const repo = getRepository();
  if (repo instanceof SupabaseLedgerRepository) {
    await repo.initializeAsync();
  }
}

/**
 * Hook to gate UI rendering during web startup until anonymous session and cache hydration are complete.
 */
export function useWebBootstrap(): WebBootstrapState {
  const [state, setState] = useState<WebBootstrapState>(() => {
    if (Platform.OS !== 'web') {
      return { isReady: true, error: null };
    }
    return { isReady: false, error: null };
  });

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }
    let isMounted = true;
    bootstrapWeb()
      .then(() => {
        if (isMounted) {
          setState({ isReady: true, error: null });
        }
      })
      .catch((err) => {
        if (isMounted) {
          const error = err instanceof Error ? err : new Error(String(err));
          setState({ isReady: false, error });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}
