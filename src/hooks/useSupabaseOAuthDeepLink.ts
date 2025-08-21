import { useCallback, useRef, useEffect } from 'react';
import { useDeepLinks } from './useDeepLinks';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const OAUTH_SCHEME_PREFIX = 'com.fastnow.zenith://oauth/'; // must match manifest + Supabase
const OAUTH_TIMEOUT = 30000; // 30 seconds

interface OAuthResult {
  success: boolean;
  error?: unknown;
  timeout?: boolean;
}

/**
 * Enhanced OAuth deep link handler with session polling fallback and user feedback.
 * Provides comprehensive error handling and timeout management.
 */
export function useSupabaseOAuthDeepLink(onDone?: (result: OAuthResult) => void) {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const isProcessingRef = useRef(false);
  const sessionPollingRef = useRef<NodeJS.Timeout>();

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (sessionPollingRef.current) clearInterval(sessionPollingRef.current);
    };
  }, []);

  // Start session polling fallback
  const startSessionPolling = useCallback(() => {
    let attempts = 0;
    const maxAttempts = 60; // Poll for 30 seconds (60 * 500ms)
    
    console.log('🔄 Starting OAuth session polling fallback');
    
    sessionPollingRef.current = setInterval(async () => {
      attempts++;
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && !isProcessingRef.current) {
          console.log('✅ OAuth session detected via polling');
          clearInterval(sessionPollingRef.current!);
          clearTimeout(timeoutRef.current!);
          isProcessingRef.current = true;
          
          toast.success('Successfully signed in!');
          onDone?.({ success: true });
          return;
        }
      } catch (error) {
        console.error('❌ Error during session polling:', error);
      }
      
      if (attempts >= maxAttempts) {
        console.log('⏰ Session polling timeout reached');
        clearInterval(sessionPollingRef.current!);
        clearTimeout(timeoutRef.current!);
        
        if (!isProcessingRef.current) {
          isProcessingRef.current = true;
          toast.error('Sign in timed out. Please try again.');
          onDone?.({ success: false, timeout: true });
        }
      }
    }, 500);
  }, [onDone]);

  const onUrl = useCallback(async (url: string) => {
    // Only handle our OAuth callback
    if (!url.startsWith(OAUTH_SCHEME_PREFIX)) return;
    
    if (isProcessingRef.current) {
      console.log('🔄 OAuth already processing, ignoring duplicate callback');
      return;
    }
    
    isProcessingRef.current = true;
    
    // Clear any existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (sessionPollingRef.current) clearInterval(sessionPollingRef.current);
    
    try {
      console.log('🔐 Processing OAuth callback:', url.replace(/code=[^&]+/, 'code=***'));
      
      const { data, error } = await supabase.auth.exchangeCodeForSession(url);
      
      if (error) throw error;
      
      console.log('✅ OAuth callback successful', data?.session ? 'with session' : 'without session');
      toast.success('Successfully signed in!');
      onDone?.({ success: true });
      
    } catch (e) {
      console.error('❌ OAuth processing error:', e);
      toast.error('Sign in failed. Please try again.');
      onDone?.({ success: false, error: e });
    } finally {
      isProcessingRef.current = false;
    }
  }, [onDone]);

  // Set up OAuth timeout and start session polling when OAuth is initiated
  const initializeOAuth = useCallback(() => {
    console.log('🚀 Initializing OAuth flow');
    isProcessingRef.current = false;
    
    // Set timeout for OAuth completion
    timeoutRef.current = setTimeout(() => {
      if (!isProcessingRef.current) {
        console.log('⏰ OAuth timeout reached');
        isProcessingRef.current = true;
        
        if (sessionPollingRef.current) clearInterval(sessionPollingRef.current);
        
        toast.error('Sign in timed out. Please try again.');
        onDone?.({ success: false, timeout: true });
      }
    }, OAUTH_TIMEOUT);
    
    // Start session polling as fallback
    startSessionPolling();
  }, [onDone, startSessionPolling]);

  useDeepLinks(onUrl);
  
  return { initializeOAuth };
}