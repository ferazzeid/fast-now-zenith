import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';

/**
 * Handles OAuth callback from Supabase for web/PWA Google Sign-In
 * This page processes the OAuth redirect and completes the authentication
 */
const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 Processing PKCE OAuth callback...');
        
        // For PKCE flow, we need to handle the authorization code exchange
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        
        if (code) {
          console.log('🔑 PKCE authorization code found, exchanging for session...');
          
          // The Supabase client will automatically handle the PKCE code exchange
          // when we call getSession() with detectSessionInUrl enabled
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('❌ PKCE code exchange failed:', error);
            toast({
              title: "Authentication Failed",
              description: error.message || "Failed to complete sign-in. Please try again.",
              variant: "destructive",
            });
            navigate('/auth');
            return;
          }

          if (data.session?.user) {
            console.log('✅ PKCE OAuth callback successful:', {
              userId: data.session.user.id,
              email: data.session.user.email,
              provider: data.session.user.app_metadata.provider
            });
            
            toast({
              title: "Welcome!",
              description: "Successfully signed in.",
            });
            
            // Clean URL and redirect
            window.history.replaceState({}, document.title, '/');
            navigate('/');
          } else {
            console.warn('⚠️ PKCE code exchange completed but no session found');
            toast({
              title: "Authentication Incomplete",
              description: "Please try signing in again.",
              variant: "destructive",
            });
            navigate('/auth');
          }
        } else {
          // Fallback: check for existing session
          console.log('🔍 No authorization code, checking for existing session...');
          const { data, error } = await supabase.auth.getSession();
          
          if (data.session?.user) {
            console.log('✅ Existing session found, redirecting...');
            navigate('/');
          } else {
            console.log('ℹ️ No session found, redirecting to auth...');
            navigate('/auth');
          }
        }
      } catch (error) {
        console.error('❌ Unexpected error in PKCE OAuth callback:', error);
        toast({
          title: "Authentication Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
        navigate('/auth');
      }
    };

    handleAuthCallback();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-accent/10 flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <LoadingSpinner />
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Completing sign-in...</h2>
          <p className="text-muted-foreground">
            Please wait while we finish setting up your account.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;