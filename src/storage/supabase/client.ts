import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';

export class SupabaseConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseConfigurationError';
  }
}

export class SupabaseAuthError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'SupabaseAuthError';
  }
}

export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

let _supabaseClient: SupabaseClient | null = null;

export function getSupabaseConfig(): SupabaseConfig {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new SupabaseConfigurationError(
      'Missing Supabase credentials. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your environment.'
    );
  }

  return { supabaseUrl, supabaseAnonKey };
}

export function getSupabaseClient(customConfig?: SupabaseConfig): SupabaseClient {
  if (_supabaseClient) {
    return _supabaseClient;
  }

  const { supabaseUrl, supabaseAnonKey } = customConfig ?? getSupabaseConfig();

  _supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  return _supabaseClient;
}

export function resetSupabaseClientForTesting(): void {
  _supabaseClient = null;
}

export async function ensureAnonymousSession(
  client?: SupabaseClient
): Promise<Session> {
  const supabase = client ?? getSupabaseClient();

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    throw new SupabaseAuthError('Failed to inspect existing auth session.', sessionError);
  }

  if (sessionData.session) {
    return sessionData.session;
  }

  const { data: authData, error: signInError } = await supabase.auth.signInAnonymously();
  if (signInError || !authData.session) {
    throw new SupabaseAuthError(
      signInError?.message ?? 'Anonymous authentication failed: no session returned.',
      signInError
    );
  }

  return authData.session;
}
