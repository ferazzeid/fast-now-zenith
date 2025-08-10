import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
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
  reset: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      loading: true,
      initialized: false,

      initialize: async () => {
        const state = get();
        if (state.initialized) {
          set({ loading: false });
          return;
        }

        try {
          console.log('🔐 Initializing auth...');
          
          // Set up auth state listener
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
              console.log('🔐 Auth state changed:', event, !!session);
              
              // Handle specific auth events
              if (event === 'SIGNED_OUT') {
                set({
                  session: null,
                  user: null,
                  loading: false,
                });
              } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                set({
                  session,
                  user: session?.user ?? null,
                  loading: false,
                });
              } else if (event === 'INITIAL_SESSION') {
                set({
                  session,
                  user: session?.user ?? null,
                  loading: false,
                  initialized: true,
                });
              }
            }
          );

          // Get current session immediately
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('🔐 Auth session error:', error);
            // Clear any invalid persisted state
            set({ session: null, user: null, loading: false, initialized: true });
          } else {
            console.log('🔐 Initial session:', !!session);
            set({
              session,
              user: session?.user ?? null,
              loading: false,
              initialized: true,
            });
          }

          // Store subscription for cleanup
          (window as any).__authSubscription = subscription;
          
        } catch (error) {
          console.error('🔐 Auth initialization failed:', error);
          set({ 
            session: null, 
            user: null, 
            loading: false, 
            initialized: true 
          });
        }
      },

      signIn: async (email: string, password: string) => {
        set({ loading: true });
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          set({ loading: false });
        }
        return { error };
      },

      signUp: async (email: string, password: string) => {
        set({ loading: true });
        const redirectUrl = `${window.location.origin}/`;
        
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl
          }
        });
        if (error) {
          set({ loading: false });
        }
        return { error };
      },

      signInWithGoogle: async () => {
        const redirectUrl = `${window.location.origin}/`;
        
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            }
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
        set({ loading: true });
        const { error } = await supabase.auth.signOut();
        if (!error) {
          set({ user: null, session: null, loading: false });
        } else {
          set({ loading: false });
        }
        return { error };
      },

      setLoading: (loading: boolean) => set({ loading }),
      
      reset: () => set({ 
        user: null, 
        session: null, 
        loading: true, 
        initialized: false 
      }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        // Only persist minimal data to avoid conflicts
        initialized: state.initialized,
      }),
      onRehydrateStorage: () => (state) => {
        // Reset loading state on rehydration
        if (state) {
          state.loading = true;
        }
      },
    }
  )
);