import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Capacitor } from '@capacitor/core';

/**
 * Hook to handle OAuth deep link callbacks for mobile
 * Processes the OAuth URL using exchangeCodeForSession
 */
export function useOAuthDeepLink() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleOAuthCallback = useCallback(async (url: string) => {
    // Only handle OAuth callback URLs
    if (!url.includes('oauth/callback') || !url.includes('#')) {
      console.log('🔗 Deep link received but not OAuth callback:', url);
      return;
    }

    console.log('🔄 Processing OAuth deep link callback:', url);

    try {
      // Use exchangeCodeForSession for mobile OAuth completion
      const { data, error } = await supabase.auth.exchangeCodeForSession(url);
      
      if (error) {
        console.error('❌ OAuth deep link exchange failed:', error);
        toast({
          title: "Authentication Failed",
          description: error.message || "Failed to complete sign-in. Please try again.",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      if (data.session?.user) {
        console.log('✅ OAuth deep link successful:', {
          userId: data.session.user.id,
          email: data.session.user.email,
        });
        
        toast({
          title: "Welcome!",
          description: "Successfully signed in with Google.",
        });
        
        // Redirect to the main app
        navigate('/');
      } else {
        console.warn('⚠️ OAuth deep link completed but no session found');
        toast({
          title: "Authentication Incomplete",
          description: "Please try signing in again.",
          variant: "destructive",
        });
        navigate('/auth');
      }
    } catch (error) {
      console.error('❌ Unexpected error in OAuth deep link:', error);
      toast({
        title: "Authentication Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      navigate('/auth');
    }
  }, [navigate, toast]);

  return { handleOAuthCallback };
}