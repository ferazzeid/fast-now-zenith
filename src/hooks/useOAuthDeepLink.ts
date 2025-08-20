import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export const useOAuthDeepLink = () => {
  const { toast } = useToast();

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      import('@capacitor/app')
        .then(({ App }) => {
          console.log('🔗 Setting up OAuth deep link handler for native app');

          const handleDeepLink = async (data: { url: string }) => {
            const { url } = data;
            console.log('🔗 Deep link received:', url);

            // Check if this is our OAuth callback
            if (url.startsWith('com.fastnow.zenith://oauth/callback')) {
              try {
                console.log('🔐 Processing OAuth callback...');
                
                // SAFE URL parsing - prevents crashes
                const urlParts = url.split('?');
                const queryString = urlParts.length > 1 ? urlParts[1] : '';
                const urlParams = new URLSearchParams(queryString);
                const accessToken = urlParams.get('access_token');
                const refreshToken = urlParams.get('refresh_token');
                
                console.log('🔗 Extracted tokens:', { 
                  hasAccessToken: !!accessToken, 
                  hasRefreshToken: !!refreshToken 
                });

                if (accessToken && refreshToken) {
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
                  // SAFE hash parsing - prevents crashes
                  const hashParts = url.split('#');
                  const hashString = hashParts.length > 1 ? hashParts[1] : '';
                  const hashParams = new URLSearchParams(hashString);
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

          App.addListener('appUrlOpen', handleDeepLink)
            .then((listener) => {
              console.log('🔗 OAuth deep link listener registered');
              
              return () => {
                listener.remove();
                console.log('🔗 OAuth deep link listener removed');
              };
            })
            .catch((error) => {
              console.error('❌ Failed to register deep link listener:', error);
            });
        })
        .catch((error) => {
          console.warn('Failed to load Capacitor App plugin:', error);
        });
    }
  }, [toast]);
};