import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/LoadingSpinner';


interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  console.log('🔒 ProtectedRoute state:', { hasUser: !!user, loading });

  useEffect(() => {
    if (!loading && !user) {
      console.log('🔒 No user, navigating to auth');
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