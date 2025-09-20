import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const use90DayProgramSettings = () => {
  return useQuery({
    queryKey: ['90-day-program-enabled'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', '90_day_program_enabled')
        .maybeSingle();
      
      if (error) throw error;
      return data?.setting_value === 'true';
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};