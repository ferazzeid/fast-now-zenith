import { ReactNode, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  
  // AI-centric state management
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // AI-powered authentication check
  const checkAuthentication = useCallback(async () => {
    try {
      setLoading(true);
      
      // First check Supabase auth state
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        setUser(null);
        setLoading(false);
        navigate('/auth');
        return;
      }

      // Verify authentication via AI system
      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          message: "Verify my authentication status",
          action: "verify_auth"
        }
      });

      if (error || !data.authenticated) {
        console.error('Authentication verification failed:', error);
        setUser(null);
        setLoading(false);
        navigate('/auth');
        return;
      }

      setUser(authUser);
      setLoading(false);
    } catch (error) {
      console.error('Error checking authentication:', error);
      setUser(null);
      setLoading(false);
      navigate('/auth');
    }
  }, [navigate]);

  useEffect(() => {
    checkAuthentication();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        navigate('/auth');
      } else if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [checkAuthentication, navigate]);

  // Show loading screen only on initial authentication check
  if (loading && !user) {
    return <LoadingSpinner />;
  }

  // If not authenticated, navigate to auth (don't show loading)
  if (!user) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;