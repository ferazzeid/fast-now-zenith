import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from './use-toast';
import { useLoadingManager } from './useLoadingManager';
import { useMotivatorCache } from './useMotivatorCache';

export interface Motivator {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  imageUrl?: string;
}

export interface CreateMotivatorData {
  title: string;
  content: string;
  category: string;
  imageUrl?: string;
}

export const useMotivators = () => {
  const [motivators, setMotivators] = useState<Motivator[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();
  const { loading, startLoading, stopLoading } = useLoadingManager('motivators');
  const { cachedMotivators, shouldFetchMotivators, cacheMotivators, invalidateCache } = useMotivatorCache();

  const loadMotivators = async (forceRefresh = false) => {
    if (!user) {
      stopLoading();
      return;
    }

    // Use cached data if available and not forcing refresh
    if (!forceRefresh && Array.isArray(cachedMotivators) && cachedMotivators.length > 0 && !shouldFetchMotivators()) {
      console.log('Using cached motivators, skipping API call', { count: cachedMotivators.length });
      setMotivators(cachedMotivators);
      stopLoading();
      return;
    }

    startLoading();
    try {
      const { data, error } = await supabase
        .from('motivators')
        .select('*, image_url')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data to include imageUrl property with proper fallback
      const transformedData = (data || []).map((item: any) => ({
        ...item,
        imageUrl: item.image_url || item.imageUrl || null // Handle both field names and provide fallback
      }));
      
      setMotivators(transformedData);
      // Cache the fresh data
      cacheMotivators(transformedData);
      
      console.log('Loaded fresh motivators from API:', transformedData.length);
    } catch (error) {
      console.error('Error loading motivators:', error);
      
      // If we have cached data, use it as fallback
      if (cachedMotivators && cachedMotivators.length > 0) {
        console.log('Using cached motivators as fallback');
        setMotivators(cachedMotivators);
      } else {
        toast({
          title: "Error loading motivators",
          description: "Please check your connection and try again.",
          variant: "destructive",
        });
      }
    } finally {
      stopLoading();
    }
  };

  const createMotivator = async (motivatorData: CreateMotivatorData): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('motivators')
        .insert({
          user_id: user.id,
          title: motivatorData.title,
          content: motivatorData.content,
          category: motivatorData.category,
          image_url: motivatorData.imageUrl,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const transformedData = { ...data, imageUrl: data.image_url };
        setMotivators(prev => [transformedData as Motivator, ...prev]);
        toast({
          title: "✨ Motivator Created!",
          description: "Your new motivator has been saved.",
        });
        return data.id;
      }
      return null;
    } catch (error) {
      console.error('Error creating motivator:', error);
      toast({
        title: "Error creating motivator",
        description: "Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateMotivator = async (id: string, updates: Partial<CreateMotivatorData>): Promise<boolean> => {
    if (!user) return false;

    try {
      // Map imageUrl to image_url for database
      const dbUpdates: any = { ...updates };
      if (updates.imageUrl !== undefined) {
        dbUpdates.image_url = updates.imageUrl;
        delete dbUpdates.imageUrl;
      }

      const { error } = await supabase
        .from('motivators')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setMotivators(prev => 
        prev.map(m => m.id === id ? { ...m, ...updates } : m)
      );

      toast({
        title: "✨ Motivator Updated!",
        description: "Your changes have been saved.",
      });
      return true;
    } catch (error) {
      console.error('Error updating motivator:', error);
      toast({
        title: "Error updating motivator",
        description: "Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const createMultipleMotivators = async (motivators: CreateMotivatorData[]): Promise<string[]> => {
    if (!user || !motivators.length) return [];

    try {
      const motivatorData = motivators.map(motivator => ({
        user_id: user.id,
        title: motivator.title,
        content: motivator.content,
        category: motivator.category || 'general',
        image_url: motivator.imageUrl,
        is_active: true
      }));

      const { data, error } = await supabase
        .from('motivators')
        .insert(motivatorData)
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        const transformedData = data.map(item => ({ ...item, imageUrl: item.image_url }));
        setMotivators(prev => [...transformedData as Motivator[], ...prev]);
        toast({
          title: "✨ Motivators Created!",
          description: `Successfully created ${data.length} motivator${data.length > 1 ? 's' : ''}`,
        });
        return data.map(item => item.id);
      }
      return [];
    } catch (error) {
      console.error('Error creating multiple motivators:', error);
      toast({
        title: "Error creating motivators",
        description: "Please try again.",
        variant: "destructive",
      });
      return [];
    }
  };

  const deleteMotivator = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('motivators')
        .update({ is_active: false })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setMotivators(prev => prev.filter(m => m.id !== id));
      
      toast({
        title: "🗑️ Motivator Removed",
        description: "Motivator has been deleted.",
      });
      return true;
    } catch (error) {
      console.error('Error deleting motivator:', error);
      toast({
        title: "Error deleting motivator",
        description: "Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Load cached motivators immediately on mount, then check for fresh data
  useEffect(() => {
    if (user) {
      // First load cached data if available (instant)
      if (cachedMotivators) {
        setMotivators(cachedMotivators);
        stopLoading();
      }
      // Then check if we need fresh data (background)
      loadMotivators();
    }
  }, [user?.id]); // Only depend on user.id to avoid unnecessary re-runs

  // Refresh on tab visibility if needed
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const needsFetch = shouldFetchMotivators() || motivators.length === 0;
        if (needsFetch) {
          console.log('🔄 Visibility change: refetching motivators');
          loadMotivators();
        } else {
          console.log('✅ Visibility change: cache fresh, no fetch');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [shouldFetchMotivators, motivators.length, loadMotivators]);

  return {
    motivators,
    loading,
    createMotivator: async (motivatorData: CreateMotivatorData) => {
      const result = await createMotivator(motivatorData);
      if (result) {
        invalidateCache(); // Clear cache when new motivator is created
        await loadMotivators(true); // Force refresh
      }
      return result;
    },
    createMultipleMotivators: async (motivators: CreateMotivatorData[]) => {
      const result = await createMultipleMotivators(motivators);
      if (result.length > 0) {
        invalidateCache(); // Clear cache when new motivators are created
        await loadMotivators(true); // Force refresh
      }
      return result;
    },
    updateMotivator: async (id: string, updates: Partial<CreateMotivatorData>) => {
      const result = await updateMotivator(id, updates);
      if (result) {
        invalidateCache(); // Clear cache when motivator is updated
        await loadMotivators(true); // Force refresh
      }
      return result;
    },
    deleteMotivator: async (id: string) => {
      const result = await deleteMotivator(id);
      if (result) {
        invalidateCache(); // Clear cache when motivator is deleted
      }
      return result;
    },
    refreshMotivators: () => loadMotivators(true) // Always force refresh when manually called
  };
};