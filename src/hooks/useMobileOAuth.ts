import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleSignInHandler } from '@/utils/GoogleSignInHandler';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UseMobileOAuthReturn {
  signInWithGoogle: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  cancelAuth: () => Promise<void>;
}

export const useMobileOAuth = (): UseMobileOAuthReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const googleSignInHandlerRef = useRef<GoogleSignInHandler | null>(null);

  // Initialize OAuth handler
  useEffect(() => {
    googleSignInHandlerRef.current = new GoogleSignInHandler();
    
    return () => {
      // Cleanup on unmount
      if (googleSignInHandlerRef.current) {
        googleSignInHandlerRef.current.cancelAuth().catch(error => {
          console.error('Error during cleanup:', error);
        });
      }
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!googleSignInHandlerRef.current) {
      console.error(`❌ [${new Date().toISOString()}] Google Sign-In handler not initialized`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`🔐 [${new Date().toISOString()}] Starting native Google Sign-In with GoogleSignInHandler`);
      
      const result = await googleSignInHandlerRef.current.signInWithGoogle();

      if (result.success) {
        console.log(`✅ [${new Date().toISOString()}] Native Google Sign-In completed successfully`);
        
        toast({
          title: "Welcome!",
          description: "Successfully signed in with Google.",
        });
      } else {
        console.error(`❌ [${new Date().toISOString()}] Native Google Sign-In failed:`, result.error);
        setError(result.error || 'Sign-in failed');
        toast({
          title: "Sign in failed",
          description: result.error || "Failed to sign in with Google. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`❌ [${new Date().toISOString()}] Native Google Sign-In error:`, errorMessage);
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

  const cancelAuth = useCallback(async () => {
    if (googleSignInHandlerRef.current) {
      try {
        await googleSignInHandlerRef.current.cancelAuth();
      } catch (error) {
        console.error('Error cancelling auth:', error);
      }
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