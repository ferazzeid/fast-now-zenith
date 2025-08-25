import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { Capacitor } from '@capacitor/core';

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
        console.log('🔄 Processing OAuth callback...');
        
        const isNative = Capacitor.isNativePlatform();
        
        if (isNative) {
          // For native platforms, we should not reach this callback page
          // OAuth should be handled via deep links
          console.warn('⚠️ Native platform reached web callback - redirecting to auth');
          navigate('/auth');
          return;
        }
        
        // Web platform - get the session from the URL parameters
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ OAuth callback error:', error);
          toast({
            title: "Authentication Failed",
            description: error.message || "Failed to complete sign-in. Please try again.",
            variant: "destructive",
          });
          navigate('/auth');
          return;
        }

        if (data.session?.user) {
          console.log('✅ OAuth callback successful:', {
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
          console.warn('⚠️ OAuth callback completed but no session found');
          toast({
            title: "Authentication Incomplete",
            description: "Please try signing in again.",
            variant: "destructive",
          });
          navigate('/auth');
        }
      } catch (error) {
        console.error('❌ Unexpected error in OAuth callback:', error);
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