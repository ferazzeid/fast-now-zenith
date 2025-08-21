import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface AuthenticatedAppProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Wrapper that ensures stable auth state for child components
 * Prevents React #300 errors by providing consistent auth context
 */
export const AuthenticatedApp = ({ children, fallback }: AuthenticatedAppProps) => {
  const { user, loading } = useAuthContext();

  // Always render in the same pattern to maintain hook consistency
  if (loading) {
    return fallback || <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

interface PublicAppProps {
  children: ReactNode;
}

/**
 * Wrapper for public pages that don't require authentication
 * Still provides stable hook patterns
 */
export const PublicApp = ({ children }: PublicAppProps) => {
  const { user, loading } = useAuthContext();

  // Always render consistently 
  if (loading) {
    return <LoadingSpinner />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};