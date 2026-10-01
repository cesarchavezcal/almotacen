import { Platform } from 'react-native';
import { SupabaseClient, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { fromPartial } from '@total-typescript/shoehorn';
import {
  handleAuthStateChange,
  getCurrentUserId,
  getRepository,
  resetRepositoryInstanceForTesting,
  subscribe,
  getSnapshot,
} from '../../useLedgerStore';
import { setupAuthListener } from '../client';
import { SupabaseLedgerRepository } from '../supabaseLedgerRepository';

describe('Auth Lifecycle & Identity Switching (SCEN-016, SCEN-017)', () => {
  let mockClient: SupabaseClient;
  let authCallback: ((event: AuthChangeEvent, session: Session | null) => void) | null = null;
  let mockSubscription: { unsubscribe: jest.Mock };

  const origUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const origKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  beforeEach(() => {
    Platform.OS = 'web';
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    resetRepositoryInstanceForTesting();
    authCallback = null;
    mockSubscription = { unsubscribe: jest.fn() };

    mockClient = fromPartial<SupabaseClient>({
      auth: fromPartial<SupabaseClient['auth']>({
        onAuthStateChange: jest.fn().mockImplementation((cb: (event: AuthChangeEvent, session: Session | null) => void) => {
          authCallback = cb;
          return { data: { subscription: mockSubscription } };
        }),
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-a-uuid' } },
          error: null,
        }),
        getSession: jest.fn().mockResolvedValue({
          data: { session: { user: { id: 'user-a-uuid' } } },
          error: null,
        }),
      }),
      from: jest.fn().mockImplementation((table: string) => {
        return fromPartial({
          select: jest.fn().mockImplementation(() => {
            if (table === 'accounts') {
              return Promise.resolve({
                data: [
                  {
                    id: 'acc-1',
                    user_id: 'user-a-uuid',
                    name: 'User A Checking',
                    account_type: 'checking',
                    balance_cents: 150000,
                  },
                ],
                error: null,
              });
            }
            if (table === 'metadata') {
              return Promise.resolve({
                data: [{ key: 'ready_to_assign_cents', value: '150000', user_id: 'user-a-uuid' }],
                error: null,
              });
            }
            return Promise.resolve({ data: [], error: null });
          }),
        });
      }),
      channel: jest.fn().mockImplementation(() => ({
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockReturnThis(),
        unsubscribe: jest.fn().mockResolvedValue('ok'),
      })),
      removeChannel: jest.fn().mockResolvedValue('ok'),
    });
  });

  afterEach(() => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = origUrl;
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = origKey;
    resetRepositoryInstanceForTesting();
  });

  it('exposes setupAuthListener in client.ts wrapping supabase.auth.onAuthStateChange', () => {
    const callback = jest.fn();
    const listener = setupAuthListener(callback, mockClient);

    expect(mockClient.auth.onAuthStateChange).toHaveBeenCalledWith(expect.any(Function));
    expect(listener.unsubscribe).toBeDefined();

    listener.unsubscribe();
    expect(mockSubscription.unsubscribe).toHaveBeenCalled();
  });

  describe('SCEN-016: Clean Budget Switch on Auth Change', () => {
    it('flushes prior budget from memory and re-hydrates incoming user budget when user identity changes', async () => {
      // 1. Establish User A session
      const sessionA = fromPartial<Session>({
        user: fromPartial({ id: 'user-a-uuid', email: 'userA@example.com' }),
      });
      await handleAuthStateChange('SIGNED_IN', sessionA, mockClient);

      expect(getCurrentUserId()).toBe('user-a-uuid');
      const stateA = getSnapshot().budgetState;
      expect(stateA.readyToAssignCents).toBe(150000);
      expect(stateA.accounts['acc-1']?.name).toBe('User A Checking');

      // Spy on store change listener
      const storeListener = jest.fn();
      const unsub = subscribe(storeListener);

      // Configure mock to return User B data for subsequent queries
      (mockClient.from as jest.Mock).mockImplementation((table: string) => {
        return fromPartial({
          select: jest.fn().mockImplementation(() => {
            if (table === 'accounts') {
              return Promise.resolve({
                data: [
                  {
                    id: 'acc-2',
                    user_id: 'user-b-uuid',
                    name: 'User B Savings',
                    account_type: 'savings',
                    balance_cents: 320000,
                  },
                ],
                error: null,
              });
            }
            if (table === 'metadata') {
              return Promise.resolve({
                data: [{ key: 'ready_to_assign_cents', value: '320000', user_id: 'user-b-uuid' }],
                error: null,
              });
            }
            return Promise.resolve({ data: [], error: null });
          }),
        });
      });

      // 2. Switch identity to User B
      const sessionB = fromPartial<Session>({
        user: fromPartial({ id: 'user-b-uuid', email: 'userB@example.com' }),
      });
      await handleAuthStateChange('SIGNED_IN', sessionB, mockClient);

      // Assert User A's budget was completely purged and replaced with User B's
      expect(getCurrentUserId()).toBe('user-b-uuid');
      const stateB = getSnapshot().budgetState;
      expect(stateB.accounts['acc-1']).toBeUndefined();
      expect(stateB.accounts['acc-2']?.name).toBe('User B Savings');
      expect(stateB.readyToAssignCents).toBe(320000);
      expect(storeListener).toHaveBeenCalled();

      unsub();
    });
  });

  describe('SCEN-017: Zero-Data-Loss Identity Claiming', () => {
    it('preserves existing in-memory ledger records when anonymous user claims their account', async () => {
      // 1. Establish anonymous user session
      const anonSession = fromPartial<Session>({
        user: fromPartial({ id: 'anon-user-uuid', is_anonymous: true }),
      });
      await handleAuthStateChange('SIGNED_IN', anonSession, mockClient);

      expect(getCurrentUserId()).toBe('anon-user-uuid');
      const initialSnapshot = getSnapshot();

      // Clear mock calls to verify no re-fetching occurs
      (mockClient.from as jest.Mock).mockClear();

      // 2. Simulate account claiming (email/password added via updateUser)
      // Supabase emits USER_UPDATED with identical user.id UUID
      const claimedSession = fromPartial<Session>({
        user: fromPartial({
          id: 'anon-user-uuid',
          email: 'permanent@example.com',
          is_anonymous: false,
        }),
      });
      await handleAuthStateChange('USER_UPDATED', claimedSession, mockClient);

      // In-memory state MUST remain identical with zero data loss and no reload
      expect(getCurrentUserId()).toBe('anon-user-uuid');
      expect(getSnapshot().budgetState).toBe(initialSnapshot.budgetState);
      expect(mockClient.from).not.toHaveBeenCalled();
    });
  });

  describe('Sign Out Lifecycle', () => {
    it('disposes active repository and resets in-memory store to empty state on SIGNED_OUT', async () => {
      const session = fromPartial<Session>({
        user: fromPartial({ id: 'user-active-uuid' }),
      });
      await handleAuthStateChange('SIGNED_IN', session, mockClient);

      const storeListener = jest.fn();
      const unsub = subscribe(storeListener);

      await handleAuthStateChange('SIGNED_OUT', null, mockClient);

      expect(getCurrentUserId()).toBeNull();
      const emptyState = getSnapshot().budgetState;
      expect(emptyState.readyToAssignCents).toBe(0);
      expect(Object.keys(emptyState.accounts)).toHaveLength(0);
      expect(storeListener).toHaveBeenCalled();

      unsub();
    });
  });
});
