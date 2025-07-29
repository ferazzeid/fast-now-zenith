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

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Show proper loading spinner while checking auth
  if (loading) {
    return <LoadingSpinner />;
  }

  // If no user, show loading spinner briefly while navigating to avoid flash
  if (!user) {
    return <LoadingSpinner />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;