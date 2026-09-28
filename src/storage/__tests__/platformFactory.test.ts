import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Platform } from 'react-native';
import { getRepository, resetRepositoryInstanceForTesting } from '../useLedgerStore';
import { SupabaseLedgerRepository } from '../supabase/supabaseLedgerRepository';
import { SQLiteLedgerRepository } from '../ledgerRepository';
import { bootstrapWeb } from '../../hooks/useWebBootstrap';
import { checkOnboardingStatus } from '../../hooks/useOnboardingGuard';
import * as supabaseClientModule from '../supabase/client';
import { fromPartial } from '@total-typescript/shoehorn';
import { SupabaseClient } from '@supabase/supabase-js';

jest.mock('../supabase/client', () => {
  const actual = jest.requireActual('../supabase/client') as object;
  return {
    ...actual,
    ensureAnonymousSession: jest.fn(),
    getSupabaseClient: jest.fn(),
  };
});

describe('Platform-Specific Repository Factory & Web Bootstrapping (SCEN-008)', () => {
  const originalPlatform = Platform.OS;

  beforeEach(() => {
    resetRepositoryInstanceForTesting();
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co';
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key';
  });

  afterEach(() => {
    (Platform as { OS: string }).OS = originalPlatform;
    resetRepositoryInstanceForTesting();
  });

  describe('SCEN-008: Platform-Specific Repository Factory Routing', () => {
    it('returns SupabaseLedgerRepository instance when Platform.OS is web', () => {
      (Platform as { OS: string }).OS = 'web';

      const mockSupabaseClient = fromPartial<SupabaseClient>({
        auth: fromPartial<SupabaseClient['auth']>({
          getUser: jest.fn().mockImplementation(() =>
            Promise.resolve({ data: { user: { id: 'test-user' } }, error: null })
          ),
          getSession: jest.fn().mockImplementation(() =>
            Promise.resolve({ data: { session: null }, error: null })
          ),
        }),
      });

      jest.spyOn(supabaseClientModule, 'getSupabaseClient').mockReturnValue(mockSupabaseClient);

      const repo = getRepository();

      expect(repo).toBeInstanceOf(SupabaseLedgerRepository);
    });

    it('returns SQLiteLedgerRepository instance when Platform.OS is ios or android', () => {
      (Platform as { OS: string }).OS = 'ios';

      const repo = getRepository();

      expect(repo).toBeInstanceOf(SQLiteLedgerRepository);
    });

    it('reuses the singleton instance on subsequent calls within the same platform', () => {
      (Platform as { OS: string }).OS = 'ios';

      const repo1 = getRepository();
      const repo2 = getRepository();

      expect(repo1).toBe(repo2);
    });

    it('creates a new repository instance after resetRepositoryInstanceForTesting', () => {
      (Platform as { OS: string }).OS = 'ios';

      const repo1 = getRepository();
      resetRepositoryInstanceForTesting();
      const repo2 = getRepository();

      expect(repo1).not.toBe(repo2);
      expect(repo2).toBeInstanceOf(SQLiteLedgerRepository);
    });
  });

  describe('Web Bootstrapping Lifecycle (bootstrapWeb)', () => {
    it('skips Supabase auth and hydration when Platform.OS is native', async () => {
      (Platform as { OS: string }).OS = 'ios';

      const ensureMock = jest.spyOn(supabaseClientModule, 'ensureAnonymousSession');

      await bootstrapWeb();

      expect(ensureMock).not.toHaveBeenCalled();
    });

    it('executes ensureAnonymousSession and initializeAsync sequentially when Platform.OS is web', async () => {
      (Platform as { OS: string }).OS = 'web';

      const ensureMock = jest.spyOn(supabaseClientModule, 'ensureAnonymousSession').mockResolvedValue(
        fromPartial({
          user: { id: 'anon-user-123' },
          access_token: 'fake-token',
        })
      );

      const mockSupabaseClient = fromPartial<SupabaseClient>({
        auth: fromPartial<SupabaseClient['auth']>({
          getUser: jest.fn().mockImplementation(() =>
            Promise.resolve({ data: { user: { id: 'anon-user-123' } }, error: null })
          ),
          getSession: jest.fn().mockImplementation(() =>
            Promise.resolve({ data: { session: null }, error: null })
          ),
        }),
      });
      jest.spyOn(supabaseClientModule, 'getSupabaseClient').mockReturnValue(mockSupabaseClient);

      const initSpy = jest
        .spyOn(SupabaseLedgerRepository.prototype, 'initializeAsync')
        .mockResolvedValue();

      await bootstrapWeb();

      expect(ensureMock).toHaveBeenCalledTimes(1);
      expect(initSpy).toHaveBeenCalledTimes(1);

      initSpy.mockRestore();
    });
  });

  describe('Failure-First Invariants: Bootstrap Errors', () => {
    it('fails fast when ensureAnonymousSession throws during web bootstrap', async () => {
      (Platform as { OS: string }).OS = 'web';

      jest
        .spyOn(supabaseClientModule, 'ensureAnonymousSession')
        .mockRejectedValue(new Error('Network offline or Supabase unreachable'));

      await expect(bootstrapWeb()).rejects.toThrow('Network offline or Supabase unreachable');
    });

    it('fails fast and propagates error when initializeAsync throws during web bootstrap', async () => {
      (Platform as { OS: string }).OS = 'web';

      jest.spyOn(supabaseClientModule, 'ensureAnonymousSession').mockResolvedValue(
        fromPartial({
          user: { id: 'anon-user-123' },
        })
      );

      const mockSupabaseClient = fromPartial<SupabaseClient>({
        auth: fromPartial<SupabaseClient['auth']>({
          getUser: jest.fn().mockImplementation(() =>
            Promise.resolve({ data: { user: { id: 'anon-user-123' } }, error: null })
          ),
          getSession: jest.fn().mockImplementation(() =>
            Promise.resolve({ data: { session: null }, error: null })
          ),
        }),
      });
      jest.spyOn(supabaseClientModule, 'getSupabaseClient').mockReturnValue(mockSupabaseClient);

      const initSpy = jest
        .spyOn(SupabaseLedgerRepository.prototype, 'initializeAsync')
        .mockRejectedValue(new Error('Failed to load accounts from Supabase: 500 Internal Error'));

      await expect(bootstrapWeb()).rejects.toThrow('Failed to load accounts from Supabase: 500 Internal Error');

      initSpy.mockRestore();
    });
  });

  describe('Web-Safe Onboarding Status Guard', () => {
    it('evaluates onboarding status from repository diagnostics on web without opening SQLite', () => {
      (Platform as { OS: string }).OS = 'web';

      const mockSupabaseClient = fromPartial<SupabaseClient>({
        auth: fromPartial<SupabaseClient['auth']>({
          getUser: jest.fn().mockImplementation(() =>
            Promise.resolve({ data: { user: { id: 'anon-user-123' } }, error: null })
          ),
          getSession: jest.fn().mockImplementation(() =>
            Promise.resolve({ data: { session: null }, error: null })
          ),
        }),
      });
      jest.spyOn(supabaseClientModule, 'getSupabaseClient').mockReturnValue(mockSupabaseClient);

      const diagSpy = jest
        .spyOn(SupabaseLedgerRepository.prototype, 'getDiagnostics')
        .mockReturnValue({
          schemaVersion: 2,
          accountCount: 0,
          categoryGroupCount: 0,
          categoryCount: 0,
          transactionCount: 0,
        });

      // 0 accounts -> not completed
      expect(checkOnboardingStatus()).toBe(false);

      diagSpy.mockReturnValue({
        schemaVersion: 2,
        accountCount: 2,
        categoryGroupCount: 4,
        categoryCount: 8,
        transactionCount: 0,
      });

      // 2 accounts -> completed
      expect(checkOnboardingStatus()).toBe(true);

      diagSpy.mockRestore();
    });
  });
});
