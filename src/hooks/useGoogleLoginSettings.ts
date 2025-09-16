import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useGoogleLoginSettings = () => {
  const { data: googleLoginEnabled, isLoading } = useQuery({
    queryKey: ['google-login-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'google_login_enabled')
        .maybeSingle();
      
      if (error) {
        console.warn('Could not fetch Google login setting, defaulting to enabled:', error);
        return true;
      }
      
      return data?.setting_value === 'true';
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    googleLoginEnabled: googleLoginEnabled ?? true,
    isLoading,
  };
};