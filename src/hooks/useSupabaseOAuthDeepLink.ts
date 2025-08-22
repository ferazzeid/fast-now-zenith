import { useCallback } from 'react';
import { useDeepLinks } from './useDeepLinks';
import { supabase } from '@/integrations/supabase/client';

/**
 * Simplified OAuth deep link handler for both custom schemes and App Links.
 * Handles OAuth callbacks from both:
 * - com.fastnow.zenith://oauth/callback (custom scheme fallback)
 * - https://go.fastnow.app/oauth/callback (App Links)
 */
export function useSupabaseOAuthDeepLink(onDone?: (ok: boolean, error?: unknown) => void) {
  const onUrl = useCallback(async (url: string) => {
    // Check if this is an OAuth callback URL
    const isOAuthCallback = 
      url.includes('oauth/callback') || 
      url.includes('code=') && url.includes('state=');
    
    if (!isOAuthCallback) {
      return;
    }
    
    console.log('🔐 OAuth callback received:', url);
    
    try {
      // Let Supabase handle the OAuth callback
      const { data, error } = await supabase.auth.exchangeCodeForSession(url);
      
      if (error) {
        console.error('❌ OAuth session exchange failed:', error.message);
        onDone?.(false, error);
        return;
      }
      
      console.log('✅ OAuth session exchange successful');
      onDone?.(true);
    } catch (e) {
      console.error('❌ OAuth processing error:', e instanceof Error ? e.message : 'Unknown error');
      onDone?.(false, e);
    }
  }, [onDone]);

  useDeepLinks(onUrl);
}