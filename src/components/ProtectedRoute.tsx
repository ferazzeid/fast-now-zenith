import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { LoadingScreen } from '@/components/LoadingScreen';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const { initialized } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect if auth is fully initialized AND there's no user
    if (initialized && !loading && !user) {
      console.log('🔐 No authenticated user, redirecting to auth...');
      navigate('/auth', { replace: true });
    }
  }, [user, loading, initialized, navigate]);

  // Show loading screen while authentication is resolving
  if (!initialized || loading) {
    return <LoadingScreen message="Checking authentication..." />;
  }

  // If auth is initialized but no user, let the useEffect handle redirect
  if (!user) {
    return <LoadingScreen message="Redirecting to login..." />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;