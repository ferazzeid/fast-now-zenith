import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface AdminGoalIdea {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl?: string;
}

export const useAdminGoalIdeas = () => {
  const [goalIdeas, setGoalIdeas] = useState<AdminGoalIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadGoalIdeas = async () => {
    try {
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'admin_goal_ideas')
        .maybeSingle();

      if (error) {
        console.error('Database error:', error);
        setGoalIdeas([]);
        setLoading(false);
        return;
      }

      if (data?.setting_value) {
        try {
          const parsedGoalIdeas = JSON.parse(data.setting_value);
          setGoalIdeas(Array.isArray(parsedGoalIdeas) ? parsedGoalIdeas : []);
        } catch (parseError) {
          console.error('Error parsing goal ideas:', parseError);
          setGoalIdeas([]);
        }
      } else {
        setGoalIdeas([]);
      }
    } catch (error) {
      console.error('Error loading admin goal ideas:', error);
      setGoalIdeas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoalIdeas();
  }, []);

  return {
    goalIdeas,
    loading,
    refreshGoalIdeas: loadGoalIdeas
  };
};