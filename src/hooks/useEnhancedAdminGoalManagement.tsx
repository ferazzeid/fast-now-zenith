import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSystemMotivators } from './useSystemMotivators';
import { useAdminGoalManagement } from './useAdminGoalManagement';
import { generateWebsiteUrl, validateAndFixUrl } from '@/utils/urlUtils';

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
        imageUrl: systemMotivator.male_image_url || systemMotivator.female_image_url || null,
        male_image_url: systemMotivator.male_image_url,
        female_image_url: systemMotivator.female_image_url,
        slug: systemMotivator.slug,
        meta_title: systemMotivator.meta_title,
        meta_description: systemMotivator.meta_description,
        linkUrl: generateWebsiteUrl(systemMotivator.slug) // Generate proper website URL
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

  // Fix all existing goal ideas by adding proper website URLs
  const fixAllGoalIdeasUrls = async () => {
    try {
      setLoading(true);
      
      // Get current goal ideas
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'admin_goal_ideas')
        .maybeSingle();

      if (error) throw error;

      let goalIdeas = [];
      if (data?.setting_value) {
        goalIdeas = JSON.parse(data.setting_value);
      }

      if (goalIdeas.length === 0) {
        console.log('No goal ideas found to fix');
        return;
      }

      // Update each goal idea with proper website URL
      const updatedGoalIdeas = goalIdeas.map((goal: any) => {
        // Try to find corresponding system motivator by ID to get slug
        const systemMotivator = systemMotivators.find(sm => sm.id === goal.id);
        
        let newLinkUrl = goal.linkUrl;
        
        if (systemMotivator?.slug) {
          // Generate proper website URL from slug
          newLinkUrl = generateWebsiteUrl(systemMotivator.slug);
        } else if (goal.linkUrl) {
          // Fix existing URL if it's relative
          newLinkUrl = validateAndFixUrl(goal.linkUrl);
        }
        
        return {
          ...goal,
          linkUrl: newLinkUrl
        };
      });

      // Save back to database
      const { error: updateError } = await supabase
        .from('shared_settings')
        .upsert({
          setting_key: 'admin_goal_ideas',
          setting_value: JSON.stringify(updatedGoalIdeas)
        }, {
          onConflict: 'setting_key'
        });

      if (updateError) throw updateError;

      console.log('✅ Successfully fixed all goal idea URLs');
      
      // Refresh the system motivators to get fresh data
      await refetchSystemMotivators();
    } catch (error) {
      console.error('Error fixing goal idea URLs:', error);
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
    fixAllGoalIdeasUrls,
    
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