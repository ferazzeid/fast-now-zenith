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
    console.log('🔗 Deep link received:', url);
    
    // Only handle our OAuth callback
    if (!url.startsWith(OAUTH_SCHEME_PREFIX)) {
      console.log('🔗 Ignoring non-OAuth deep link:', url);
      return;
    }
    
    console.log('🔐 OAuth callback detected - starting session exchange');
    console.log('🔐 Callback URL details:', { 
      url, 
      hasCode: url.includes('code='),
      hasState: url.includes('state='),
      timestamp: new Date().toISOString()
    });
    
    try {
      const startTime = Date.now();
      
      // Exchange the OAuth callback for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(url);
      
      const duration = Date.now() - startTime;
      console.log('🔐 Session exchange completed in', duration + 'ms');
      
      if (error) {
        console.error('❌ OAuth session exchange failed:', error);
        onDone?.(false, error);
        return;
      }
      
      console.log('✅ OAuth session exchange successful:', {
        hasSession: !!data?.session,
        hasUser: !!data?.user,
        userId: data?.user?.id,
        email: data?.user?.email
      });
      
      onDone?.(true);
    } catch (e) {
      console.error('❌ OAuth processing error:', e);
      console.error('❌ Error details:', {
        message: e instanceof Error ? e.message : 'Unknown error',
        stack: e instanceof Error ? e.stack : undefined,
        url
      });
      onDone?.(false, e);
    }
  }, [onDone]);

  useDeepLinks(onUrl);
}