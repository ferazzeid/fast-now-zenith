import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSystemMotivators } from './useSystemMotivators';
import { useAdminGoalIdeas } from './useAdminGoalIdeas';

// System motivator type (temporary until types are regenerated)
type SystemMotivator = {
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
  link_url?: string | null;
};

// Simplified admin goal management - now just a wrapper around unified system
export const useEnhancedAdminGoalManagement = () => {
  const [loading, setLoading] = useState(false);
  const { systemMotivators, refetch: refetchSystemMotivators } = useSystemMotivators();
  const goalIdeasHook = useAdminGoalIdeas();

  // Create new system motivator (admin only)
  const createSystemMotivator = async (motivatorData: Omit<SystemMotivator, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('system_motivators' as any)
        .insert([motivatorData])
        .select()
        .single();

      if (error) throw error;

      await refetchSystemMotivators();
      await goalIdeasHook.refreshGoalIdeas(); // Refresh goal ideas too
      return data;
    } catch (error) {
      console.error('Error creating system motivator:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update system motivator
  const updateSystemMotivator = async (id: string, updates: Partial<SystemMotivator>) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('system_motivators' as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await refetchSystemMotivators();
      await goalIdeasHook.refreshGoalIdeas(); // Refresh goal ideas too
      return data;
    } catch (error) {
      console.error('Error updating system motivator:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    // System motivators
    systemMotivators,
    refetchSystemMotivators,
    createSystemMotivator,
    updateSystemMotivator,
    
    // Goal ideas (now unified with system motivators)
    goalIdeas: goalIdeasHook.goalIdeas,
    refreshGoalIdeas: goalIdeasHook.refreshGoalIdeas,
    updateGoalIdea: goalIdeasHook.updateGoalIdea,
    removeGoalIdea: goalIdeasHook.removeGoalIdea,
    
    // Combined loading state
    loading: loading || goalIdeasHook.loading,
  };
};

export default useEnhancedAdminGoalManagement;