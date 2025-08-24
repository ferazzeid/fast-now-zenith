import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const OAuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        console.log('🔄 OAuth callback page loaded');
        
        // Get the current URL which contains the OAuth response
        const currentUrl = window.location.href;
        
        // Exchange the code for a session
        const { data, error } = await supabase.auth.exchangeCodeForSession(currentUrl);

        if (error) {
          console.error('❌ OAuth session exchange failed:', error.message);
          toast({
            title: "Sign in failed",
            description: error.message || "Failed to complete sign in. Please try again.",
            variant: "destructive",
          });
          navigate('/auth');
          return;
        }

        if (data.session?.user?.id) {
          console.log('✅ OAuth session exchanged successfully:', {
            userId: data.session.user.id,
            email: data.session.user.email
          });
          
          toast({
            title: "Welcome!",
            description: "Successfully signed in with Google.",
          });
          
          navigate('/');
        } else {
          console.error('❌ Session exchange returned no valid session');
          toast({
            title: "Sign in failed",
            description: "Session exchange failed. Please try again.",
            variant: "destructive",
          });
          navigate('/auth');
        }
      } catch (error) {
        console.error('❌ OAuth callback processing error:', error);
        toast({
          title: "Sign in error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
        navigate('/auth');
      }
    };

    handleOAuthCallback();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-4 text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
};

export default OAuthCallback;