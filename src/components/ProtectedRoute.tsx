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
  // All hooks must be called consistently - no conditional hooks!
  const { user, loading } = useAuth();
  const oauthCompleting = useAuthStore(state => state.oauthCompleting);
  const navigate = useNavigate();
  const [showLoading, setShowLoading] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Show loading after 200ms to reduce flashing
    const loadingTimer = setTimeout(() => {
      setShowLoading(true);
    }, 200);

    // Show recovery option after 5 seconds of loading
    const recoveryTimer = setTimeout(() => {
      if (loading || !user) {
        setShowRecovery(true);
      }
    }, 5000);

    // Force recovery after 10 seconds
    const forceTimer = setTimeout(() => {
      if (loading || !user) {
        console.warn('ProtectedRoute: Forced timeout after 10s');
        setShowRecovery(true);
        // Clear loading flag if it's stuck
        (window as any).__initializingApp = false;
      }
    }, 10000);

    return () => {
      clearTimeout(loadingTimer);
      clearTimeout(recoveryTimer);
      clearTimeout(forceTimer);
    };
  }, [loading, user]);

  useEffect(() => {
    // Reset recovery state when loading state changes
    if (!loading) {
      setShowRecovery(false);
      setRetryCount(0);
    }
  }, [loading]);

  useEffect(() => {
    // Enhanced redirect logic with timeout protection and OAuth awareness
    const checkRedirect = () => {
      // Don't redirect if OAuth is completing or app is initializing
      if (oauthCompleting || (window as any).__initializingApp) {
        console.log('🛡️ ProtectedRoute: Delaying redirect - OAuth completing or app initializing');
        return;
      }
      
      if (!loading && !user) {
        console.log('🔄 ProtectedRoute: Redirecting to auth - no user found');
        navigate('/auth');
      }
    };

    // Longer delay when OAuth is completing to allow auth state to update
    const delay = oauthCompleting ? 500 : 50;
    const timer = setTimeout(checkRedirect, delay);
    return () => clearTimeout(timer);
  }, [user, loading, oauthCompleting, navigate]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setShowRecovery(false);
    setShowLoading(false);
    
    // Clear any stuck initialization flags
    (window as any).__initializingApp = false;
    
    // Force page reload as last resort after 3 retries
    if (retryCount >= 2) {
      window.location.reload();
    } else {
      // Restart the loading process
      setTimeout(() => setShowLoading(true), 100);
    }
  };

  // Show recovery UI if loading is stuck
  if (showRecovery && (loading || !user)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <LoadingRecovery 
          onRetry={handleRetry}
          message={retryCount > 0 ? "Still having trouble loading..." : "Taking longer than expected..."}
          showError={retryCount > 1}
        />
      </div>
    );
  }

  // Show loading screen after initial delay
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