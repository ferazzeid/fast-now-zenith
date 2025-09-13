import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { LoadingRecovery } from '@/components/LoadingRecovery';
import { AuthRecovery } from '@/components/AuthRecovery';


interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [showRecovery, setShowRecovery] = useState(false);
  const [showAuthRecovery, setShowAuthRecovery] = useState(false);

  useEffect(() => {
    // Simple redirect logic - if not loading and no user, redirect to auth
    if (!loading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, loading, navigate]);

  // Add emergency timeout for stuck loading states - extended for mobile
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        console.warn('ProtectedRoute: Loading timeout reached, showing recovery options');
        setShowRecovery(true);
        // Also show auth-specific recovery after longer delay
        setTimeout(() => setShowAuthRecovery(true), 5000);
      }, 20000); // 20 second timeout for mobile networks
      
      return () => clearTimeout(timeout);
    } else {
      setShowRecovery(false);
      setShowAuthRecovery(false);
    }
  }, [loading]);

  const handleClearAuthData = () => {
    // Clear all auth-related storage
    localStorage.clear();
    sessionStorage.clear();
    // Force page reload
    window.location.reload();
  };

  // Show auth-specific recovery if stuck for very long time
  if (showAuthRecovery && loading) {
    return (
      <AuthRecovery 
        onRetry={() => window.location.reload()}
        onClearData={handleClearAuthData}
      />
    );
  }

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