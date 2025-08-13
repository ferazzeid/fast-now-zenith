import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { queryClient } from '@/lib/query-client';

export interface AdminGoalIdea {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl?: string;
  gender?: 'male' | 'female';
}

export const useAdminGoalIdeas = (genderFilter?: 'male' | 'female') => {
  const [goalIdeas, setGoalIdeas] = useState<AdminGoalIdea[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadGoalIdeas = async (forceClear: boolean = false) => {
    console.log('🔄 Loading admin goal ideas with gender filter:', genderFilter, 'Force clear:', forceClear);
    
    // Clear cache if requested
    if (forceClear) {
      console.log('🧹 Clearing React Query cache for admin goal ideas...');
      queryClient.invalidateQueries({ queryKey: ['admin', 'goal-ideas'] });
      queryClient.removeQueries({ queryKey: ['admin', 'goal-ideas'] });
    }
    
    try {
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'admin_goal_ideas')
        .maybeSingle();

      if (error) {
        console.error('Admin Goal Ideas Database error:', error);
        setGoalIdeas([]);
        setLoading(false);
        return;
      }

      if (data?.setting_value) {
        try {
          const parsedGoalIdeas = JSON.parse(data.setting_value);
          let validIdeas = Array.isArray(parsedGoalIdeas) ? parsedGoalIdeas : [];
          
          // Apply gender filter if specified
          if (genderFilter) {
            validIdeas = validIdeas.filter(idea => idea.gender === genderFilter);
          }
          
          console.log('✅ Admin Goal Ideas loaded successfully:', validIdeas);
          // Create completely new array to force React re-render
          setGoalIdeas(validIdeas.map(idea => ({ ...idea })));
        } catch (parseError) {
          console.error('Error parsing admin goal ideas:', parseError);
          setGoalIdeas([]);
        }
      } else {
        console.log('No admin goal ideas data found in database');
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
  }, [refreshTrigger, genderFilter]);

  const forceRefresh = (forceClear: boolean = true) => {
    console.log('🔄 Force refreshing admin goal ideas with cache clear:', forceClear);
    
    // Clear all related cache
    if (forceClear) {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      queryClient.invalidateQueries({ queryKey: ['shared_settings'] });
      queryClient.removeQueries({ queryKey: ['admin'] });
      queryClient.removeQueries({ queryKey: ['shared_settings'] });
    }
    
    setRefreshTrigger(prev => prev + 1);
    loadGoalIdeas(forceClear);
  };

  return {
    goalIdeas,
    loading,
    refreshGoalIdeas: loadGoalIdeas,
    forceRefresh
  };
};