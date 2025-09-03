import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

/**
 * Unified Session Readiness Levels
 * 
 * This is the single source of truth for session state across the entire app.
 * Every component should check this state instead of individual user/session properties.
 */
export type SessionReadiness = 
  | 'loading'    // Auth is loading
  | 'ready'      // User authenticated and ready
  | 'invalid';   // User needs to sign in again

interface UnifiedSessionState {
  // Core session data
  user: User | null;
  session: Session | null;
  readiness: SessionReadiness;
  
  // State tracking
  isAuthLoading: boolean;
  isInitializing: boolean;
  
  // Error states
  error: string | null;
  retryCount: number;
  
  // Actions
  initialize: () => Promise<void>;
  setError: (error: string) => void;
  retry: () => void;
  reset: () => void;
  
  // Simple state checkers
  isReady: () => boolean;
}

export const useUnifiedSession = create<UnifiedSessionState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      session: null,
      readiness: 'loading',
      isAuthLoading: true,
      isInitializing: false,
      error: null,
      retryCount: 0,

      initialize: async () => {
        const state = get();
        
        // Prevent multiple simultaneous initializations
        if (state.isInitializing) {
          console.log('🔄 UnifiedSession: Already initializing, skipping...');
          return;
        }
        
        console.log('🔄 UnifiedSession: Initializing...');
        
        set({ 
          readiness: 'loading', 
          isAuthLoading: true, 
          isInitializing: true,
          error: null 
        });

        try {
          // Set up auth state listener
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
              console.log(`🔔 UnifiedSession: Auth event: ${event}`, {
                hasSession: !!session,
                userId: session?.user?.id
              });
              
              const state = get();
              
              // Update session data
              set({
                session,
                user: session?.user ?? null,
                isAuthLoading: false,
              });

              // Handle different auth events
              if (event === 'SIGNED_OUT' || !session) {
                console.log('🔄 UnifiedSession: User signed out, resetting to invalid');
                set({
                  readiness: 'invalid',
                  error: null
                });
                return;
              }

              if (event === 'TOKEN_REFRESHED' && !session) {
                console.log('🔄 UnifiedSession: Token refresh failed');
                set({
                  readiness: 'invalid',
                  error: 'Session expired'
                });
                return;
              }

              // For signed in users, instantly ready
              if (session?.user) {
                console.log('🔄 UnifiedSession: User authenticated and ready!');
                set({ readiness: 'ready' });
              }
            }
          );

          // Get current session
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('🔄 UnifiedSession: Error getting session:', error);
            set({ 
              readiness: 'invalid', 
              error: error.message,
              isAuthLoading: false 
            });
            return;
          }

          // Update initial session state
          set({
            session,
            user: session?.user ?? null,
            isAuthLoading: false,
          });

          if (session?.user) {
            console.log('🔄 UnifiedSession: Initial session found, ready!');
            set({ readiness: 'ready' });
          } else {
            console.log('🔄 UnifiedSession: No session found');
            set({ readiness: 'invalid' });
          }

          // Store subscription for cleanup
          (window as any).__unifiedSessionSubscription = subscription;

        } catch (error) {
          console.error('🔄 UnifiedSession: Initialization failed:', error);
          set({ 
            readiness: 'invalid', 
            error: error instanceof Error ? error.message : 'Initialization failed',
            isAuthLoading: false,
            isInitializing: false
          });
        } finally {
          // Always clear initializing flag
          set({ isInitializing: false });
        }
      },


      setError: (error: string) => {
        set({ error, readiness: 'invalid' });
      },

      retry: () => {
        const state = get();
        set({ 
          retryCount: state.retryCount + 1,
          error: null
        });
        state.initialize();
      },

      reset: () => {
        // Clean up any existing subscription
        if ((window as any).__unifiedSessionSubscription) {
          (window as any).__unifiedSessionSubscription.unsubscribe();
          (window as any).__unifiedSessionSubscription = null;
        }
        
        set({
          user: null,
          session: null,
          readiness: 'loading',
          isAuthLoading: true,
          isInitializing: false,
          error: null,
          retryCount: 0
        });
      },

      // Simple state checker
      isReady: () => {
        return get().readiness === 'ready';
      }
    }),
    {
      name: 'unified-session-storage',
      partialize: (state) => ({
        user: state.user,
        session: state.session,
      }),
    }
  )
);

/**
 * Simple hook for components - replaces useAuth, useSessionValidator, etc.
 */
export const useSessionState = () => {
  const session = useUnifiedSession();
  
  return {
    user: session.user,
    session: session.session,
    readiness: session.readiness,
    isReady: session.isReady(),
    error: session.error,
    isLoading: session.isAuthLoading || session.readiness === 'loading',
    retry: session.retry
  };
};