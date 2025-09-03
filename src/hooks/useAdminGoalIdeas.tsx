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
    console.log('🔄 AGGRESSIVE REFRESH: Loading admin goal ideas from system_motivators');
    
    // ALWAYS clear ALL caches aggressively
    console.log('🧹 NUCLEAR CACHE CLEAR: Removing all possible cached data...');
    
    // Clear React Query cache
    queryClient.invalidateQueries();
    queryClient.clear();
    
    // Clear all localStorage entries that might contain cached data
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('goal') || key.includes('motivator') || key.includes('cache') || key.includes('admin'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Also clear sessionStorage
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('goal') || key.includes('motivator') || key.includes('cache') || key.includes('admin'))) {
          sessionStorage.removeItem(key);
        }
      }
    } catch (e) {
      console.warn('Cache clearing issue:', e);
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
  };

  useEffect(() => {
    console.log('🚀 useAdminGoalIdeas useEffect triggered - refreshTrigger:', refreshTrigger);
    loadGoalIdeas(true); // Always force clear cache and fetch fresh
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