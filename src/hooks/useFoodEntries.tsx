import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRetryableSupabase } from '@/hooks/useRetryableSupabase';

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
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { executeWithRetry } = useRetryableSupabase();

  const loadTodayEntries = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
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
          .order('created_at', { ascending: false });
      });
      
      const { data, error } = result;

      if (error) throw error;

      setTodayEntries(data || []);
    } catch (error) {
      console.error('Error loading today\'s food entries:', error);
    } finally {
      setLoading(false);
    }
  }, [user, executeWithRetry]);

  const addFoodEntry = useCallback(async (entry: NewFoodEntry) => {
    if (!user) return { error: { message: 'User not authenticated' } };

    setLoading(true);
    try {
      // Use AI-enhanced edge function for food entry
      const { data, error } = await supabase.functions.invoke('add-food-entry', {
        body: {
          name: entry.name,
          serving_size: entry.serving_size || 100,
          calories: entry.calories || 0,
          carbs: entry.carbs || 0,
          consumed: entry.consumed || true,
          image_url: entry.image_url || null
        }
      });

      if (error) throw error;

      // Refresh today's entries
      await loadTodayEntries();
      
      return { 
        data: data.food_entry, 
        error: null, 
        ai_enhanced: data.ai_enhanced 
      };
    } catch (error: any) {
      console.error('Error adding food entry:', error);
      return { error, data: null };
    } finally {
      setLoading(false);
    }
  }, [user, loadTodayEntries]);

  const updateFoodEntry = useCallback(async (entryId: string, updates: Partial<NewFoodEntry>) => {
    if (!user) return { error: { message: 'User not authenticated' } };

    setLoading(true);
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
      setLoading(false);
    }
  }, [user, loadTodayEntries]);

  const deleteFoodEntry = useCallback(async (entryId: string) => {
    if (!user) return { error: { message: 'User not authenticated' } };

    setLoading(true);
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
      setLoading(false);
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