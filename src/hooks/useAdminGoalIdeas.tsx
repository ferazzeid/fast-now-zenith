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
    
    // Always clear cache to ensure fresh data
    console.log('🧹 Clearing ALL cache before loading goal ideas');
    queryClient.invalidateQueries({ queryKey: ['admin'] });
    queryClient.removeQueries({ queryKey: ['admin'] });
    localStorage.removeItem('goalIdeasCache');
    localStorage.removeItem('adminGoalIdeas');
    sessionStorage.removeItem('goalIdeasCache');
    sessionStorage.removeItem('adminGoalIdeas');
    
    try {
      // Add cache-busting parameter
      const timestamp = Date.now();
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
            console.log('🔍 Filtering ideas by gender:', genderFilter);
            console.log('📋 All ideas before filtering:', validIdeas.map(i => ({ id: i.id, title: i.title, gender: i.gender })));
            validIdeas = validIdeas.filter(idea => idea.gender === genderFilter);
            console.log('✅ Filtered ideas:', validIdeas.map(i => ({ id: i.id, title: i.title, gender: i.gender })));
          }
          
          console.log('✅ Admin Goal Ideas loaded successfully:', validIdeas.length, 'ideas for gender:', genderFilter);
          // Create completely new array to force React re-render with timestamp
          setGoalIdeas(validIdeas.map(idea => ({ ...idea, _timestamp: timestamp })));
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
    console.log('🔄 useAdminGoalIdeas useEffect triggered - refreshTrigger:', refreshTrigger, 'genderFilter:', genderFilter);
    loadGoalIdeas(true); // Always force clear cache
  }, [refreshTrigger, genderFilter]);

  const forceRefresh = () => {
    console.log('🔄 Force refreshing admin goal ideas...');
    // Clear all possible caches
    localStorage.clear();
    sessionStorage.clear();
    queryClient.clear();
    setRefreshTrigger(prev => prev + 1);
  };

  return {
    goalIdeas,
    loading,
    refreshGoalIdeas: () => loadGoalIdeas(true),
    forceRefresh
  };
};