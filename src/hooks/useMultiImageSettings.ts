import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export const useMultiImageSettings = () => {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['settings', 'enable_multi_image_capture'],
    queryFn: async () => {
      console.log('🔧 Fetching multi-image setting from database...');
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'enable_multi_image_capture')
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching multi-image setting:', error);
        return false; // Default to disabled
      }
      
      const result = data?.setting_value === 'true';
      console.log('🔧 Multi-image setting from DB:', result);
      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

  // Force a refetch on mount to ensure we have the latest value
  useEffect(() => {
    console.log('🔧 Multi-image hook mounted, invalidating cache...');
    queryClient.invalidateQueries({ queryKey: ['settings', 'enable_multi_image_capture'] });
  }, [queryClient]);

  return query;
};