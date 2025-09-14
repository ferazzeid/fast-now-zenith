import { useAuthStore } from '@/stores/authStore';
import { useConnectionStore } from '@/stores/connectionStore';
import { useToast } from '@/hooks/use-toast';
import { useAuthCacheManager } from '@/hooks/useAuthCacheManager';
import { supabase } from '@/integrations/supabase/client';

export const useAuth = () => {
  // All hooks must be called consistently - no conditional hooks!
  const { toast } = useToast();
  const user = useAuthStore(state => state.user);
  const session = useAuthStore(state => state.session);
  const loading = useAuthStore(state => state.loading);
  const storeSignIn = useAuthStore(state => state.signIn);
  const storeSignUp = useAuthStore(state => state.signUp);
  const storeSignOut = useAuthStore(state => state.signOut);
  const storeSignInWithGoogle = useAuthStore(state => state.signInWithGoogle);
  const storeResetPassword = useAuthStore(state => state.resetPassword);
  const storeUpdatePassword = useAuthStore(state => state.updatePassword);
  const { isOnline } = useConnectionStore();
  const { clearAllAuthCaches, refreshAuthData } = useAuthCacheManager();

  // Enhanced auth methods with session recovery and better error handling
  const signIn = async (email: string, password: string) => {
    const operation = async () => {
      const result = await storeSignIn(email, password);
      
      if (result.error) {
        toast({
          title: "Sign In Failed",
          description: result.error.message,
          variant: "destructive",
        });
      } else {
        // Clear old caches and refresh auth data on successful sign in
        clearAllAuthCaches();
        setTimeout(() => {
          if (user?.id) {
            refreshAuthData(user.id);
          }
        }, 100);
        
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
      }
      
      return result;
    };

    try {
      return await operation();
    } catch (error) {
      if (!isOnline || (error as any)?.message?.includes('fetch')) {
        toast({
          title: "Connection issue",
          description: "Please check your internet connection and try again.",
          variant: "destructive",
        });
      }
      return { error };
    }
  };

  const signUp = async (email: string, password: string) => {
    const operation = async () => {
      const result = await storeSignUp(email, password);
      
      if (result.error) {
        toast({
          title: "Sign Up Failed",
          description: result.error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Account Created!",
          description: "Please check your email to verify your account.",
        });
      }
      
      return result;
    };

    try {
      return await operation();
    } catch (error) {
      if (!isOnline || (error as any)?.message?.includes('fetch')) {
        toast({
          title: "Connection issue",
          description: "Please check your internet connection and try again.",
          variant: "destructive",
        });
      }
      return { error };
    }
  };

  const signInWithGoogle = async () => {
    // OAuth redirects work independently of our connection monitoring
    const result = await storeSignInWithGoogle();
    
    if (result.error) {
      toast({
        title: "Google Sign In Failed",
        description: result.error.message,
        variant: "destructive",
      });
    }
    
    return result;
  };

  const resetPassword = async (email: string) => {
    const operation = async () => {
      const result = await storeResetPassword(email);
      
      if (result.error) {
        toast({
          title: "Password Reset Failed",
          description: result.error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Reset Link Sent",
          description: "Check your email for a password reset link.",
        });
      }
      
      return result;
    };

    try {
      return await operation();
    } catch (error) {
      if (!isOnline || (error as any)?.message?.includes('fetch')) {
        toast({
          title: "Connection issue",
          description: "Please check your internet connection and try again.",
          variant: "destructive",
        });
      }
      return { error };
    }
  };

  const updatePassword = async (password: string) => {
    const operation = async () => {
      const result = await storeUpdatePassword(password);
      
      if (result.error) {
        toast({
          title: "Password Update Failed",
          description: result.error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Password Updated",
          description: "Your password has been successfully updated.",
        });
      }
      
      return result;
    };

    try {
      return await operation();
    } catch (error) {
      if (!isOnline || (error as any)?.message?.includes('fetch')) {
        toast({
          title: "Connection issue",
          description: "Please check your internet connection and try again.",
          variant: "destructive",
        });
      }
      return { error };
    }
  };

  const signOut = async () => {
    const operation = async () => {
      // Clear all caches before signing out
      clearAllAuthCaches();
      
      const result = await storeSignOut();
      
      // Always show success since the authStore handles errors gracefully
      // and clears local state regardless of server response
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
      
      return result;
    };

    // Always allow sign out, even offline or during loading states
    // This ensures sign-out works regardless of app state
    return await operation();
  };

  // Simple session validation
  const checkSessionHealth = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        console.warn('Session health check failed:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Session health check error:', error);
      return false;
    }
  };

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    resetPassword,
    updatePassword,
    checkSessionHealth,
  };
};