import { useCallback } from 'react';
import { useDeepLinks } from './useDeepLinks';
import { supabase } from '@/integrations/supabase/client';


const OAUTH_SCHEME_PREFIX = 'com.fastnow.zenith://oauth/'; // must match manifest + Supabase

/**
 * Thin adapter: listens for our OAuth callback URL and calls exchangeCodeForSession.
 * Stays out of URL parsing business; lets Supabase do it.
 * Fixed to ensure consistent hook calling patterns.
 */
export function useSupabaseOAuthDeepLink(onDone?: (ok: boolean, error?: unknown) => void) {
  const onUrl = useCallback(async (url: string) => {
    // Only handle our OAuth callback - fast check first
    if (!url.startsWith(OAUTH_SCHEME_PREFIX)) {
      return;
    }
    
    console.log('🔐 OAuth callback received - immediate processing');
    
    // Quick validation of OAuth parameters before attempting exchange
    const hasCode = url.includes('code=');
    const hasState = url.includes('state=');
    
    if (!hasCode || !hasState) {
      console.error('❌ Invalid OAuth callback - missing code or state');
      onDone?.(false, new Error('Invalid OAuth parameters'));
      return;
    }
    
    // Check OAuth timing - warn if too much time has passed
    const oauthStartTime = (window as any).__oauthStartTime;
    if (oauthStartTime) {
      const timePassed = Date.now() - oauthStartTime;
      console.log('🔐 OAuth timing:', { timePassed: timePassed + 'ms' });
      
      if (timePassed > 30000) { // 30 seconds
        console.warn('⚠️ OAuth callback received after 30s - flow state may be expired');
      }
    }
    
    try {
      // Immediate session exchange - no delays
      const { data, error } = await supabase.auth.exchangeCodeForSession(url);
      
      if (error) {
        // Handle expired flow state - try to recover
        if (error.message?.includes('invalid flow state') || error.message?.includes('expired')) {
          console.log('🔄 Flow state expired - attempting session recovery');
          
          // Check if we already have a valid session
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session) {
            console.log('✅ Session recovered successfully');
            onDone?.(true);
            return;
          }
        }
        
        console.error('❌ OAuth session exchange failed:', error.message);
        onDone?.(false, error);
        return;
      }
      
      console.log('✅ OAuth session exchange successful');
      
      // Close browser immediately on success
      try {
        const { Browser } = await import('@capacitor/browser');
        await Browser.close();
      } catch (e) {
        // Browser might already be closed
      }
      
      onDone?.(true);
    } catch (e) {
      console.error('❌ OAuth processing error:', e instanceof Error ? e.message : 'Unknown error');
      onDone?.(false, e);
    }
  }, [onDone]);

  useDeepLinks(onUrl);
}