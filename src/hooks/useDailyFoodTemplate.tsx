import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRetryableSupabase } from '@/hooks/useRetryableSupabase';
import { useBaseQuery } from '@/hooks/useBaseQuery';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { queryKeys } from '@/lib/query-client';

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
  const { user } = useAuth();
  const { executeWithRetry } = useRetryableSupabase();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // React Query for template data - no caching since templates change frequently
  const templateQuery = useBaseQuery(
    [...queryKeys.dailyTemplate(user?.id || '')],
    async (): Promise<DailyFoodTemplate[]> => {
      if (!user?.id) return [];
      
      const result = await executeWithRetry(async () => {
        return await supabase
          .from('daily_food_templates')
          .select('*')
          .eq('user_id', user.id)
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: false });
      });
      
      const { data, error } = result;
      if (error) throw error;
      return data || [];
    },
    {
      enabled: !!user?.id,
      staleTime: 0, // Templates change frequently, always fresh
    }
  );

  // Save as template mutation
  const saveAsTemplateMutation = useMutation({
    mutationFn: async ({ foodEntries, appendMode }: {
      foodEntries: Array<{
        name: string;
        calories: number;
        carbs: number;
        serving_size: number;
        image_url?: string;
      }>;
      appendMode: boolean;
    }) => {
      if (!user) throw new Error('User not authenticated');

      if (!appendMode) {
        // Clear existing template
        const { error: deleteError } = await supabase
          .from('daily_food_templates')
          .delete()
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;
      }

      // Insert new template foods
      const currentSortOrder = appendMode ? (templateQuery.data?.length || 0) : 0;
      const templateData = foodEntries.map((entry, index) => ({
        ...entry,
        user_id: user.id,
        sort_order: currentSortOrder + index
      }));

      const { data, error } = await supabase
        .from('daily_food_templates')
        .insert(templateData)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate template cache immediately
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyTemplate(user?.id || '') });
    },
    onError: (error: any) => {
      console.error('Error saving daily template:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save template"
      });
    }
  });

  // Clear template mutation
  const clearTemplateMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('daily_food_templates')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyTemplate(user?.id || '') });
    },
    onError: (error: any) => {
      console.error('Error clearing daily template:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to clear template"
      });
    }
  });

  // Delete template food mutation
  const deleteTemplateFoodMutation = useMutation({
    mutationFn: async (foodId: string) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('daily_food_templates')
        .delete()
        .eq('id', foodId)
        .eq('user_id', user.id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('Food item not found or already deleted');
      }

      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyTemplate(user?.id || '') });
    },
    onError: (error: any) => {
      console.error('Error deleting template food:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete template food"
      });
    }
  });

  // Apply template mutation
  const applyTemplateMutation = useMutation({
    mutationFn: async () => {
      if (!user || !templateQuery.data?.length) {
        throw new Error('No template available');
      }

      // Get today's date for query key alignment
      const today = new Date().toISOString().split('T')[0];
      const foodEntriesQueryKey = ['food-entries', user.id, today];

      // Prepare food entries for insertion
      const foodEntries = templateQuery.data.map(template => ({
        name: template.name,
        calories: template.calories,
        carbs: template.carbs,
        serving_size: template.serving_size,
        image_url: template.image_url,
        user_id: user.id,
        consumed: false,
        source_date: today
      }));

      // Insert into database
      const { data, error } = await supabase
        .from('food_entries')
        .insert(foodEntries)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Invalidate food entries and daily totals to show new entries immediately
      const today = new Date().toISOString().split('T')[0];
      queryClient.invalidateQueries({ queryKey: ['food-entries', user?.id, today] });
      queryClient.invalidateQueries({ queryKey: ['daily-totals', user?.id, today] });
    },
    onError: (error: any) => {
      console.error('Error applying daily template:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to apply template"
      });
    }
  });

  // Add to template mutation
  const addToTemplateMutation = useMutation({
    mutationFn: async ({ foodEntries, insertAfterIndex }: {
      foodEntries: {
        name: string;
        calories: number;
        carbs: number;
        serving_size: number;
        image_url?: string;
      }[];
      insertAfterIndex?: number;
    }) => {
      if (!user) throw new Error('User not authenticated');

      let sortOrder: number;
      let templateData: any[];

      if (insertAfterIndex !== undefined && insertAfterIndex >= 0) {
        // Insert at specific position
        const existingItems = templateQuery.data || [];
        const itemsToShift = existingItems.filter((_, index) => index > insertAfterIndex);
        
        // Shift existing items
        if (itemsToShift.length > 0) {
          for (const item of itemsToShift) {
            const { error: shiftError } = await supabase
              .from('daily_food_templates')
              .update({ 
                sort_order: item.sort_order + foodEntries.length
              })
              .eq('id', item.id)
              .eq('user_id', user.id);

            if (shiftError) throw shiftError;
          }
        }

        sortOrder = insertAfterIndex + 1;
        templateData = foodEntries.map((entry, index) => ({
          ...entry,
          user_id: user.id,
          sort_order: sortOrder + index
        }));
      } else {
        // Append mode
        sortOrder = templateQuery.data?.length || 0;
        templateData = foodEntries.map((entry, index) => ({
          ...entry,
          user_id: user.id,
          sort_order: sortOrder + index
        }));
      }

      const { data, error } = await supabase
        .from('daily_food_templates')
        .insert(templateData)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyTemplate(user?.id || '') });
    },
    onError: (error: any) => {
      console.error('Error adding to template:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add to template"
      });
    }
  });

  // Wrapper functions for backward compatibility
  const saveAsTemplate = useCallback(async (foodEntries: Array<{
    name: string;
    calories: number;
    carbs: number;
    serving_size: number;
    image_url?: string;
  }>, appendMode = false) => {
    try {
      await saveAsTemplateMutation.mutateAsync({ foodEntries, appendMode });
      return { error: null };
    } catch (error) {
      return { error };
    }
  }, [saveAsTemplateMutation]);

  const clearTemplate = useCallback(async () => {
    try {
      await clearTemplateMutation.mutateAsync();
      return { error: null };
    } catch (error) {
      return { error };
    }
  }, [clearTemplateMutation]);

  const deleteTemplateFood = useCallback(async (foodId: string) => {
    try {
      const deletedFood = await deleteTemplateFoodMutation.mutateAsync(foodId);
      return { error: null, deletedFood };
    } catch (error) {
      return { error };
    }
  }, [deleteTemplateFoodMutation]);

  const applyTemplate = useCallback(async () => {
    try {
      await applyTemplateMutation.mutateAsync();
      return { error: null };
    } catch (error) {
      return { error };
    }
  }, [applyTemplateMutation]);

  const addToTemplate = useCallback(async (foodEntries: {
    name: string;
    calories: number;
    carbs: number;
    serving_size: number;
    image_url?: string;
  }[], insertAfterIndex?: number) => {
    try {
      await addToTemplateMutation.mutateAsync({ foodEntries, insertAfterIndex });
      return { error: null };
    } catch (error) {
      return { error };
    }
  }, [addToTemplateMutation]);

  const loadTemplate = useCallback(async () => {
    // Force refetch template data
    await templateQuery.refetch();
  }, [templateQuery]);

  return {
    templateFoods: templateQuery.data || [],
    loading: templateQuery.isInitialLoading || 
             saveAsTemplateMutation.isPending ||
             clearTemplateMutation.isPending ||
             deleteTemplateFoodMutation.isPending ||
             applyTemplateMutation.isPending ||
             addToTemplateMutation.isPending,
    saveAsTemplate,
    addToTemplate,
    clearTemplate,
    applyTemplate,
    loadTemplate,
    deleteTemplateFood
  };
};