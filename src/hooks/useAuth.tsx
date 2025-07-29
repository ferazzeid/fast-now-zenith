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
  // Check for cached session synchronously to set initial state
  const getInitialAuthState = () => {
    const cachedSession = localStorage.getItem('supabase.auth.token');
    const cachedExpiry = localStorage.getItem('supabase.auth.expiry');
    const cachedUser = localStorage.getItem('supabase.auth.user');
    
    if (cachedSession && cachedExpiry && cachedUser && new Date().getTime() < parseInt(cachedExpiry)) {
      try {
        const userData = JSON.parse(cachedUser);
        return {
          user: userData,
          session: { 
            access_token: cachedSession, 
            expires_at: parseInt(cachedExpiry) / 1000,
            user: userData 
          } as Session,
          loading: false // No loading needed if we have cached session
        };
      } catch (error) {
        console.warn('Cached session corrupted, using default state');
      }
    }
    
    return {
      user: null,
      session: null,
      loading: true
    };
  };

  console.log('AuthProvider: Getting initial auth state');
  const initialState = getInitialAuthState();
  console.log('AuthProvider: Initial state:', initialState);
  const [user, setUser] = useState<User | null>(initialState.user);
  const [session, setSession] = useState<Session | null>(initialState.session);
  const [loading, setLoading] = useState(initialState.loading);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener first
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

    // Get current session to sync with Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
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
    });

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