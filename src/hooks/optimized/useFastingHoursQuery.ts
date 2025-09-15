import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAccess } from "@/hooks/useAccess";

export interface FastingHour {
  id?: string;
  hour: number;
  day: number;
  title: string;
  body_state: string;
  encouragement?: string;
  tips?: string[];
  phase: string;
  difficulty: string;
  common_feelings?: string[];
  scientific_info?: string;
  autophagy_milestone?: boolean;
  ketosis_milestone?: boolean;
  fat_burning_milestone?: boolean;
  read_more_url?: string;
  // Enhanced fields
  benefits_challenges?: string;
  content_snippet?: string;
  content_rotation_data?: {
    current_index: number;
    variants: ContentVariant[];
  };
  metabolic_changes?: string;
  physiological_effects?: string;
  mental_emotional_state?: string[];
  stage?: string;
  admin_personal_log?: string;
  slug?: string;
}

export interface ContentVariant {
  type: 'metabolic' | 'physiological' | 'mental' | 'benefits' | 'snippet' | 'stage' | 'encouragement' | 'admin_personal_log';
  content: string;
  duration?: number; // milliseconds to show this variant
}

export const fastingHoursKey = ["fasting", "hours"] as const;

export function useFastingHoursQuery() {
  const { isAdmin } = useAccess();
  
  return useQuery({
    queryKey: fastingHoursKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fasting_hours")
        .select("*")
        .lte("hour", 72)
        .order("hour", { ascending: true });
      if (error) throw error;
      
      const result = (data || []).map(item => ({
        ...item,
        content_rotation_data: item.content_rotation_data 
          ? (item.content_rotation_data as unknown as {
              current_index: number;
              variants: ContentVariant[];
            })
          : undefined
      })) as FastingHour[];
      
      return result;
    },
    // Use shorter cache time for admins actively editing logs
    staleTime: isAdmin ? 30 * 1000 : 60 * 1000, // 30 seconds for admins, 1 minute for users (much shorter for testing)
    refetchOnWindowFocus: true, // Always refetch when switching back to window
    refetchInterval: isAdmin ? 30000 : false, // Auto-refetch every 30 seconds for admins
  });
}
