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
          // Check connection first
          await get().checkConnection();
          
          // Set up auth state listener
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
              set({
                session,
                user: session?.user ?? null,
                loading: false,
              });
            }
          );

          // Get current session
          const { data: { session } } = await supabase.auth.getSession();
          
          set({
            session,
            user: session?.user ?? null,
            loading: false,
          });

          // Store subscription for cleanup (we'll handle this in a provider)
          (window as any).__authSubscription = subscription;
          
        } catch (error) {
          console.error('Auth initialization failed:', error);
          set({ loading: false, isConnected: false });
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
        }
        return { error };
      },

      checkConnection: async () => {
        if (get().connectionChecking) return get().isConnected;
        
        set({ connectionChecking: true });
        
        try {
          const { error } = await supabase.from('profiles').select('id').limit(1);
          const connected = !error;
          set({ isConnected: connected, connectionChecking: false });
          return connected;
        } catch (error) {
          set({ isConnected: false, connectionChecking: false });
          return false;
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