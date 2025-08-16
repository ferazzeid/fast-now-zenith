import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Auth debugging logger
const authLogger = {
  info: (message: string, data?: any) => console.log(`🔐 Auth: ${message}`, data || ''),
  warn: (message: string, data?: any) => console.warn(`⚠️ Auth: ${message}`, data || ''),
  error: (message: string, data?: any) => console.error(`❌ Auth: ${message}`, data || ''),
};

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConnected: boolean;
  connectionChecking: boolean;
  
  // Session recovery state
  sessionRecoveryAttempts: number;
  lastSessionCheck: number;
  isRecoveringSession: boolean;
  
  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
  checkConnection: () => Promise<boolean>;
  setLoading: (loading: boolean) => void;
  recoverSession: () => Promise<boolean>;
  forceRefreshSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      loading: true,
      isConnected: true,
      connectionChecking: false,
      
      // Session recovery state
      sessionRecoveryAttempts: 0,
      lastSessionCheck: 0,
      isRecoveringSession: false,

      initialize: async () => {
        const state = get();
        if (!state.loading) {
          authLogger.info('Already initialized, skipping');
          return;
        }

        authLogger.info('Starting auth initialization');
        
        try {
          // Set up auth state listener with enhanced debugging
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
              authLogger.info(`Auth state changed: ${event}`, { 
                hasSession: !!session, 
                userId: session?.user?.id,
                email: session?.user?.email 
              });
              
              // Reset recovery attempts on successful auth
              if (session) {
                set({
                  session,
                  user: session?.user ?? null,
                  loading: false,
                  sessionRecoveryAttempts: 0,
                  lastSessionCheck: Date.now(),
                  isRecoveringSession: false,
                });
              } else {
                // Session lost - attempt recovery if not already recovering
                const currentState = get();
                if (!currentState.isRecoveringSession && currentState.sessionRecoveryAttempts < 3) {
                  authLogger.warn('Session lost, attempting recovery');
                  setTimeout(() => {
                    get().recoverSession();
                  }, 1000);
                } else {
                  set({
                    session: null,
                    user: null,
                    loading: false,
                  });
                }
              }
            }
          );

          // Get current session with timeout and retry logic
          let session = null;
          let attempts = 0;
          const maxAttempts = 3;
          
          while (!session && attempts < maxAttempts) {
            try {
              authLogger.info(`Getting session attempt ${attempts + 1}`);
              const sessionPromise = supabase.auth.getSession();
              const sessionTimeout = new Promise((resolve) => 
                setTimeout(() => resolve({ data: { session: null } }), 5000)
              );
              
              const result = await Promise.race([sessionPromise, sessionTimeout]) as any;
              session = result.data.session;
              
              if (!session && attempts < maxAttempts - 1) {
                authLogger.warn(`Session attempt ${attempts + 1} failed, retrying...`);
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            } catch (error) {
              authLogger.error(`Session attempt ${attempts + 1} error:`, error);
            }
            attempts++;
          }
          
          authLogger.info('Session initialization complete', { 
            hasSession: !!session,
            userId: session?.user?.id 
          });
          
          set({
            session,
            user: session?.user ?? null,
            loading: false,
            lastSessionCheck: Date.now(),
          });

          // Store subscription for cleanup
          (window as any).__authSubscription = subscription;
          (window as any).__authInitialized = true;
          
        } catch (error) {
          authLogger.error('Auth initialization failed:', error);
          // Graceful degradation - still allow app to work
          set({ 
            loading: false, 
            isConnected: false,
            sessionRecoveryAttempts: 0 
          });
          (window as any).__authInitialized = true; // Don't block the app
        }
      },

      signIn: async (email: string, password: string) => {
        authLogger.info('Attempting sign in', { email });
        
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          authLogger.error('Sign in failed:', error);
        } else {
          authLogger.info('Sign in successful');
          // Reset recovery state on successful sign in
          set({ 
            sessionRecoveryAttempts: 0,
            isRecoveringSession: false,
            lastSessionCheck: Date.now()
          });
        }
        
        return { error };
      },

      signUp: async (email: string, password: string) => {
        const redirectUrl = `${window.location.origin}/`;
        
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl
          }
        });
        return { error };
      },

      signInWithGoogle: async () => {
        const redirectUrl = `${window.location.origin}/`;
        
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl
          }
        });
        return { error };
      },

      resetPassword: async (email: string) => {
        const redirectUrl = `${window.location.origin}/update-password`;
        
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: redirectUrl
        });
        return { error };
      },

      updatePassword: async (password: string) => {
        const { error } = await supabase.auth.updateUser({
          password: password
        });
        return { error };
      },

      signOut: async () => {
        authLogger.info('Signing out');
        
        const { error } = await supabase.auth.signOut();
        if (!error) {
          set({ 
            user: null, 
            session: null,
            sessionRecoveryAttempts: 0,
            isRecoveringSession: false,
            lastSessionCheck: 0
          });
          
          // Clear all authentication caches on sign out
          if (typeof window !== 'undefined') {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
              if (key.startsWith('cache_profile_') || 
                  key.startsWith('dedupe_profile_') ||
                  key.startsWith('cache_access_') ||
                  key.startsWith('dedupe_access_')) {
                localStorage.removeItem(key);
              }
            });
          }
          
          authLogger.info('Sign out successful');
        } else {
          authLogger.error('Sign out failed:', error);
        }
        
        return { error };
      },

      checkConnection: async () => {
        if (get().connectionChecking) return get().isConnected;
        
        set({ connectionChecking: true });
        
        try {
          // Ultra-light connection check to avoid interfering with auth operations
          const connectionPromise = supabase.from('profiles').select('id').limit(1);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Connection timeout')), 1500) // Further reduced
          );
          
          const { error } = await Promise.race([connectionPromise, timeoutPromise]) as any;
          const connected = !error;
          set({ isConnected: connected, connectionChecking: false });
          return connected;
        } catch (error) {
          // Fail gracefully - assume connected to avoid blocking auth operations
          set({ isConnected: true, connectionChecking: false });
          return true;
        }
      },

      recoverSession: async () => {
        const state = get();
        if (state.isRecoveringSession || state.sessionRecoveryAttempts >= 3) {
          return false;
        }
        
        authLogger.info(`Starting session recovery (attempt ${state.sessionRecoveryAttempts + 1})`);
        
        set({ 
          isRecoveringSession: true,
          sessionRecoveryAttempts: state.sessionRecoveryAttempts + 1 
        });
        
        try {
          // Force refresh the session
          const { data: { session }, error } = await supabase.auth.refreshSession();
          
          if (!error && session) {
            authLogger.info('Session recovery successful');
            set({
              session,
              user: session.user,
              isRecoveringSession: false,
              sessionRecoveryAttempts: 0,
              lastSessionCheck: Date.now(),
            });
            return true;
          } else {
            authLogger.warn('Session recovery failed:', error);
            set({ isRecoveringSession: false });
            return false;
          }
        } catch (error) {
          authLogger.error('Session recovery error:', error);
          set({ isRecoveringSession: false });
          return false;
        }
      },

      forceRefreshSession: async () => {
        const state = get();
        if (!state.session) {
          authLogger.warn('No session to refresh');
          return;
        }
        
        authLogger.info('Force refreshing session');
        
        try {
          const { data: { session }, error } = await supabase.auth.refreshSession();
          
          if (!error && session) {
            set({
              session,
              user: session.user,
              lastSessionCheck: Date.now(),
            });
            authLogger.info('Session refresh successful');
          } else {
            authLogger.warn('Session refresh failed:', error);
          }
        } catch (error) {
          authLogger.error('Session refresh error:', error);
        }
      },

      setLoading: (loading: boolean) => set({ loading }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        lastSessionCheck: state.lastSessionCheck,
      }),
    }
  )
);