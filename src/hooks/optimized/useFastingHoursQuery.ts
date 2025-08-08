import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
}

export interface ContentVariant {
  type: 'metabolic' | 'physiological' | 'mental' | 'benefits' | 'snippet';
  content: string;
  duration?: number; // milliseconds to show this variant
}

export const fastingHoursKey = ["fasting", "hours"] as const;

export function useFastingHoursQuery() {
  return useQuery({
    queryKey: fastingHoursKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fasting_hours")
        .select("*")
        .lte("hour", 72)
        .order("hour", { ascending: true });
      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        content_rotation_data: item.content_rotation_data 
          ? (item.content_rotation_data as unknown as {
              current_index: number;
              variants: ContentVariant[];
            })
          : undefined
      })) as FastingHour[];
    },
    staleTime: 24 * 60 * 60 * 1000, // 24h cache as content rarely changes
  });
}
