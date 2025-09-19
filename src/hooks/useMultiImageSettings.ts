import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useMultiImageSettings = () => {
  return useQuery({
    queryKey: ['settings', 'enable_multi_image_capture'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'enable_multi_image_capture')
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching multi-image setting:', error);
        return false; // Default to disabled
      }
      
      return data?.setting_value === 'true';
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
};