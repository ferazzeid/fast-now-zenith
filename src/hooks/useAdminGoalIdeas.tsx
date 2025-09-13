import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { queryClient } from '@/lib/query-client';
import { useLoadingDebounce } from './useLoadingDebounce';

export interface AdminGoalIdea {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl?: string;
  maleImageUrl?: string;
  femaleImageUrl?: string;
  linkUrl?: string;
  slug?: string;
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
    slug: systemMotivator.slug,
  };
};

export const useAdminGoalIdeas = () => {
  const [goalIdeas, setGoalIdeas] = useState<AdminGoalIdea[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { startOperation, isLoading: debounceLoading } = useLoadingDebounce({
    debounceMs: 300,
    maxConcurrent: 1
  });

  const loadGoalIdeas = async (forceClear: boolean = false) => {
    const result = await startOperation('load-admin-goals', async () => {
      console.log('🔄 Loading admin goal ideas from system_motivators');
      
      // Only clear specific admin goal caches, not all caches
      if (forceClear) {
        console.log('🧹 Clearing admin goal specific caches...');
        
        // Clear only admin goal related React Query cache
        queryClient.invalidateQueries({ queryKey: ['admin-goals'] });
        queryClient.invalidateQueries({ queryKey: ['system-motivators'] });
        
        // Clear only admin goal specific localStorage entries
        try {
          const adminGoalKeys = ['admin-goal-cache', 'admin-goal-timestamp', 'system-motivators-cache'];
          adminGoalKeys.forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
          });
        } catch (e) {
          console.warn('Admin goal cache clearing issue:', e);
        }
      }
      
      try {
        setLoading(true);
      
      console.log('📡 Fetching FRESH data from system_motivators table...');
      
      // Add timestamp to ensure fresh query
      const timestamp = Date.now();
      const { data, error } = await supabase
        .from('system_motivators' as any)
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      console.log('📊 RAW DATABASE RESPONSE:', { 
        timestamp,
        dataLength: data?.length || 0, 
        error: error?.message || 'none' 
      });

      if (error) {
        console.error('❌ System Motivators Database error:', error);
        setGoalIdeas([]);
        return;
      }

      if (data && data.length > 0) {
        console.log('📋 RAW SYSTEM_MOTIVATORS DATA:');
        (data as unknown as SystemMotivator[]).forEach((item, index) => {
          console.log(`${index + 1}. ${item.title}:`, {
            id: item.id,
            title: item.title,
            link_url: item.link_url,
            male_image_url: item.male_image_url,
            female_image_url: item.female_image_url,
            display_order: item.display_order
          });
        });
        
        // Transform system motivators to AdminGoalIdea format
        const transformedIdeas = (data as unknown as SystemMotivator[]).map(transformToAdminGoalIdea);
        
        console.log('✅ TRANSFORMED IDEAS:');
        transformedIdeas.forEach((idea, index) => {
          console.log(`${index + 1}. ${idea.title}:`, {
            id: idea.id,
            title: idea.title,
            linkUrl: idea.linkUrl,
            maleImageUrl: idea.maleImageUrl,
            femaleImageUrl: idea.femaleImageUrl
          });
        });
        
        setGoalIdeas(transformedIdeas);
        console.log('🎯 STATE UPDATED with', transformedIdeas.length, 'fresh ideas');
      } else {
        console.log('❌ No system motivators found in database');
        setGoalIdeas([]);
      }
    } catch (error) {
      console.error('💥 CRITICAL ERROR loading goal ideas:', error);
      setGoalIdeas([]);
      } finally {
        setLoading(false);
      }
    });
    
    return result;
  };

  useEffect(() => {
    console.log('🚀 useAdminGoalIdeas useEffect triggered - refreshTrigger:', refreshTrigger);
    loadGoalIdeas(true); // Always force clear cache and fetch fresh
  }, [refreshTrigger]);

  const forceRefresh = () => {
    console.log('🔄 Force refreshing admin goal ideas from system_motivators...');
    // Clear only admin goal specific caches
    const adminGoalKeys = ['admin-goal-cache', 'admin-goal-timestamp', 'system-motivators-cache'];
    adminGoalKeys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    queryClient.invalidateQueries({ queryKey: ['admin-goals'] });
    queryClient.invalidateQueries({ queryKey: ['system-motivators'] });
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
    loading: loading || debounceLoading,
    refreshGoalIdeas: () => loadGoalIdeas(true),
    forceRefresh,
    updateGoalIdea,
    removeGoalIdea
  };
};