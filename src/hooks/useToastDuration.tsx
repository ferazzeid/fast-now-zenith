import { useBaseQuery } from '@/hooks/useBaseQuery';
import { supabase } from '@/integrations/supabase/client';

export const useToastDuration = () => {
  const { data: durationSeconds, isLoading } = useBaseQuery(
    ['toast-duration-global'],
    async () => {
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'toast_duration_seconds')
        .maybeSingle();

      if (error) {
        console.warn('Could not fetch toast duration setting, defaulting to 5 seconds:', error);
        return 5;
      }

      const duration = parseInt(data?.setting_value || '5');
      return isNaN(duration) ? 5 : Math.max(1, Math.min(30, duration)); // Clamp between 1-30 seconds
    },
    {
      staleTime: 60 * 1000, // 1 minute - settings don't change often
      gcTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  return {
    durationSeconds: durationSeconds ?? 5,
    durationMs: (durationSeconds ?? 5) * 1000,
    isLoading,
  };
};