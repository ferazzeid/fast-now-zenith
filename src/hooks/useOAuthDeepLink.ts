import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

/**
 * Hook to handle OAuth deep links for native app
 * Processes the auth callback from Google OAuth flow
 */
export const useOAuthDeepLink = () => {
  const { toast } = useToast();

  useEffect(() => {
    // Only run in Capacitor environment
    const isCapacitor = typeof window !== 'undefined' && (
      (window as any).Capacitor?.isNativePlatform?.() ||
      window.location.protocol === 'capacitor:' ||
      window.navigator.userAgent.includes('FastNowApp')
    );

    if (!isCapacitor) {
      return;
    }

    console.log('🔗 Setting up OAuth deep link handler for native app');

    const handleDeepLink = async (data: { url: string }) => {
      const { url } = data;
      console.log('🔗 Deep link received:', url);

      // Check if this is our OAuth callback
      if (url.startsWith('com.fastnow.zenith://auth-callback')) {
        try {
          console.log('🔐 Processing OAuth callback...');
          
          // For Supabase OAuth callback URLs, we need to extract tokens from the URL
          // and then set the session manually
          const urlParams = new URLSearchParams(url.split('?')[1] || url.split('#')[1] || '');
          const accessToken = urlParams.get('access_token');
          const refreshToken = urlParams.get('refresh_token');
          
          console.log('🔗 Extracted tokens:', { 
            hasAccessToken: !!accessToken, 
            hasRefreshToken: !!refreshToken 
          });

          if (accessToken && refreshToken) {
            // Set the session with the extracted tokens
            const { data: sessionData, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });

            if (error) {
              console.error('❌ OAuth session setup error:', error);
              toast({
                title: "Sign-in Error",
                description: "Failed to complete Google sign-in. Please try again.",
                variant: "destructive",
              });
              return;
            }

            if (sessionData?.session) {
              console.log('✅ OAuth callback successful, user signed in');
              toast({
                title: "Welcome!",
                description: "Successfully signed in with Google.",
              });
            }
          } else {
            // Try alternative parsing for hash-based URLs
            const hashParams = new URLSearchParams(url.split('#')[1] || '');
            const hashAccessToken = hashParams.get('access_token');
            const hashRefreshToken = hashParams.get('refresh_token');
            
            if (hashAccessToken && hashRefreshToken) {
              const { data: sessionData, error } = await supabase.auth.setSession({
                access_token: hashAccessToken,
                refresh_token: hashRefreshToken
              });

              if (error) {
                console.error('❌ OAuth hash session setup error:', error);
                toast({
                  title: "Sign-in Error",
                  description: "Failed to complete Google sign-in. Please try again.",
                  variant: "destructive",
                });
                return;
              }

              if (sessionData?.session) {
                console.log('✅ OAuth hash callback successful, user signed in');
                toast({
                  title: "Welcome!",
                  description: "Successfully signed in with Google.",
                });
              }
            } else {
              console.log('⚠️ OAuth callback completed but no tokens found in URL');
              toast({
                title: "Sign-in Notice",
                description: "Google sign-in completed but session could not be established.",
                variant: "default",
              });
            }
          }

        } catch (error) {
          console.error('❌ OAuth deep link processing error:', error);
          toast({
            title: "Sign-in Error", 
            description: "Failed to process Google sign-in. Please try again.",
            variant: "destructive",
          });
        }
      }
    };

    // Add the deep link listener and handle promise
    let listenerHandle: any = null;
    
    const setupListener = async () => {
      try {
        listenerHandle = await App.addListener('appUrlOpen', handleDeepLink);
        console.log('🔗 OAuth deep link listener registered');
      } catch (error) {
        console.error('❌ Failed to register deep link listener:', error);
      }
    };

    setupListener();

    return () => {
      if (listenerHandle?.remove) {
        listenerHandle.remove();
        console.log('🔗 OAuth deep link listener removed');
      }
    };
  }, [toast]);
};