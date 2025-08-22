import { useState, useCallback, useRef, useEffect } from 'react';
import { MobileOAuthHandler } from '@/utils/MobileOAuthHandler';
import { useToast } from '@/hooks/use-toast';

interface UseMobileOAuthReturn {
  signInWithGoogle: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  cancelAuth: () => void;
}

export const useMobileOAuth = (): UseMobileOAuthReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const oauthHandlerRef = useRef<MobileOAuthHandler | null>(null);

  // Initialize OAuth handler
  useEffect(() => {
    oauthHandlerRef.current = new MobileOAuthHandler();
    
    return () => {
      // Cleanup on unmount
      if (oauthHandlerRef.current) {
        oauthHandlerRef.current.cancelAuth();
      }
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!oauthHandlerRef.current) {
      console.error('❌ OAuth handler not initialized');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔐 Starting Google OAuth with mobile handler');
      
      const result = await oauthHandlerRef.current.signInWithGoogle();

      if (result.success) {
        console.log('✅ Google OAuth successful');
        toast({
          title: "Welcome!",
          description: "Successfully signed in with Google.",
        });
      } else {
        console.error('❌ Google OAuth failed:', result.error);
        setError(result.error || 'OAuth failed');
        toast({
          title: "Sign in failed",
          description: result.error || "Failed to sign in with Google. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ OAuth error:', errorMessage);
      setError(errorMessage);
      toast({
        title: "Sign in error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const cancelAuth = useCallback(() => {
    if (oauthHandlerRef.current) {
      oauthHandlerRef.current.cancelAuth();
      setIsLoading(false);
      setError(null);
    }
  }, []);

  return {
    signInWithGoogle,
    isLoading,
    error,
    cancelAuth,
  };
};