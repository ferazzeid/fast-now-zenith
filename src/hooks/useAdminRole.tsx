import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useAdminRole = () => {
  const { user } = useAuth();

  // Query to check if user has admin role in database
  const { data: adminData, isLoading: loading } = useQuery({
    queryKey: ['userRole', user?.id],
    queryFn: async () => {
      if (!user?.id) return { isAdmin: false };
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error checking admin role:', error);
        return { isAdmin: false };
      }
      
      return { isAdmin: !!data };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const isAdmin = adminData?.isAdmin || false;

  // Debug logging to help troubleshoot admin detection
  console.log('🔧 Admin Check:', {
    userEmail: user?.email,
    userId: user?.id,
    isAdmin,
    loading,
    adminData
  });

  return {
    isAdmin,
    loading
  };
};