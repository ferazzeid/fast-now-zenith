import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { checkOAuthRecovery } from '@/utils/oauthRecovery';
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
  oauthCompleting: boolean;
  initialized: boolean;
  
  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
  setLoading: (loading: boolean) => void;
  setOAuthCompleting: (completing: boolean) => void;
  forceRefresh: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      loading: true,
      oauthCompleting: false,
      initialized: false,

      initialize: async () => {
        const state = get();
        if (state.initialized) {
          authLogger.info('Already initialized, skipping');
          return;
        }

        authLogger.info('Starting auth initialization');
        set({ initialized: true, loading: true });
        
        // Reduced timeout for auth initialization - mobile users shouldn't wait so long
        const timeoutId = setTimeout(() => {
          authLogger.warn('Auth initialization timeout after 8 seconds');
          set({ loading: false });
        }, 8000);
        
        try {
          // Set up auth state listener first
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
              authLogger.info(`Auth event: ${event}`, {
                hasSession: !!session,
                userId: session?.user?.id
              });
              
              // Handle token refresh errors by clearing invalid sessions
              if (event === 'TOKEN_REFRESHED' && !session) {
                authLogger.warn('Token refresh failed, clearing session');
                localStorage.removeItem('sb-texnkijwcygodtywgedm-auth-token');
                set({
                  session: null,
                  user: null,
                  loading: false,
                });
                return;
              }
              
              set({
                session,
                user: session?.user ?? null,
                loading: false,
              });
              clearTimeout(timeoutId); // Clear timeout on success
            }
          );

          // Get current session with better error handling
          const { data: { session }, error } = await supabase.auth.getSession();
          
          clearTimeout(timeoutId); // Clear timeout on completion
          
          if (error) {
            authLogger.error('Error getting session:', error);
            // Clear corrupted auth tokens
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
              if (key.startsWith('sb-') && key.includes('auth-token')) {
                localStorage.removeItem(key);
              }
            });
            set({ 
              session: null, 
              user: null, 
              loading: false 
            });
          } else {
            // Update initial session state
            authLogger.info('Initial session loaded', { hasSession: !!session });
            set({
              session,
              user: session?.user ?? null,
              loading: false,
            });
          }

          // Store subscription for cleanup
          (window as any).__authSubscription = subscription;
          authLogger.info('Auth initialization complete', { hasSession: !!session });
          
        } catch (error) {
          clearTimeout(timeoutId); // Clear timeout on error
          authLogger.error('Auth initialization failed:', error);
          // Always ensure loading is set to false even on error
          set({ loading: false, session: null, user: null });
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
        // Web: let Supabase handle the redirect in the same window
        authLogger.info('Initiating web OAuth flow');

        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: window.location.origin }
        });

        if (error) {
          authLogger.error('Google OAuth initiation failed:', error);
        } else {
          authLogger.info('Web OAuth redirect initiated');
        }
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
        
        // Always clear local state first
        set({ 
          user: null, 
          session: null,
          loading: false,
        });
        
        // Clear all authentication caches
        if (typeof window !== 'undefined') {
          const keys = Object.keys(localStorage);
          keys.forEach(key => {
            if (key.startsWith('cache_profile_') || 
                key.startsWith('dedupe_profile_') ||
                key.startsWith('cache_access_') ||
                key.startsWith('dedupe_access_') ||
                key.startsWith('sb-texnkijwcygodtywgedm-auth-token')) {
              localStorage.removeItem(key);
            }
          });
        }
        
        try {
          const { error } = await supabase.auth.signOut();
          
          if (error && !error.message?.includes('Session not found')) {
            // Only log actual errors, not "session not found" which is expected
            authLogger.warn('Sign out server error (but local state cleared):', error);
            return { error: null }; // Return success since local state is cleared
          }
          
          authLogger.info('Sign out completed successfully');
          return { error: null };
        } catch (err) {
          // Even if server sign out fails, we've cleared local state
          authLogger.warn('Sign out server error (but local state cleared):', err);
          return { error: null };
        }
      },


      setLoading: (loading: boolean) => set({ loading }),
      
      setOAuthCompleting: (completing: boolean) => {
        console.log('🔄 Setting OAuth completing:', completing);
        set({ oauthCompleting: completing });
      },
      
      forceRefresh: async () => {
        console.log('🔄 Force refreshing auth state...');
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) {
            console.error('❌ Error getting session during force refresh:', error);
            return;
          }
          
          console.log('✅ Force refresh session result:', {
            hasSession: !!session,
            userId: session?.user?.id,
            email: session?.user?.email
          });
          
          set({
            session,
            user: session?.user ?? null,
            loading: false,
            oauthCompleting: false
          });
        } catch (error) {
          console.error('❌ Force refresh error:', error);
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        session: state.session,
      }),
    }
  )
);