import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { LoadingRecovery } from '@/components/LoadingRecovery';


interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Simple redirect logic - if not loading and no user, redirect to auth
    if (!loading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, loading, navigate]);

  // Show loading while authenticating
  if (loading) {
    return <LoadingSpinner />;
  }

  // Don't render anything if no user (will redirect)
  if (!user) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;