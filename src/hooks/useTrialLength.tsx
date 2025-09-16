import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useTrialLength = () => {
  const { data: trialDays, isLoading } = useQuery({
    queryKey: ['trial-length'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'trial_length_days')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return parseInt(data?.setting_value || '7');
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - rarely changes
    gcTime: 30 * 60 * 1000, // 30 minutes cache
  });

  return {
    trialDays: trialDays || 7,
    isLoading
  };
};