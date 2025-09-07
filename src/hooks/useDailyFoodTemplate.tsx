import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRetryableSupabase } from '@/hooks/useRetryableSupabase';
import { useQueryClient } from '@tanstack/react-query';

interface DailyFoodTemplate {
  id: string;
  user_id: string;
  name: string;
  calories: number;
  carbs: number;
  serving_size: number;
  image_url?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface NewFoodTemplate {
  name: string;
  calories: number;
  carbs: number;
  serving_size: number;
  image_url?: string;
  sort_order?: number;
}

export const useDailyFoodTemplate = () => {
  const [templateFoods, setTemplateFoods] = useState<DailyFoodTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { executeWithRetry } = useRetryableSupabase();
  const queryClient = useQueryClient();

  const loadTemplate = useCallback(async () => {
    console.log('🍽️ loadTemplate called, user:', user?.id);
    if (!user) {
      console.log('🍽️ No user, stopping loading');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      console.log('🍽️ Fetching daily food templates for user:', user.id);
      const result = await executeWithRetry(async () => {
        return await supabase
          .from('daily_food_templates')
          .select('*')
          .eq('user_id', user.id)
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: false });
      });
      
      const { data, error } = result;
      console.log('🍽️ Template fetch result:', { data, error, count: data?.length });

      if (error) throw error;

      setTemplateFoods(data || []);
      console.log('🍽️ Template foods set:', data?.length || 0, 'items');
    } catch (error) {
      console.error('🍽️ Error loading daily food template:', error);
    } finally {
      setLoading(false);
    }
  }, [user, executeWithRetry]);

  const saveAsTemplate = useCallback(async (foodEntries: Array<{
    name: string;
    calories: number;
    carbs: number;
    serving_size: number;
    image_url?: string;
  }>, appendMode = false) => {
    if (!user) return { error: { message: 'User not authenticated' } };

    setLoading(true);
    try {
      if (!appendMode) {
        console.log('🍽️ Saving template - clearing existing for user:', user.id);
        // Clear existing template
        const { error: deleteError } = await supabase
          .from('daily_food_templates')
          .delete()
          .eq('user_id', user.id);

        if (deleteError) {
          console.error('🍽️ Error clearing existing template:', deleteError);
          throw deleteError;
        }
      } else {
        console.log('🍽️ Appending to existing template for user:', user.id);
      }

      // Insert new template foods
      const currentSortOrder = appendMode ? templateFoods.length : 0;
      const templateData = foodEntries.map((entry, index) => ({
        ...entry,
        user_id: user.id,
        sort_order: currentSortOrder + index
      }));

      console.log('🍽️ Inserting template data:', templateData);
      const { error } = await supabase
        .from('daily_food_templates')
        .insert(templateData);

      if (error) {
        console.error('🍽️ Error inserting template data:', error);
        throw error;
      }

      console.log('🍽️ Template saved successfully, reloading...');
      // Add a small delay and force refresh to ensure data consistency
      await new Promise(resolve => setTimeout(resolve, 500));
      await loadTemplate();
      return { error: null };
    } catch (error: any) {
      console.error('🍽️ Error saving daily template:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  }, [user, loadTemplate, templateFoods.length]);

  const clearTemplate = useCallback(async () => {
    if (!user) return { error: { message: 'User not authenticated' } };

    setLoading(true);
    try {
      const { error } = await supabase
        .from('daily_food_templates')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setTemplateFoods([]);
      return { error: null };
    } catch (error: any) {
      console.error('Error clearing daily template:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  }, [user]);

  const deleteTemplateFood = useCallback(async (foodId: string) => {
    if (!user) return { error: { message: 'User not authenticated' } };

    // Find the food to be deleted for optimistic update
    const foodToDelete = templateFoods.find(f => f.id === foodId);
    if (!foodToDelete) {
      return { error: { message: 'Food not found' } };
    }

    // Optimistic update - remove from local state immediately
    const previousFoods = [...templateFoods];
    setTemplateFoods(prev => prev.filter(f => f.id !== foodId));

    try {
      const { data, error } = await supabase
        .from('daily_food_templates')
        .delete()
        .eq('id', foodId)
        .eq('user_id', user.id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        // Rollback optimistic update
        setTemplateFoods(previousFoods);
        return { error: { message: 'Food item not found or already deleted' } };
      }

      return { error: null, deletedFood: foodToDelete };
    } catch (error: any) {
      console.error('Error deleting template food:', error);
      // Rollback optimistic update
      setTemplateFoods(previousFoods);
      return { error };
    }
  }, [user, templateFoods]);

  const applyTemplate = useCallback(async () => {
    if (!user || templateFoods.length === 0) return { error: { message: 'No template available' } };

    setLoading(true);
    try {
      // Get today's date for query key alignment
      const today = new Date().toISOString().split('T')[0];
      const foodEntriesQueryKey = ['food-entries', user.id, today];

      // Prepare food entries for insertion
      const foodEntries = templateFoods.map(template => ({
        name: template.name,
        calories: template.calories,
        carbs: template.carbs,
        serving_size: template.serving_size,
        image_url: template.image_url,
        user_id: user.id,
        consumed: false,
        source_date: today
      }));

      // OPTIMISTIC UPDATE: Add template foods to cache immediately
      const previousEntries = queryClient.getQueryData(foodEntriesQueryKey);
      
      // Generate optimistic entries with temporary IDs
      const optimisticEntries = templateFoods.map((template, index) => ({
        id: `template-optimistic-${Date.now()}-${index}`,
        user_id: user.id,
        name: template.name,
        calories: template.calories,
        carbs: template.carbs,
        serving_size: template.serving_size,
        consumed: false,
        image_url: template.image_url,
        created_at: new Date().toISOString(),
      }));

      // Update cache optimistically
      queryClient.setQueryData(
        foodEntriesQueryKey,
        (old: any[] = []) => [...optimisticEntries, ...old]
      );

      console.log('🍽️ Applied optimistic update for template:', optimisticEntries.length, 'items');

      // Insert into database
      const { data, error } = await supabase
        .from('food_entries')
        .insert(foodEntries)
        .select();

      if (error) throw error;

      // Replace optimistic entries with real data
      queryClient.setQueryData(
        foodEntriesQueryKey,
        (old: any[] = []) => {
          const withoutOptimistic = old.filter(entry => 
            !optimisticEntries.some(opt => opt.id === entry.id)
          );
          return [...(data || []), ...withoutOptimistic];
        }
      );

      // Invalidate daily totals to recalculate
      queryClient.invalidateQueries({ queryKey: ['daily-totals', user.id, today] });

      console.log('🍽️ Successfully applied template and updated cache with real data');
      return { error: null };
    } catch (error: any) {
      console.error('Error applying daily template:', error);
      
      // Rollback optimistic update on error
      const today = new Date().toISOString().split('T')[0];
      const foodEntriesQueryKey = ['food-entries', user.id, today];
      const previousEntries = queryClient.getQueryData(foodEntriesQueryKey);
      
      if (previousEntries) {
        queryClient.setQueryData(foodEntriesQueryKey, previousEntries);
      }
      
      return { error };
    } finally {
      setLoading(false);
    }
  }, [user, templateFoods, queryClient]);

  useEffect(() => {
    loadTemplate();
  }, [loadTemplate]);

  // Add to template with optional positioning
  const addToTemplate = useCallback(async (foodEntries: {
    name: string;
    calories: number;
    carbs: number;
    serving_size: number;
    image_url?: string;
  }[], insertAfterIndex?: number) => {
    if (!user) return { error: { message: 'User not authenticated' } };

    setLoading(true);
    try {
      let sortOrder: number;
      let templateData: any[];

      if (insertAfterIndex !== undefined && insertAfterIndex >= 0) {
        // Insert at specific position
        console.log('🍽️ Inserting into template at position:', insertAfterIndex + 1);
        
        // First, shift existing items to make room
        const itemsToShift = templateFoods.filter((_, index) => index > insertAfterIndex);
        
        if (itemsToShift.length > 0) {
          // Update sort_order for items that need to be shifted
          for (const item of itemsToShift) {
            const { error: shiftError } = await supabase
              .from('daily_food_templates')
              .update({ 
                sort_order: item.sort_order + foodEntries.length
              })
              .eq('id', item.id)
              .eq('user_id', user.id);

            if (shiftError) {
              console.error('🍽️ Error shifting template item:', shiftError);
              throw shiftError;
            }
          }
        }

        // Insert new items at the correct position
        sortOrder = insertAfterIndex + 1;
        templateData = foodEntries.map((entry, index) => ({
          ...entry,
          user_id: user.id,
          sort_order: sortOrder + index
        }));
      } else {
        // Append mode (existing behavior)
        console.log('🍽️ Appending to template');
        sortOrder = templateFoods.length;
        templateData = foodEntries.map((entry, index) => ({
          ...entry,
          user_id: user.id,
          sort_order: sortOrder + index
        }));
      }

      console.log('🍽️ Inserting template data:', templateData);
      const { error } = await supabase
        .from('daily_food_templates')
        .insert(templateData);

      if (error) {
        console.error('🍽️ Error inserting template data:', error);
        throw error;
      }

      console.log('🍽️ Template item(s) added successfully, reloading...');
      await new Promise(resolve => setTimeout(resolve, 300));
      await loadTemplate();
      return { error: null };
    } catch (error: any) {
      console.error('🍽️ Error adding to template:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  }, [user, loadTemplate, templateFoods]);

  return {
    templateFoods,
    loading,
    saveAsTemplate,
    addToTemplate,
    clearTemplate,
    applyTemplate,
    loadTemplate,
    deleteTemplateFood
  };
};