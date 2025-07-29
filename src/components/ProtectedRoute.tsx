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
    // Only redirect if we're absolutely sure there's no user after loading is complete
    // Add a delay to ensure authentication has time to resolve from cache
    if (!loading && !user) {
      const timer = setTimeout(() => {
        navigate('/auth');
      }, 1000); // Give extra time for auth to resolve
      
      return () => clearTimeout(timer);
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