import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRetryableSupabase } from '@/hooks/useRetryableSupabase';
import { useLoadingManager } from '@/hooks/useLoadingManager';

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
  const { user } = useAuth();
  const { executeWithRetry } = useRetryableSupabase();
  const { loading, startLoading, stopLoading } = useLoadingManager('daily-template');

  const loadTemplate = useCallback(async () => {
    console.log('🍽️ loadTemplate called, user:', user?.id);
    if (!user) {
      console.log('🍽️ No user, stopping loading');
      stopLoading();
      return;
    }
    
    startLoading();
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
      stopLoading();
    }
  }, [user, executeWithRetry, startLoading, stopLoading]);

  const saveAsTemplate = useCallback(async (foodEntries: Array<{
    name: string;
    calories: number;
    carbs: number;
    serving_size: number;
    image_url?: string;
  }>) => {
    if (!user) return { error: { message: 'User not authenticated' } };

    startLoading();
    try {
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

      // Insert new template foods
      const templateData = foodEntries.map((entry, index) => ({
        ...entry,
        user_id: user.id,
        sort_order: index
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
      await loadTemplate();
      return { error: null };
    } catch (error: any) {
      console.error('🍽️ Error saving daily template:', error);
      return { error };
    } finally {
      stopLoading();
    }
  }, [user, loadTemplate, startLoading, stopLoading]);

  const clearTemplate = useCallback(async () => {
    if (!user) return { error: { message: 'User not authenticated' } };

    startLoading();
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
      stopLoading();
    }
  }, [user, startLoading, stopLoading]);

  const applyTemplate = useCallback(async () => {
    if (!user || templateFoods.length === 0) return { error: { message: 'No template available' } };

    startLoading();
    try {
      // Get today's date for source tracking
      const today = new Date().toISOString().split('T')[0];

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

      const { error } = await supabase
        .from('food_entries')
        .insert(foodEntries);

      if (error) throw error;

      return { error: null };
    } catch (error: any) {
      console.error('Error applying daily template:', error);
      return { error };
    } finally {
      stopLoading();
    }
  }, [user, templateFoods, startLoading, stopLoading]);

  useEffect(() => {
    loadTemplate();
  }, [loadTemplate]);

  return {
    templateFoods,
    loading,
    saveAsTemplate,
    clearTemplate,
    applyTemplate,
    loadTemplate
  };
};