import { supabase } from '@/integrations/supabase/client';

interface OAuthState {
  timestamp: number;
  inProgress: boolean;
  provider: string;
}

const OAUTH_STATE_KEY = 'oauth_recovery_state';
const OAUTH_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export const checkOAuthRecovery = async (): Promise<void> => {
  try {
    console.log('[OAuth Recovery] Checking for stale OAuth state...');
    
    const stateJson = localStorage.getItem(OAUTH_STATE_KEY);
    if (!stateJson) {
      console.log('[OAuth Recovery] No OAuth state found');
      return;
    }

    const state: OAuthState = JSON.parse(stateJson);
    const now = Date.now();
    const elapsed = now - state.timestamp;

    console.log('[OAuth Recovery] Found OAuth state:', {
      provider: state.provider,
      inProgress: state.inProgress,
      elapsed: `${elapsed}ms`,
      timeout: `${OAUTH_TIMEOUT_MS}ms`
    });

    // Clear state regardless of whether we try recovery
    localStorage.removeItem(OAUTH_STATE_KEY);

    // If OAuth was in progress recently (< 5 minutes), try session recovery
    if (state.inProgress && elapsed < OAUTH_TIMEOUT_MS) {
      console.log('[OAuth Recovery] Attempting session recovery...');
      
      // Try to get current session with retries
      let retries = 3;
      while (retries > 0) {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.warn('[OAuth Recovery] Session check failed:', error.message);
            retries--;
            if (retries > 0) {
              await new Promise(resolve => setTimeout(resolve, 1000));
              continue;
            }
            break;
          }

          if (session) {
            console.log('[OAuth Recovery] Session recovered successfully!', {
              userId: session.user?.id,
              provider: session.user?.app_metadata?.provider
            });
            return;
          } else {
            console.log('[OAuth Recovery] No session found during recovery');
            break;
          }
        } catch (recoveryError) {
          console.error('[OAuth Recovery] Session recovery attempt failed:', recoveryError);
          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
    } else if (elapsed >= OAUTH_TIMEOUT_MS) {
      console.log('[OAuth Recovery] OAuth state expired, clearing');
    } else {
      console.log('[OAuth Recovery] OAuth was not in progress');
    }
  } catch (error) {
    console.error('[OAuth Recovery] Error during recovery check:', error);
    // Ensure we clear the state even if there's an error
    localStorage.removeItem(OAUTH_STATE_KEY);
  }
};