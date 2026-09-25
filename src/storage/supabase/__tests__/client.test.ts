import {
  getSupabaseConfig,
  getSupabaseClient,
  resetSupabaseClientForTesting,
  ensureAnonymousSession,
  SupabaseConfigurationError,
  SupabaseAuthError,
} from '../client';
import { SupabaseClient, Session } from '@supabase/supabase-js';
import { fromPartial } from '@total-typescript/shoehorn';

interface MockAuthOptions {
  session?: Session | null;
  getSessionError?: Error | null;
  signInSession?: Session | null;
  signInError?: Error | null;
}

function createMockSupabaseClient(options: MockAuthOptions = {}): {
  client: SupabaseClient;
  getSessionMock: jest.Mock;
  signInAnonymouslyMock: jest.Mock;
} {
  const getSessionMock = jest.fn().mockResolvedValue({
    data: { session: options.session ?? null },
    error: options.getSessionError ?? null,
  });

  const signInAnonymouslyMock = jest.fn().mockResolvedValue({
    data: { session: options.signInSession ?? null },
    error: options.signInError ?? null,
  });

  const client = fromPartial<SupabaseClient>({
    auth: fromPartial<SupabaseClient['auth']>({
      getSession: getSessionMock,
      signInAnonymously: signInAnonymouslyMock,
    }),
  });

  return { client, getSessionMock, signInAnonymouslyMock };
}

describe('Supabase Client & Auth Bootstrap (SCEN-001)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    resetSupabaseClientForTesting();
  });

  afterAll(() => {
    process.env = originalEnv;
    resetSupabaseClientForTesting();
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
      const { client, getSessionMock, signInAnonymouslyMock } = createMockSupabaseClient({
        session: mockSession,
      });

      const session = await ensureAnonymousSession(client);

      expect(session).toEqual(mockSession);
      expect(getSessionMock).toHaveBeenCalledTimes(1);
      expect(signInAnonymouslyMock).not.toHaveBeenCalled();
    });

    it('triggers signInAnonymously when no session exists', async () => {
      const { client, getSessionMock, signInAnonymouslyMock } = createMockSupabaseClient({
        session: null,
        signInSession: mockSession,
      });

      const session = await ensureAnonymousSession(client);

      expect(session).toEqual(mockSession);
      expect(getSessionMock).toHaveBeenCalledTimes(1);
      expect(signInAnonymouslyMock).toHaveBeenCalledTimes(1);
    });

    it('throws SupabaseAuthError if getSession fails', async () => {
      const authError = new Error('Network error inspecting session');
      const { client } = createMockSupabaseClient({
        getSessionError: authError,
      });

      await expect(ensureAnonymousSession(client)).rejects.toThrow(SupabaseAuthError);
    });

    it('throws SupabaseAuthError if signInAnonymously fails', async () => {
      const signInError = new Error('Anonymous sign-in disabled');
      const { client } = createMockSupabaseClient({
        signInError,
      });

      await expect(ensureAnonymousSession(client)).rejects.toThrow(SupabaseAuthError);
    });
  });
});
