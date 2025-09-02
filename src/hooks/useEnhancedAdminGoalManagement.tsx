import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSystemMotivators } from './useSystemMotivators';
import { useAdminGoalManagement } from './useAdminGoalManagement';

// Enhanced admin goal management that can work with both system_motivators and shared_settings
export const useEnhancedAdminGoalManagement = () => {
  const [loading, setLoading] = useState(false);
  const { systemMotivators, refetch: refetchSystemMotivators } = useSystemMotivators();
  const originalGoalManagement = useAdminGoalManagement();

  // Add system motivator to shared_settings as goal idea
  const addSystemMotivatorToGoalIdeas = async (systemMotivatorId: string) => {
    try {
      setLoading(true);
      
      // Find the system motivator
      const systemMotivator = systemMotivators.find(m => m.id === systemMotivatorId);
      if (!systemMotivator) {
        throw new Error('System motivator not found');
      }

      // Convert to the format expected by useAdminGoalManagement
      const motivatorData = {
        id: systemMotivator.id,
        title: systemMotivator.title,
        content: systemMotivator.content,
        category: systemMotivator.category || 'personal',
        // Use gender-specific images if available, fall back to generic approach
        image_url: systemMotivator.male_image_url || systemMotivator.female_image_url || null,
        male_image_url: systemMotivator.male_image_url,
        female_image_url: systemMotivator.female_image_url,
        slug: systemMotivator.slug,
        meta_title: systemMotivator.meta_title,
        meta_description: systemMotivator.meta_description,
        link_url: `/motivators/${systemMotivator.slug}` // Auto-generate link
      };

      await originalGoalManagement.addToDefaultGoals(motivatorData);
    } catch (error) {
      console.error('Error adding system motivator to goal ideas:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sync all active system motivators to goal ideas
  const syncAllSystemMotivatorsToGoalIdeas = async () => {
    try {
      setLoading(true);
      
      for (const systemMotivator of systemMotivators) {
        // Check if already exists
        const exists = await originalGoalManagement.checkIfInDefaultGoals(systemMotivator.id);
        if (!exists) {
          await addSystemMotivatorToGoalIdeas(systemMotivator.id);
        }
      }
    } catch (error) {
      console.error('Error syncing system motivators to goal ideas:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

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

  return {
    // System motivators
    systemMotivators,
    refetchSystemMotivators,
    createSystemMotivator,
    updateSystemMotivator,
    
    // Goal ideas (shared_settings based)
    ...originalGoalManagement,
    addSystemMotivatorToGoalIdeas,
    syncAllSystemMotivatorsToGoalIdeas,
    
    // Enhanced loading state
    loading: loading || originalGoalManagement.loading,
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
};

export default useEnhancedAdminGoalManagement;