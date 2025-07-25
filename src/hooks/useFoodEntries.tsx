import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface FoodEntry {
  id: string;
  user_id: string;
  name: string;
  image_url?: string;
  calories: number;
  carbs: number;
  serving_size: number;
  created_at: string;
}

interface NewFoodEntry {
  name: string;
  calories: number;
  carbs: number;
  serving_size: number;
  image_url?: string;
}

export const useFoodEntries = () => {
  const [todayEntries, setTodayEntries] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const loadTodayEntries = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data, error } = await supabase
        .from('food_entries')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTodayEntries(data || []);
    } catch (error) {
      console.error('Error loading today\'s food entries:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addFoodEntry = useCallback(async (entry: NewFoodEntry) => {
    if (!user) return { error: { message: 'User not authenticated' } };

    setLoading(true);
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

  // Calculate today's totals
  const todayTotals = {
    calories: todayEntries.reduce((sum, entry) => sum + entry.calories, 0),
    carbs: todayEntries.reduce((sum, entry) => sum + entry.carbs, 0)
  };

  useEffect(() => {
    loadTodayEntries();
  }, [loadTodayEntries]);

  return {
    todayEntries,
    todayTotals,
    loading,
    addFoodEntry,
    deleteFoodEntry,
    loadTodayEntries
  };
};