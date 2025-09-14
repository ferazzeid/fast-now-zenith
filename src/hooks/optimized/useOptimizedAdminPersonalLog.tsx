import { supabase } from '@/integrations/supabase/client';
import { useBaseQuery } from '@/hooks/useBaseQuery';

export const useOptimizedAdminPersonalLog = () => {
  const { data: isEnabled, isLoading, error, errorMessage } = useBaseQuery(
    ['admin-personal-log-enabled'],
    async () => {
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'admin_personal_log_enabled')
        .single();

      if (error) {
        console.warn('Could not fetch admin personal log setting, defaulting to enabled:', error);
        return true; // Default to enabled if setting doesn't exist
      }

      return data?.setting_value !== 'false'; // Default to true unless explicitly false
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  return { 
    isEnabled: isEnabled ?? true, // Default to true if data is undefined
    isLoading,
    error,
    errorMessage,
  };
};