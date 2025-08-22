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
    
    console.log('🔐 Mobile OAuth callback received:', url);
    
    try {
      let processedUrl = url;
      
      // Convert custom scheme URL to HTTPS format for Supabase
      if (url.startsWith('com.fastnow.zenith://oauth/callback')) {
        console.log('🔄 Converting custom scheme URL to HTTPS format');
        
        // Extract parameters from custom scheme URL
        const urlObj = new URL(url);
        const searchParams = urlObj.searchParams;
        
        // Convert to HTTPS format that Supabase expects
        processedUrl = `https://go.fastnow.app/oauth/callback?${searchParams.toString()}`;
        console.log('✅ Converted URL:', processedUrl);
      }
      
      // Let Supabase handle the OAuth callback with the processed URL
      const { data, error } = await supabase.auth.exchangeCodeForSession(processedUrl);
      
      if (error) {
        console.error('❌ Mobile OAuth session exchange failed:', error.message);
        console.error('❌ Failed URL:', processedUrl);
        onDone?.(false, error);
        return;
      }
      
      console.log('✅ Mobile OAuth session exchange successful, user:', data.user?.email);
      console.log('🔍 Mobile session details:', {
        hasSession: !!data.session,
        hasUser: !!data.user,
        accessToken: data.session?.access_token?.substring(0, 20) + '...'
      });
      onDone?.(true);
    } catch (e) {
      console.error('❌ Mobile OAuth processing error:', e instanceof Error ? e.message : 'Unknown error');
      console.error('❌ Original URL:', url);
      onDone?.(false, e);
    }
  }, [onDone]);

  useDeepLinks(onUrl);
}