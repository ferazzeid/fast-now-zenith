import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserLibraryIndex } from '@/hooks/useUserLibraryIndex';

interface RecentFood {
  id: string;
  name: string;
  calories_per_100g: number;
  carbs_per_100g: number;
  image_url?: string;
  last_used: string;
  usage_count: number;
  is_favorite: boolean;
}

export const useRecentFoods = () => {
  const [recentFoods, setRecentFoods] = useState<RecentFood[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const libraryIndex = useUserLibraryIndex();

  const autoSaveToLibrary = useCallback(async (foodsToSave: Array<{
    name: string;
    calories_per_100g: number;
    carbs_per_100g: number;
    image_url?: string;
  }>) => {
    if (!user?.id || foodsToSave.length === 0) return;

    try {
      // Prepare foods for bulk insert
      const foodsForInsert = foodsToSave.map(food => ({
        user_id: user.id,
        name: food.name,
        calories_per_100g: food.calories_per_100g,
        carbs_per_100g: food.carbs_per_100g,
        image_url: food.image_url,
        is_favorite: false
      }));

      const { error } = await supabase
        .from('user_foods')
        .insert(foodsForInsert);

      if (error) throw error;

      // Update library index with new foods
      foodsForInsert.forEach(food => {
        libraryIndex.addLocal(food.name);
      });

    } catch (error) {
      console.error('Error auto-saving foods to library:', error);
    }
  }, [user?.id, libraryIndex]);

  const loadRecentFoods = useCallback(async () => {
    if (!user?.id) {
      setRecentFoods([]);
      return;
    }
    
    try {
      setLoading(true);
      
      // Get recent food entries from last 30 days
      const { data, error } = await supabase
        .from('food_entries')
        .select(`
          name,
          calories,
          carbs,
          image_url,
          created_at
        `)
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by food name and get most recent for each
      const foodMap = new Map<string, {
        name: string;
        calories_per_100g: number;
        carbs_per_100g: number;
        image_url?: string;
        last_used: string;
      }>();
      
      data?.forEach((entry) => {
        const key = entry.name.toLowerCase();
        if (!foodMap.has(key) || new Date(entry.created_at) > new Date(foodMap.get(key)!.last_used)) {
          foodMap.set(key, {
            name: entry.name,
            calories_per_100g: entry.calories || 0,
            carbs_per_100g: entry.carbs || 0,
            image_url: entry.image_url,
            last_used: entry.created_at
          });
        }
      });

      const recentFoodsArray = Array.from(foodMap.values());

      // Check which foods aren't in the library yet
      const foodsToSave = recentFoodsArray.filter(food => !libraryIndex.isInLibrary(food.name));
      
      // Auto-save foods that aren't in the library
      if (foodsToSave.length > 0) {
        await autoSaveToLibrary(foodsToSave);
      }

      // Now get the foods from the user's library (which now includes auto-saved foods)
      const { data: libraryFoods, error: libraryError } = await supabase
        .from('user_foods')
        .select('*')
        .eq('user_id', user.id)
        .in('name', recentFoodsArray.map(f => f.name))
        .order('updated_at', { ascending: false });

      if (libraryError) throw libraryError;

      // Convert to RecentFood format and add usage data
      const recentArray: RecentFood[] = libraryFoods?.map(food => ({
        id: food.id, // Use actual library food ID instead of recent- prefix
        name: food.name,
        calories_per_100g: food.calories_per_100g,
        carbs_per_100g: food.carbs_per_100g,
        image_url: food.image_url,
        last_used: foodMap.get(food.name.toLowerCase())?.last_used || food.updated_at,
        usage_count: 1,
        is_favorite: food.is_favorite || false
      })).slice(0, 20) || [];

      setRecentFoods(recentArray);
    } catch (error) {
      console.error('Error loading recent foods:', error);
      setRecentFoods([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, libraryIndex.isInLibrary, autoSaveToLibrary]);

  useEffect(() => {
    if (user && !libraryIndex.loading) {
      loadRecentFoods();
    }
  }, [user, libraryIndex.loading, loadRecentFoods]);

  return {
    recentFoods,
    loading: loading || libraryIndex.loading,
    refreshRecentFoods: loadRecentFoods
  };
};