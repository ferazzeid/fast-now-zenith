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
  const [showRecovery, setShowRecovery] = useState(false);

  useEffect(() => {
    // Simple redirect logic - if not loading and no user, redirect to auth
    if (!loading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, loading, navigate]);

  // Add emergency timeout for stuck loading states
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        console.warn('ProtectedRoute: Loading timeout reached, showing recovery');
        setShowRecovery(true);
      }, 15000); // 15 second emergency timeout
      
      return () => clearTimeout(timeout);
    } else {
      setShowRecovery(false);
    }
  }, [loading]);

  // Show recovery screen if loading is stuck
  if (showRecovery && loading) {
    return (
      <LoadingRecovery 
        onRetry={() => window.location.reload()}
        message="Authentication is taking longer than expected"
        showError={true}
      />
    );
  }

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