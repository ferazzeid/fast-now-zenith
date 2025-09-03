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
        set({ initialized: true });
        
        try {
          // Set up auth state listener
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
              authLogger.info(`Auth event: ${event}`, {
                hasSession: !!session,
                userId: session?.user?.id
              });
              
              set({
                session,
                user: session?.user ?? null,
                loading: false,
              });
            }
          );

          // Get current session
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            authLogger.error('Error getting session:', error);
            set({ loading: false });
            return;
          }

          // Update initial session state
          set({
            session,
            user: session?.user ?? null,
            loading: false,
          });

          // Store subscription for cleanup
          (window as any).__authSubscription = subscription;
          
          authLogger.info('Auth initialization complete');
        } catch (error) {
          authLogger.error('Auth initialization failed:', error);
          set({ loading: false });
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