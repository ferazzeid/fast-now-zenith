import { useAuthStore } from '@/stores/authStore';
import { useConnectionStore } from '@/stores/connectionStore';
import { useToast } from '@/hooks/use-toast';
import { useAuthCacheManager } from '@/hooks/useAuthCacheManager';

export const useAuth = () => {
  const { toast } = useToast();
  const authState = useAuthStore();
  const { isOnline } = useConnectionStore();
  const { clearAllAuthCaches, refreshAuthData } = useAuthCacheManager();

  // Enhanced auth methods with session recovery and better error handling
  const signIn = async (email: string, password: string) => {
    const operation = async () => {
      const result = await authState.signIn(email, password);
      
      if (result.error) {
        // Check if it's a session-related error
        if (result.error.message?.includes('session') || result.error.message?.includes('token')) {
          // Attempt session recovery
          const recovered = await authState.recoverSession();
          if (recovered) {
            toast({
              title: "Session Recovered",
              description: "Your session has been restored.",
            });
            return { error: null };
          }
        }
        
        toast({
          title: "Sign In Failed",
          description: result.error.message,
          variant: "destructive",
        });
      } else {
        // Clear old caches and refresh auth data on successful sign in
        clearAllAuthCaches();
        setTimeout(() => {
          if (authState.user?.id) {
            refreshAuthData(authState.user.id);
          }
        }, 100);
        
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
      }
      
      return result;
    };

    if (isOnline) {
      return await operation();
    } else {
      toast({
        title: "No connection",
        description: "Please check your internet connection and try again.",
        variant: "destructive",
      });
      return { error: new Error("No connection") };
    }
  };

  const signUp = async (email: string, password: string) => {
    const operation = async () => {
      const result = await authState.signUp(email, password);
      
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

    if (isOnline) {
      return await operation();
    } else {
      toast({
        title: "No connection",
        description: "Please check your internet connection and try again.",
        variant: "destructive",
      });
      return { error: new Error("No connection") };
    }
  };

  const signInWithGoogle = async () => {
    // OAuth redirects work independently of our connection monitoring
    const result = await authState.signInWithGoogle();
    
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
      const result = await authState.resetPassword(email);
      
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

    if (isOnline) {
      return await operation();
    } else {
      toast({
        title: "No connection",
        description: "Please check your internet connection and try again.",
        variant: "destructive",
      });
      return { error: new Error("No connection") };
    }
  };

  const updatePassword = async (password: string) => {
    const operation = async () => {
      const result = await authState.updatePassword(password);
      
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

    if (isOnline) {
      return await operation();
    } else {
      toast({
        title: "No connection",
        description: "Please check your internet connection and try again.",
        variant: "destructive",
      });
      return { error: new Error("No connection") };
    }
  };

  const signOut = async () => {
    const operation = async () => {
      // Clear all caches before signing out
      clearAllAuthCaches();
      
      const result = await authState.signOut();
      
      if (result?.error) {
        toast({
          title: "Sign Out Failed",
          description: result.error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Signed Out",
          description: "You have been successfully signed out.",
        });
      }
    };

    // Always allow sign out, even offline
    return await operation();
  };

  // Session health monitoring
  const checkSessionHealth = async () => {
    if (!authState.session) return false;
    
    const now = Date.now();
    const lastCheck = authState.lastSessionCheck;
    
    // Check session health every 5 minutes
    if (now - lastCheck > 5 * 60 * 1000) {
      return await authState.recoverSession();
    }
    
    return true;
  };

  return {
    user: authState.user,
    session: authState.session,
    loading: authState.loading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    resetPassword,
    updatePassword,
    checkSessionHealth,
    recoverSession: authState.recoverSession,
    forceRefreshSession: authState.forceRefreshSession,
    isRecoveringSession: authState.isRecoveringSession,
  };
};