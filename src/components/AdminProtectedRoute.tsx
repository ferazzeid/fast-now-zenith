import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAccess } from '@/hooks/useAccess';
import { LoadingRecovery } from '@/components/LoadingRecovery';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useConnectionMonitor } from '@/hooks/useConnectionMonitor';

interface AdminProtectedRouteProps {
  children: ReactNode;
}

const AdminProtectedRoute = ({ children }: AdminProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const { isAdmin, loading: accessLoading } = useAccess();
  const { isConnected, checkConnection } = useConnectionMonitor();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isTimeout, setIsTimeout] = useState(false);

  // Reduced timeout for admin pages - users shouldn't wait so long
  const timeoutDuration = isMobile ? 8000 : 6000;

  useEffect(() => {
    if (!loading && !accessLoading) {
      if (!user) {
        navigate('/auth');
      } else if (!isAdmin) {
        toast({
          title: 'Admins only',
          description: 'You do not have access to this section.',
          variant: 'destructive',
        });
        navigate('/');
      }
    }
  }, [loading, accessLoading, isAdmin, user, navigate, toast]);

  useEffect(() => {
    if (loading || accessLoading) {
      const timer = setTimeout(() => {
        setIsTimeout(true);
      }, timeoutDuration);

      return () => clearTimeout(timer);
    }
  }, [loading, accessLoading, timeoutDuration]);

  // Show connection issues
  if (!isConnected && !loading && !accessLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <LoadingRecovery
          onRetry={checkConnection}
          message="Admin dashboard requires a stable connection"
          showError={true}
        />
      </div>
    );
  }

  // Show timeout recovery
  if (isTimeout && (loading || accessLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <LoadingRecovery
          onRetry={() => window.location.reload()}
          message={`Admin access verification is taking longer than expected${isMobile ? ' (mobile connection)' : ''}`}
          showError={false}
        />
      </div>
    );
  }

  // Still loading
  if (loading || accessLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="space-y-4 text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto animate-spin" />
          <p className="text-sm text-muted-foreground">Verifying admin access...</p>
          {isMobile && (
            <p className="text-xs text-muted-foreground/70">This may take a moment on mobile</p>
          )}
        </div>
      </div>
    );
  }

  // Not authorized
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;