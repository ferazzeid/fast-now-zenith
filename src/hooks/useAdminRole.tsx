import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useAdminRole = () => {
  const { user } = useAuth();

  // Query to check if user has admin role in database
  const { data: adminData, isLoading: loading, refetch } = useQuery({
    queryKey: ['userRole', user?.id],
    queryFn: async () => {
      if (!user?.id) return { isAdmin: false };
      
      console.log('🔍 Checking admin role for user:', user.id);
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error checking admin role:', error);
        return { isAdmin: false };
      }
      
      const isAdmin = !!data;
      console.log('✅ Admin role check result:', { isAdmin, userId: user.id });
      
      return { isAdmin };
    },
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000, // Reduce cache to 1 minute for admin role persistence debugging
    refetchOnWindowFocus: true, // Refetch when window gains focus to catch role changes
  });

  const isAdmin = adminData?.isAdmin || false;

  return {
    isAdmin,
    loading,
    refetch // Export refetch for manual role refresh
  };
};