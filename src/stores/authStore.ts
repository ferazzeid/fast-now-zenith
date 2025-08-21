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
  
  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      loading: true,

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
            (event, session) => {
              authLogger.info(`Auth state changed: ${event}`, { 
                hasSession: !!session, 
                userId: session?.user?.id,
                email: session?.user?.email 
              });
              
              set({
                session,
                user: session?.user ?? null,
                loading: false,
              });
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
        // Enhanced native detection - force native mode in production
        const isNative = typeof window !== 'undefined' && (
          (window as any).__IS_NATIVE_APP__ || 
          (window as any).Capacitor?.isNativePlatform?.() === true ||
          window.location.protocol === 'capacitor:' ||
          window.location.protocol === 'file:' ||
          document.documentElement.getAttribute('data-build-type') === 'aab' ||
          navigator.userAgent.includes('wv') ||
          process.env.NODE_ENV === 'production'
        );
        
        authLogger.info('Google OAuth starting', { 
          isNative, 
          timestamp: new Date().toISOString(),
          currentSession: !!get().session
        });

        if (isNative) {
          try {
            // Mobile: Use skipBrowserRedirect and open external browser
            authLogger.info('Initiating mobile OAuth flow');
            
            const { data, error } = await supabase.auth.signInWithOAuth({
              provider: 'google',
              options: {
                redirectTo: 'com.fastnow.zenith://oauth/callback',
                skipBrowserRedirect: true,
                queryParams: {
                  access_type: 'offline',
                  prompt: 'consent'
                }
              }
            });

            if (error) {
              authLogger.error('Google OAuth initiation failed:', error);
              return { error };
            }

            if (data?.url) {
              authLogger.info('Opening browser for Google OAuth', { 
                url: data.url,
                timestamp: new Date().toISOString()
              });
              
              // Store OAuth start time for timeout tracking
              (window as any).__oauthStartTime = Date.now();
              
              const { Browser } = await import('@capacitor/browser');
              await Browser.open({ 
                url: data.url,
                windowName: '_system'
              });
              
              authLogger.info('Browser opened successfully for OAuth');
              
              // Enhanced session polling with faster detection
              let sessionPollingInterval: NodeJS.Timeout;
              let pollCount = 0;
              const maxPolls = 60; // Poll for 60 seconds
              const pollFrequency = 500; // Poll every 500ms for faster detection
              
              const startPolling = () => {
                authLogger.info('Starting enhanced OAuth session polling');
                
                sessionPollingInterval = setInterval(async () => {
                  pollCount++;
                  
                  try {
                    const { data: sessionData } = await supabase.auth.getSession();
                    if (sessionData?.session) {
                      authLogger.info('✅ Session detected via polling - OAuth successful!');
                      clearInterval(sessionPollingInterval);
                      
                      // Close browser immediately
                      try {
                        await Browser.close();
                        authLogger.info('Browser closed after successful OAuth');
                      } catch (e) {
                        // Browser might already be closed
                      }
                      
                      // Clear OAuth timing
                      delete (window as any).__oauthStartTime;
                      return;
                    }
                  } catch (e) {
                    // Silent polling - only log critical errors
                  }
                  
                  if (pollCount >= maxPolls) {
                    authLogger.warn('OAuth session polling timeout - cleaning up');
                    clearInterval(sessionPollingInterval);
                    delete (window as any).__oauthStartTime;
                  }
                }, pollFrequency);
              };
              
              // Start polling immediately for faster detection
              setTimeout(startPolling, 1000);
              
            } else {
              authLogger.error('No OAuth URL returned from Supabase');
              return { error: new Error('No OAuth URL returned') };
            }
            
            return { error: null };
            
          } catch (browserError) {
            authLogger.error('Browser opening failed:', browserError);
            return { error: browserError };
          }
        } else {
          // Web: Let Supabase handle the redirect naturally in same window
          authLogger.info('Initiating web OAuth flow');
          
          // Force HTTPS redirect URL for production
          const redirectOrigin = window.location.protocol === 'https:' 
            ? window.location.origin 
            : 'https://de91d618-edcf-40eb-8e11-7c45904095be.lovableproject.com';
          
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: `${redirectOrigin}/`,
              queryParams: {
                access_type: 'offline',
                prompt: 'consent'
              }
            }
          });

          if (error) {
            authLogger.error('Google OAuth initiation failed:', error);
          } else {
            authLogger.info('Web OAuth redirect initiated');
          }
          return { error };
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