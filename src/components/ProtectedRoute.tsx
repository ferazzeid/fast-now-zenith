import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    // Wait a bit before showing loading to reduce flashing
    const timer = setTimeout(() => {
      setShowLoading(true);
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Add coordination check - don't redirect during app initialization
    const checkRedirect = () => {
      if (!loading && !user && !(window as any).__initializingApp) {
        navigate('/auth');
      }
    };

    // Delay redirect slightly to avoid race conditions
    const timer = setTimeout(checkRedirect, 100);
    return () => clearTimeout(timer);
  }, [user, loading, navigate]);

  // Show loading screen with patience - only after initial delay
  if ((loading || !user) && showLoading) {
    return <LoadingSpinner />;
  }

  // Hide content while still loading but don't show spinner yet
  if (loading || !user) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;