import { useEffect } from 'react';

export const useOAuthDeepLink = () => {

  useEffect(() => {
    // Only run in native environment - absolutely safe check
    if (typeof window === 'undefined') return;
    
    const isNative = !!(window as any).Capacitor?.isNativePlatform();
    if (!isNative) return;
    
    // Rock-solid dynamic import with comprehensive error handling
    let cleanup: (() => void) | null = null;
    
    const setupOAuthListener = async () => {
      try {
        const { App } = await import('@capacitor/app');
        
        const handleDeepLink = async (data: { url: string }) => {
          if (!data?.url) return;
          
          const url = String(data.url);
          console.log('🔗 Deep link received:', url);

          // Only handle our OAuth callbacks
          if (!url.includes('com.fastnow.zenith://oauth/callback')) return;
          
          try {
            console.log('🔐 Processing OAuth callback...');
            
            // Ultra-safe URL parsing
            let accessToken = '';
            let refreshToken = '';
            
            // Try query parameters first
            const queryMatch = url.match(/\?(.+)/);
            if (queryMatch) {
              const params = new URLSearchParams(queryMatch[1]);
              accessToken = params.get('access_token') || '';
              refreshToken = params.get('refresh_token') || '';
            }
            
            // Try hash parameters if query didn't work
            if (!accessToken && !refreshToken) {
              const hashMatch = url.match(/#(.+)/);
              if (hashMatch) {
                const params = new URLSearchParams(hashMatch[1]);
                accessToken = params.get('access_token') || '';
                refreshToken = params.get('refresh_token') || '';
              }
            }
            
            if (accessToken && refreshToken) {
              // Dynamic import supabase to avoid circular dependencies
              const { supabase } = await import('@/integrations/supabase/client');
              
              const { data: sessionData, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
              });

              if (!error && sessionData?.session) {
                console.log('✅ OAuth callback successful, user signed in');
              } else {
                console.error('❌ OAuth session setup error:', error);
              }
            } else {
              console.log('⚠️ OAuth callback completed but no tokens found');
            }
            
          } catch (error) {
            console.error('❌ OAuth processing error:', error);
          }
        };

        const listener = await App.addListener('appUrlOpen', handleDeepLink);
        console.log('🔗 OAuth deep link listener registered');
        
        cleanup = () => {
          listener.remove();
          console.log('🔗 OAuth deep link listener removed');
        };
        
      } catch (error) {
        console.warn('Failed to setup OAuth listener:', error);
      }
    };
    
    setupOAuthListener();
    
    return () => {
      cleanup?.();
    };
  }, []);
};