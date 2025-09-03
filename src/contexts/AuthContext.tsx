import React, { createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useAuthStore } from '@/stores/authStore';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthContextProviderProps {
  children: ReactNode;
}

export const AuthContextProvider = ({ children }: AuthContextProviderProps) => {
  // Always call the same hooks in the same order
  const user = useAuthStore(state => state.user);
  const session = useAuthStore(state => state.session);
  const loading = useAuthStore(state => state.loading);
  const signIn = useAuthStore(state => state.signIn);
  const signUp = useAuthStore(state => state.signUp);
  const signOut = useAuthStore(state => state.signOut);
  const signInWithGoogle = useAuthStore(state => state.signInWithGoogle);
  
  const resetPassword = useAuthStore(state => state.resetPassword);
  const updatePassword = useAuthStore(state => state.updatePassword);
  const initialize = useAuthStore(state => state.initialize);

  // Initialize authentication system on mount
  React.useEffect(() => {
    initialize();
  }, [initialize]);

  const value: AuthContextValue = {
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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthContextProvider');
  }
  return context;
};