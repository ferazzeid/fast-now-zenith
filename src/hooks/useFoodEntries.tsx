import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRetryableSupabase } from '@/hooks/useRetryableSupabase';
import { useLoadingManager } from '@/hooks/useLoadingManager';

interface FoodEntry {
  id: string;
  user_id: string;
  name: string;
  image_url?: string;
  calories: number;
  carbs: number;
  serving_size: number;
  created_at: string;
  consumed: boolean;
}

interface NewFoodEntry {
  name: string;
  calories: number;
  carbs: number;
  serving_size: number;
  image_url?: string;
  consumed?: boolean;
}

export const useFoodEntries = () => {
  const [todayEntries, setTodayEntries] = useState<FoodEntry[]>([]);
  const { user } = useAuth();
  const { executeWithRetry } = useRetryableSupabase();
  const { loading, startLoading, stopLoading } = useLoadingManager('food-entries');

  const loadTodayEntries = useCallback(async () => {
    if (!user) {
      stopLoading();
      return;
    }
    
    startLoading();
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const result = await executeWithRetry(async () => {
        return await supabase
          .from('food_entries')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', today.toISOString())
          .lt('created_at', tomorrow.toISOString())
          .order('consumed', { ascending: true })
          .order('created_at', { ascending: false });
      });
      
      const { data, error } = result;

      if (error) throw error;

      setTodayEntries(data || []);
    } catch (error) {
      console.error('Error loading today\'s food entries:', error);
    } finally {
      stopLoading();
    }
  }, [user, executeWithRetry, startLoading, stopLoading]);

  const addFoodEntry = useCallback(async (entry: NewFoodEntry) => {
    if (!user) return { error: { message: 'User not authenticated' } };

    startLoading();
    try {
      const { data, error } = await supabase
        .from('food_entries')
        .insert({
          ...entry,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh today's entries
      await loadTodayEntries();
      
      return { data, error: null };
    } catch (error: any) {
      console.error('Error adding food entry:', error);
      return { error, data: null };
    } finally {
      stopLoading();
    }
  }, [user, loadTodayEntries]);

  const updateFoodEntry = useCallback(async (entryId: string, updates: Partial<NewFoodEntry>) => {
    if (!user) return { error: { message: 'User not authenticated' } };

    startLoading();
    try {
      const { data, error } = await supabase
        .from('food_entries')
        .update(updates)
        .eq('id', entryId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Refresh today's entries
      await loadTodayEntries();
      
      return { data, error: null };
    } catch (error: any) {
      console.error('Error updating food entry:', error);
      return { error, data: null };
    } finally {
      stopLoading();
    }
  }, [user, loadTodayEntries]);

  const deleteFoodEntry = useCallback(async (entryId: string) => {
    if (!user) return { error: { message: 'User not authenticated' } };

    startLoading();
    try {
      const { error } = await supabase
        .from('food_entries')
        .delete()
        .eq('id', entryId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Refresh today's entries
      await loadTodayEntries();
      
      return { error: null };
    } catch (error: any) {
      console.error('Error deleting food entry:', error);
      return { error };
    } finally {
      stopLoading();
    }
  }, [user, loadTodayEntries]);

  // Calculate today's totals (only consumed foods)
  const todayTotals = {
    calories: todayEntries.filter(entry => entry.consumed).reduce((sum, entry) => sum + entry.calories, 0),
    carbs: todayEntries.filter(entry => entry.consumed).reduce((sum, entry) => sum + entry.carbs, 0)
  };

  const toggleConsumption = useCallback(async (entryId: string, consumed: boolean) => {
    return updateFoodEntry(entryId, { consumed });
  }, [updateFoodEntry]);

  useEffect(() => {
    loadTodayEntries();
  }, [loadTodayEntries]);

  return {
    todayEntries,
    todayTotals,
    loading,
    addFoodEntry,
    updateFoodEntry,
    deleteFoodEntry,
    toggleConsumption,
    loadTodayEntries
  };
};