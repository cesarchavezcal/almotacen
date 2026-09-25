import {
  getSupabaseConfig,
  getSupabaseClient,
  setSupabaseClientInstance,
  ensureAnonymousSession,
  SupabaseConfigurationError,
  SupabaseAuthError,
} from '../client';
import { SupabaseClient, Session } from '@supabase/supabase-js';

describe('Supabase Client & Auth Bootstrap (SCEN-001)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    setSupabaseClientInstance(null);
  });

  afterAll(() => {
    process.env = originalEnv;
    setSupabaseClientInstance(null);
  });

  describe('Configuration', () => {
    it('throws SupabaseConfigurationError when credentials are missing', () => {
      delete process.env.EXPO_PUBLIC_SUPABASE_URL;
      delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

      expect(() => getSupabaseConfig()).toThrow(SupabaseConfigurationError);
      expect(() => getSupabaseConfig()).toThrow(/Missing Supabase credentials/);
    });

    it('returns config when environment variables are set', () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

      const config = getSupabaseConfig();
      expect(config.supabaseUrl).toBe('https://example.supabase.co');
      expect(config.supabaseAnonKey).toBe('test-anon-key');
    });

    it('creates and caches singleton client instance', () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

      const client1 = getSupabaseClient();
      const client2 = getSupabaseClient();

      expect(client1).toBe(client2);
      expect(client1).toBeInstanceOf(SupabaseClient);
    });
  });

  describe('ensureAnonymousSession', () => {
    const mockSession: Session = {
      access_token: 'mock-jwt-token',
      refresh_token: 'mock-refresh-token',
      expires_in: 3600,
      token_type: 'bearer',
      user: {
        id: 'user-uuid-1234',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      },
    };

    it('reuses existing session if active', async () => {
      const mockClient = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: { session: mockSession },
            error: null,
          }),
          signInAnonymously: jest.fn(),
        },
      } as unknown as SupabaseClient;

      const session = await ensureAnonymousSession(mockClient);

      expect(session).toEqual(mockSession);
      expect(mockClient.auth.getSession).toHaveBeenCalledTimes(1);
      expect(mockClient.auth.signInAnonymously).not.toHaveBeenCalled();
    });

    it('triggers signInAnonymously when no session exists', async () => {
      const mockClient = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: { session: null },
            error: null,
          }),
          signInAnonymously: jest.fn().mockResolvedValue({
            data: { session: mockSession },
            error: null,
          }),
        },
      } as unknown as SupabaseClient;

      const session = await ensureAnonymousSession(mockClient);

      expect(session).toEqual(mockSession);
      expect(mockClient.auth.getSession).toHaveBeenCalledTimes(1);
      expect(mockClient.auth.signInAnonymously).toHaveBeenCalledTimes(1);
    });

    it('throws SupabaseAuthError if getSession fails', async () => {
      const authError = new Error('Network error inspecting session');
      const mockClient = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: { session: null },
            error: authError,
          }),
          signInAnonymously: jest.fn(),
        },
      } as unknown as SupabaseClient;

      await expect(ensureAnonymousSession(mockClient)).rejects.toThrow(SupabaseAuthError);
    });

    it('throws SupabaseAuthError if signInAnonymously fails', async () => {
      const signInError = new Error('Anonymous sign-in disabled');
      const mockClient = {
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: { session: null },
            error: null,
          }),
          signInAnonymously: jest.fn().mockResolvedValue({
            data: { session: null },
            error: signInError,
          }),
        },
      } as unknown as SupabaseClient;

      await expect(ensureAnonymousSession(mockClient)).rejects.toThrow(SupabaseAuthError);
    });
  });
});
