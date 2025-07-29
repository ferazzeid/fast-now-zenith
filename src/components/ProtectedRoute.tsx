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
  
  console.log('DEBUG: ProtectedRoute render', { user: !!user, loading });

  useEffect(() => {
    // Only redirect if loading is completely done AND there's no user
    // This prevents redirects while cached sessions are being restored
    if (!loading && !user) {
      console.log('DEBUG: No user after loading complete, redirecting to auth');
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Show loading screen while authentication is resolving OR if no user yet
  // This prevents the flash of login page
  if (loading || !user) {
    console.log('DEBUG: Showing loading spinner - loading:', loading, 'user:', !!user);
    return <LoadingSpinner />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;