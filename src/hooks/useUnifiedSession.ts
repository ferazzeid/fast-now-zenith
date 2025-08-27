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
  | 'initializing'      // Auth is loading
  | 'authenticated'     // User signed in, database connection unverified
  | 'database-ready'    // Database connection confirmed, assets loading
  | 'fully-ready'       // All systems ready for operations
  | 'expired'           // Session needs refresh
  | 'invalid';          // User needs to sign in again

interface UnifiedSessionState {
  // Core session data
  user: User | null;
  session: Session | null;
  readiness: SessionReadiness;
  
  // State tracking
  isAuthLoading: boolean;
  isDatabaseConnected: boolean;
  areAssetsLoaded: boolean;
  
  // Error states
  error: string | null;
  retryCount: number;
  
  // Actions
  initialize: () => Promise<void>;
  testDatabaseConnection: () => Promise<void>;
  markDatabaseReady: () => void;
  markAssetsReady: () => void;
  setError: (error: string) => void;
  retry: () => void;
  reset: () => void;
  
  // Simple state checkers (replace all withValidSession usage)
  canPerformUserOperations: () => boolean;
  canPerformDatabaseOperations: () => boolean;
  isReady: () => boolean;
}

export const useUnifiedSession = create<UnifiedSessionState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      session: null,
      readiness: 'initializing',
      isAuthLoading: true,
      isDatabaseConnected: false,
      areAssetsLoaded: false,
      error: null,
      retryCount: 0,

      initialize: async () => {
        console.log('🔄 UnifiedSession: Initializing...');
        
        set({ 
          readiness: 'initializing', 
          isAuthLoading: true, 
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
                  isDatabaseConnected: false,
                  areAssetsLoaded: false,
                  error: null
                });
                return;
              }

              if (event === 'TOKEN_REFRESHED' && !session) {
                console.log('🔄 UnifiedSession: Token refresh failed');
                set({
                  readiness: 'expired',
                  error: 'Session expired'
                });
                return;
              }

              // For signed in users, progress to authenticated state
              if (session?.user) {
                console.log('🔄 UnifiedSession: User authenticated, checking database...');
                set({ readiness: 'authenticated' });
                
                // Test database connection
                setTimeout(async () => {
                  await get().testDatabaseConnection();
                }, 0);
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
            console.log('🔄 UnifiedSession: Initial session found, testing database...');
            set({ readiness: 'authenticated' });
            await get().testDatabaseConnection();
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
            isAuthLoading: false 
          });
        }
      },

      testDatabaseConnection: async () => {
        const state = get();
        if (!state.user) return;

        console.log('🔄 UnifiedSession: Testing database connection...');
        
        let retries = 3;
        let connected = false;

        while (retries > 0 && !connected) {
          try {
            // Simple database connectivity test
            const { error } = await supabase
              .from('profiles')
              .select('id')
              .eq('user_id', state.user.id)
              .limit(1);

            if (error && error.code !== 'PGRST116') { // Not a "not found" error
              throw error;
            }
            
            connected = true;
            console.log('🔄 UnifiedSession: Database connection successful');
            
            set({ 
              isDatabaseConnected: true,
              readiness: 'database-ready'
            });
            
            // Auto-progress to fully ready if assets are also ready
            if (state.areAssetsLoaded) {
              set({ readiness: 'fully-ready' });
            }
            
          } catch (error) {
            console.error(`🔄 UnifiedSession: Database test failed (${4 - retries}/3):`, error);
            retries--;
            
            if (retries > 0) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
              set({ 
                readiness: 'invalid',
                error: 'Database connection failed'
              });
            }
          }
        }
      },

      markDatabaseReady: () => {
        console.log('🔄 UnifiedSession: Database marked as ready');
        const state = get();
        set({ isDatabaseConnected: true });
        
        if (state.readiness === 'authenticated') {
          set({ readiness: 'database-ready' });
          
          // Auto-progress to fully ready if assets are also ready
          if (state.areAssetsLoaded) {
            set({ readiness: 'fully-ready' });
          }
        }
      },

      markAssetsReady: () => {
        console.log('🔄 UnifiedSession: Assets marked as ready');
        const state = get();
        set({ areAssetsLoaded: true });
        
        if (state.readiness === 'database-ready') {
          set({ readiness: 'fully-ready' });
          console.log('🔄 UnifiedSession: All systems ready!');
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
        set({
          user: null,
          session: null,
          readiness: 'initializing',
          isAuthLoading: true,
          isDatabaseConnected: false,
          areAssetsLoaded: false,
          error: null,
          retryCount: 0
        });
      },

      // Simple state checkers - replace all complex validation
      canPerformUserOperations: () => {
        const state = get();
        return state.readiness !== 'initializing' && 
               state.readiness !== 'invalid' && 
               !!state.user;
      },

      canPerformDatabaseOperations: () => {
        const state = get();
        return (state.readiness === 'database-ready' || 
                state.readiness === 'fully-ready') && 
               state.isDatabaseConnected;
      },

      isReady: () => {
        return get().readiness === 'fully-ready';
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
    canPerformUserOperations: session.canPerformUserOperations(),
    canPerformDatabaseOperations: session.canPerformDatabaseOperations(),
    error: session.error,
    isLoading: session.isAuthLoading || session.readiness === 'initializing',
    retry: session.retry
  };
};