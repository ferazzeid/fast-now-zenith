import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAccess } from '@/hooks/useAccess';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';

interface AdminProtectedRouteProps {
  children: ReactNode;
}

const AdminProtectedRoute = ({ children }: AdminProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const { isAdmin, loading: accessLoading } = useAccess(); // UNIFIED: Use useAccess for admin check
  const navigate = useNavigate();
  const { toast } = useToast();

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

  if (loading || accessLoading) {
    return <LoadingSpinner />;
  }

  if (!user || !isAdmin) {
    return <LoadingSpinner />;
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;