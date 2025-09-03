import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSystemMotivators } from './useSystemMotivators';
import { useAdminGoalIdeas } from './useAdminGoalIdeas';

// Enhanced admin goal management - now simplified to work primarily with system_motivators
export const useEnhancedAdminGoalManagement = () => {
  const [loading, setLoading] = useState(false);
  const { systemMotivators, refetch: refetchSystemMotivators } = useSystemMotivators();
  const adminGoalIdeas = useAdminGoalIdeas();

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
      return data;
    } catch (error) {
      console.error('Error updating system motivator:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Legacy function for backward compatibility (no longer needed)
  const fixAllGoalIdeasUrls = async () => {
    console.log('⚠️ fixAllGoalIdeasUrls is deprecated - system_motivators is now the single source of truth');
    return Promise.resolve();
  };

  return {
    // System motivators (primary source)
    systemMotivators,
    refetchSystemMotivators,
    createSystemMotivator,
    updateSystemMotivator,
    
    // Goal ideas (unified interface from system_motivators)
    ...adminGoalIdeas,
    
    // Legacy function for compatibility
    fixAllGoalIdeasUrls,
    
    // Enhanced loading state
    loading: loading || adminGoalIdeas.loading,
  };
};

// Type definition for system motivator (temporary until types are regenerated)
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
  link_url: string | null;
};

export default useEnhancedAdminGoalManagement;