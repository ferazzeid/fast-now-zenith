import { useCallback } from 'react';
import { useDeepLinks } from './useDeepLinks';
import { supabase } from '@/integrations/supabase/client';
import { useHookCallDebugger } from './useHookCallDebugger';

const OAUTH_SCHEME_PREFIX = 'com.fastnow.zenith://oauth/'; // must match manifest + Supabase

/**
 * Thin adapter: listens for our OAuth callback URL and calls exchangeCodeForSession.
 * Stays out of URL parsing business; lets Supabase do it.
 * Fixed to ensure consistent hook calling patterns.
 */
export function useSupabaseOAuthDeepLink(onDone?: (ok: boolean, error?: unknown) => void) {
  // Debug hook calls to catch inconsistencies
  useHookCallDebugger('useSupabaseOAuthDeepLink', 'all-hooks');
  const onUrl = useCallback(async (url: string) => {
    // Only handle our OAuth callback
    if (!url.startsWith(OAUTH_SCHEME_PREFIX)) return;
    try {
      console.log('🔐 Processing OAuth callback:', url);
      await supabase.auth.exchangeCodeForSession(url);
      console.log('✅ OAuth callback successful');
      onDone?.(true);
    } catch (e) {
      console.error('❌ OAuth processing error:', e);
      onDone?.(false, e);
    }
  }, [onDone]);

  useDeepLinks(onUrl);
}