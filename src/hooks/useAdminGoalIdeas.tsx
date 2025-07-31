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
      console.log('Loading admin goal ideas...');
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

      console.log('Goal ideas data from DB:', data);

      if (data?.setting_value) {
        try {
          const parsedGoalIdeas = JSON.parse(data.setting_value);
          console.log('Parsed goal ideas:', parsedGoalIdeas);
          setGoalIdeas(Array.isArray(parsedGoalIdeas) ? parsedGoalIdeas : []);
        } catch (parseError) {
          console.error('Error parsing goal ideas:', parseError);
          setGoalIdeas([]);
        }
      } else {
        console.log('No goal ideas found in database, setting empty array');
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