import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    console.log('DEBUG: Auth initialization started, loading:', loading);

    // Check for cached session first to eliminate flash
    const cachedSession = localStorage.getItem('supabase.auth.token');
    const cachedExpiry = localStorage.getItem('supabase.auth.expiry');
    const cachedUser = localStorage.getItem('supabase.auth.user');
    
    if (cachedSession && cachedExpiry && cachedUser && new Date().getTime() < parseInt(cachedExpiry)) {
      // Use cached session and set user immediately to prevent redirect
      try {
        const userData = JSON.parse(cachedUser);
        console.log('DEBUG: Using cached session, setting user immediately to prevent redirect');
        setUser(userData);
        setSession({ 
          access_token: cachedSession, 
          expires_at: parseInt(cachedExpiry) / 1000,
          user: userData 
        } as Session);
        // Don't set loading to false yet - we'll do that after showing loading screen
      } catch (error) {
        // If cache is corrupted, continue with normal flow
        console.warn('Cache corrupted, proceeding with normal auth flow');
      }
    } else {
      console.log('DEBUG: No valid cache found, will show loading screen');
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Always show loading screen for minimum time for better UX
        setTimeout(() => {
          setLoading(false);
        }, 800);
        
        // Cache session info for faster subsequent loads
        if (session) {
          localStorage.setItem('supabase.auth.token', session.access_token);
          localStorage.setItem('supabase.auth.expiry', (session.expires_at! * 1000).toString());
          localStorage.setItem('supabase.auth.user', JSON.stringify(session.user));
        } else {
          localStorage.removeItem('supabase.auth.token');
          localStorage.removeItem('supabase.auth.expiry');
          localStorage.removeItem('supabase.auth.user');
        }
      }
    });

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
          
          // Update cache
          if (session) {
            localStorage.setItem('supabase.auth.token', session.access_token);
            localStorage.setItem('supabase.auth.expiry', (session.expires_at! * 1000).toString());
            localStorage.setItem('supabase.auth.user', JSON.stringify(session.user));
          } else {
            localStorage.removeItem('supabase.auth.token');
            localStorage.removeItem('supabase.auth.expiry');
            localStorage.removeItem('supabase.auth.user');
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "Sign In Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
    }

    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });

    if (error) {
      toast({
        title: "Sign Up Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Account Created!",
        description: "Please check your email to verify your account.",
      });
    }

    return { error };
  };

  const signInWithGoogle = async () => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl
      }
    });

    if (error) {
      toast({
        title: "Google Sign In Failed",
        description: error.message,
        variant: "destructive",
      });
    }

    return { error };
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/update-password`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });

    if (error) {
      toast({
        title: "Password Reset Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Reset Link Sent",
        description: "Check your email for a password reset link.",
      });
    }

    return { error };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      toast({
        title: "Password Update Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Password Updated",
        description: "Your password has been successfully updated.",
      });
    }

    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      toast({
        title: "Sign Out Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    resetPassword,
    updatePassword,
  };

  // Don't show loading screen here - let ProtectedRoute handle it
  // This prevents double loading screens

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};