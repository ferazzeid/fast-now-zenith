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
  oauthCompleting: boolean;
  
  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signInWithGoogleMobile: () => Promise<{ error: any }>;
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

      initialize: async () => {
        const state = get();
        if (!state.loading) {
          authLogger.info('Already initialized, skipping');
          return;
        }

        authLogger.info('Starting auth initialization');
        
        try {
          // Set up auth state listener - simple and reliable
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
              authLogger.info(`🔔 Auth state changed: ${event}`, { 
                hasSession: !!session, 
                userId: session?.user?.id,
                email: session?.user?.email 
              });
              
              // Handle session refresh errors
              if (event === 'TOKEN_REFRESHED' && !session) {
                authLogger.warn('🔄 Token refresh failed - clearing session');
                set({
                  session: null,
                  user: null,
                  loading: false,
                  oauthCompleting: false
                });
                return;
              }
              
              // Always update state on auth changes
              set({
                session,
                user: session?.user ?? null,
                loading: false,
              });

              // Additional logging for OAuth success detection
              if (event === 'SIGNED_IN' && session) {
                authLogger.info('✅ Sign in detected via auth state change');
                // Validate session is actually working
                try {
                  const { data: { user }, error } = await supabase.auth.getUser();
                  if (error || !user) {
                    authLogger.error('❌ Session validation failed after sign in:', error);
                    // Clear invalid session
                    await supabase.auth.signOut();
                    return;
                  }
                  authLogger.info('✅ Session validated successfully');
                } catch (error) {
                  authLogger.error('❌ Session validation error:', error);
                }
                
                // Clear OAuth completing flag on successful sign in
                set({ oauthCompleting: false });
              }
            }
          );

          // Get current session - simple, no race conditions
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) {
            authLogger.error('Error getting session:', error);
          }
          
          authLogger.info('Session initialization complete', { 
            hasSession: !!session,
            userId: session?.user?.id 
          });
          
          // Always set loading to false after initialization, regardless of session state
          set({
            session,
            user: session?.user ?? null,
            loading: false,
          });

          // Store subscription for cleanup
          (window as any).__authSubscription = subscription;
          (window as any).__authInitialized = true;
          
        } catch (error) {
          authLogger.error('Auth initialization failed:', error);
          // Graceful degradation - still allow app to work
          set({ loading: false });
          (window as any).__authInitialized = true;
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

      signInWithGoogleMobile: async () => {
        authLogger.info('Mobile Google OAuth - using MobileOAuthHandler');
        
        try {
          const { MobileOAuthHandler } = await import('@/utils/MobileOAuthHandler');
          const handler = new MobileOAuthHandler();
          
          const result = await handler.signInWithGoogle();
          
          if (result.success) {
            authLogger.info('Mobile OAuth successful');
            return { error: null };
          } else {
            authLogger.error('Mobile OAuth failed:', result.error);
            return { error: { message: result.error } };
          }
        } catch (error) {
          authLogger.error('Mobile OAuth handler error:', error);
          return { error: { message: error instanceof Error ? error.message : 'Unknown error' } };
        }
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