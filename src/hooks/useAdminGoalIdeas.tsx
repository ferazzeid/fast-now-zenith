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
  maleImageUrl?: string;
  femaleImageUrl?: string;
  linkUrl?: string;
}

// System motivator type (temporary until types are regenerated)
interface SystemMotivator {
  id: string;
  title: string;
  content: string;
  category: string | null;
  male_image_url: string | null;
  female_image_url: string | null;
  slug: string;
  meta_title: string | null;
  meta_description: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  link_url: string | null;
}

// Transform SystemMotivator to AdminGoalIdea format
const transformToAdminGoalIdea = (systemMotivator: SystemMotivator): AdminGoalIdea => {
  return {
    id: systemMotivator.id,
    title: systemMotivator.title,
    description: systemMotivator.content,
    category: systemMotivator.category || 'personal',
    imageUrl: systemMotivator.male_image_url || systemMotivator.female_image_url || undefined,
    maleImageUrl: systemMotivator.male_image_url || undefined,
    femaleImageUrl: systemMotivator.female_image_url || undefined,
    linkUrl: systemMotivator.link_url || undefined,
  };
};

export const useAdminGoalIdeas = () => {
  const [goalIdeas, setGoalIdeas] = useState<AdminGoalIdea[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadGoalIdeas = async (forceClear: boolean = false) => {
    console.log('🔄 Loading admin goal ideas from system_motivators', 'Force clear:', forceClear);
    
    // Clear cache to ensure fresh data
    if (forceClear) {
      console.log('🧹 Clearing cache before loading goal ideas');
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      queryClient.removeQueries({ queryKey: ['admin'] });
      localStorage.removeItem('goalIdeasCache');
      localStorage.removeItem('adminGoalIdeas');
      sessionStorage.removeItem('goalIdeasCache');
      sessionStorage.removeItem('adminGoalIdeas');
    }
    
    try {
      // Query system_motivators table directly
      const { data, error } = await supabase
        .from('system_motivators' as any)
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('System Motivators Database error:', error);
        setGoalIdeas([]);
        setLoading(false);
        return;
      }

      if (data) {
        // Transform system motivators to AdminGoalIdea format
        const transformedIdeas = (data as unknown as SystemMotivator[]).map(transformToAdminGoalIdea);
        
        console.log('✅ Goal Ideas loaded from system_motivators:', transformedIdeas.length, 'ideas');
        setGoalIdeas(transformedIdeas);
      } else {
        console.log('No system motivators found in database');
        setGoalIdeas([]);
      }
    } catch (error) {
      console.error('Error loading goal ideas from system_motivators:', error);
      setGoalIdeas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔄 useAdminGoalIdeas useEffect triggered - refreshTrigger:', refreshTrigger);
    loadGoalIdeas(true); // Always force clear cache
  }, [refreshTrigger]);

  const forceRefresh = () => {
    console.log('🔄 Force refreshing admin goal ideas from system_motivators...');
    // Clear all possible caches
    localStorage.clear();
    sessionStorage.clear();
    queryClient.clear();
    setRefreshTrigger(prev => prev + 1);
  };

  // Update goal idea in system_motivators table
  const updateGoalIdea = async (goalId: string, updates: Partial<AdminGoalIdea>) => {
    try {
      setLoading(true);
      
      // Transform AdminGoalIdea updates back to SystemMotivator format
      const systemMotivatorUpdates: any = {};
      
      if (updates.title !== undefined) systemMotivatorUpdates.title = updates.title;
      if (updates.description !== undefined) systemMotivatorUpdates.content = updates.description;
      if (updates.category !== undefined) systemMotivatorUpdates.category = updates.category;
      if (updates.maleImageUrl !== undefined) systemMotivatorUpdates.male_image_url = updates.maleImageUrl;
      if (updates.femaleImageUrl !== undefined) systemMotivatorUpdates.female_image_url = updates.femaleImageUrl;
      if (updates.linkUrl !== undefined) systemMotivatorUpdates.link_url = updates.linkUrl;
      
      const { error } = await supabase
        .from('system_motivators' as any)
        .update(systemMotivatorUpdates)
        .eq('id', goalId);

      if (error) throw error;

      // Refresh the data
      await loadGoalIdeas(true);
      
      toast({
        title: "Goal Updated",
        description: "Goal idea has been updated successfully",
      });
      
      return true;
    } catch (error) {
      console.error('Error updating goal idea:', error);
      toast({
        title: "Error",
        description: "Failed to update goal idea",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Remove goal idea from system_motivators table
  const removeGoalIdea = async (goalId: string) => {
    try {
      setLoading(true);
      
      // Set is_active to false instead of deleting
      const { error } = await supabase
        .from('system_motivators' as any)
        .update({ is_active: false })
        .eq('id', goalId);

      if (error) throw error;

      // Refresh the data
      await loadGoalIdeas(true);
      
      toast({
        title: "Goal Removed",
        description: "Goal idea has been deactivated",
      });
      
      return true;
    } catch (error) {
      console.error('Error removing goal idea:', error);
      toast({
        title: "Error",
        description: "Failed to remove goal idea",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    goalIdeas,
    loading,
    refreshGoalIdeas: () => loadGoalIdeas(true),
    forceRefresh,
    updateGoalIdea,
    removeGoalIdea
  };
};