import { supabase } from '@/integrations/supabase/client';
import { useSystemMotivators } from './useSystemMotivators';
import { useAdminGoalIdeas } from './useAdminGoalIdeas';
import { useStandardizedLoading } from './useStandardizedLoading';

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
  const { execute, isLoading } = useStandardizedLoading();
  const { systemMotivators, refetch: refetchSystemMotivators } = useSystemMotivators();
  const goalIdeasHook = useAdminGoalIdeas();

  // Create new system motivator (admin only)
  const createSystemMotivator = async (motivatorData: Omit<SystemMotivator, 'id' | 'created_at' | 'updated_at'>) => {
    const result = await execute(async () => {
      const { data, error } = await supabase
        .from('system_motivators' as any)
        .insert([motivatorData])
        .select()
        .single();

      if (error) throw error;

      await refetchSystemMotivators();
      await goalIdeasHook.refreshGoalIdeas(); // Refresh goal ideas too
      return data;
    }, {
      onError: (error) => {
        console.error('Error creating system motivator:', error);
      }
    });

    return result.success ? result.data : null;
  };

  // Update system motivator
  const updateSystemMotivator = async (id: string, updates: Partial<SystemMotivator>) => {
    const result = await execute(async () => {
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
    }, {
      onError: (error) => {
        console.error('Error updating system motivator:', error);
      }
    });

    return result.success ? result.data : null;
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
    loading: isLoading || goalIdeasHook.loading,
  };
};

export default useEnhancedAdminGoalManagement;