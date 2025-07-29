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
  
  console.log('ProtectedRoute: user =', !!user, 'loading =', loading);

  useEffect(() => {
    console.log('ProtectedRoute: useEffect user =', !!user, 'loading =', loading, 'pathname =', window.location.pathname);
    // Only redirect if loading is completely done AND there's no user
    if (!loading && !user) {
      console.log('ProtectedRoute: Redirecting to /auth because no user and loading done');
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Show loading screen while authentication is resolving
  if (loading || !user) {
    return <LoadingSpinner />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;