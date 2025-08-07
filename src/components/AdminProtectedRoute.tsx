import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';

interface AdminProtectedRouteProps {
  children: ReactNode;
}

const AdminProtectedRoute = ({ children }: AdminProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const check = async () => {
      if (!loading && user) {
        try {
          const { data, error } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
          if (error) {
            console.warn('Admin role check via RPC failed, falling back to user_roles query:', error);
            const { data: roleRow, error: roleError } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', user.id)
              .eq('role', 'admin')
              .maybeSingle();
            if (roleError) {
              setIsAdmin(false);
            } else {
              setIsAdmin(!!roleRow);
            }
          } else {
            setIsAdmin(!!data);
          }
        } finally {
          setChecking(false);
        }
      } else if (!loading && !user) {
        setChecking(false);
      }
    };
    check();
  }, [user, loading]);

useEffect(() => {
  if (!loading && !checking) {
    if (!user) {
      navigate('/auth');
    } else if (!isAdmin) {
      toast({
        title: 'Admins only',
        description: 'You don’t have access to this section.',
        variant: 'destructive',
      });
      navigate('/');
    }
  }
}, [loading, checking, isAdmin, user, navigate, toast]);

  if (loading || checking) {
    return <LoadingSpinner />;
  }

  if (!user || !isAdmin) {
    return <LoadingSpinner />;
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;
