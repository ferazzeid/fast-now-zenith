import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConnected: boolean;
  connectionChecking: boolean;
  
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
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      loading: true,
      isConnected: true,
      connectionChecking: false,

      initialize: async () => {
        const state = get();
        if (!state.loading) return; // Already initialized

        try {
          // Gentle connection check with timeout
          const connectionPromise = get().checkConnection();
          const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(true), 2000));
          await Promise.race([connectionPromise, timeoutPromise]);
          
          // Set up auth state listener
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
              set({
                session,
                user: session?.user ?? null,
                loading: false,
              });
              // Mark as successfully initialized
              (window as any).__authInitialized = true;
            }
          );

          // Get current session with timeout
          const sessionPromise = supabase.auth.getSession();
          const sessionTimeout = new Promise((resolve) => 
            setTimeout(() => resolve({ data: { session: null } }), 3000)
          );
          
          const { data: { session } } = await Promise.race([sessionPromise, sessionTimeout]) as any;
          
          set({
            session,
            user: session?.user ?? null,
            loading: false,
          });

          // Store subscription for cleanup
          (window as any).__authSubscription = subscription;
          (window as any).__authInitialized = true;
          
        } catch (error) {
          console.error('Auth initialization failed:', error);
          // Graceful degradation - still allow app to work
          set({ loading: false, isConnected: false });
          (window as any).__authInitialized = true; // Don't block the app
        }
      },

      signIn: async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
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
        const { error } = await supabase.auth.signOut();
        if (!error) {
          set({ user: null, session: null });
          
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
        }
        return { error };
      },

      checkConnection: async () => {
        if (get().connectionChecking) return get().isConnected;
        
        set({ connectionChecking: true });
        
        try {
          // REDUCED TIMEOUT: Quick connection check to prevent auth timeouts
          const connectionPromise = supabase.from('profiles').select('id').limit(1);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Connection timeout')), 2000) // Reduced from 5s to 2s
          );
          
          const { error } = await Promise.race([connectionPromise, timeoutPromise]) as any;
          const connected = !error;
          set({ isConnected: connected, connectionChecking: false });
          return connected;
        } catch (error) {
          // Fail gracefully - assume connected to avoid blocking
          set({ isConnected: true, connectionChecking: false });
          return true;
        }
      },

      setLoading: (loading: boolean) => set({ loading }),
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