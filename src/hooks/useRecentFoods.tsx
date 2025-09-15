import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserLibraryIndex } from '@/hooks/useUserLibraryIndex';
import { useBaseQuery } from '@/hooks/useBaseQuery';
import { queryKeys } from '@/lib/query-client';

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
  const { user } = useAuth();
  const libraryIndex = useUserLibraryIndex();

  const autoSaveToLibrary = useCallback(async (foodsToSave: Array<{
    name: string;
    calories_per_100g: number;
    carbs_per_100g: number;
    image_url?: string;
  }>) => {
    if (!user?.id || foodsToSave.length === 0) return;

    console.log('🔥 RECENT FOODS - Auto-saving foods to library:', foodsToSave.map(f => f.name));

    try {
      // Check for existing foods first to prevent duplicates
      const { data: existingFoods, error: checkError } = await supabase
        .from('user_foods')
        .select('name')
        .eq('user_id', user.id)
        .in('name', foodsToSave.map(f => f.name));

      if (checkError) throw checkError;

      const existingFoodNames = new Set(existingFoods?.map(f => f.name.toLowerCase()) || []);
      const newFoods = foodsToSave.filter(food => 
        !existingFoodNames.has(food.name.toLowerCase())
      );

      console.log('🔥 RECENT FOODS - Existing foods found:', existingFoods?.length || 0);
      console.log('🔥 RECENT FOODS - New foods to insert:', newFoods.length);

      if (newFoods.length === 0) {
        console.log('🔥 RECENT FOODS - All foods already exist in library, skipping insert');
        return;
      }

      // Prepare foods for bulk insert
      const foodsForInsert = newFoods.map(food => ({
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

      console.log('🔥 RECENT FOODS - Successfully inserted new foods:', foodsForInsert.length);

      // Update library index with new foods
      foodsForInsert.forEach(food => {
        libraryIndex.addLocal(food.name);
      });

    } catch (error) {
      console.error('🔥 RECENT FOODS - Error auto-saving foods to library:', error);
    }
  }, [user?.id, libraryIndex]);

  // React Query for recent foods data
  const recentFoodsQuery = useBaseQuery(
    [...queryKeys.foodEntries(user?.id || ''), 'recent'],
    async (): Promise<RecentFood[]> => {
      if (!user?.id) return [];
      
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
        .order('name, updated_at', { ascending: false });

      if (libraryError) throw libraryError;

      console.log('🔥 RECENT FOODS - Raw library foods from DB:', libraryFoods?.length || 0);

      // Deduplicate by name (keep the most recent updated_at)
      const deduplicatedFoodMap = new Map<string, any>();
      libraryFoods?.forEach(food => {
        const key = food.name.toLowerCase();
        if (!deduplicatedFoodMap.has(key)) {
          deduplicatedFoodMap.set(key, food);
        }
      });

      const deduplicatedFoods = Array.from(deduplicatedFoodMap.values());
      console.log('🔥 RECENT FOODS - Deduplicated library foods:', deduplicatedFoods.length);

      // Convert to RecentFood format and add usage data
      const recentArray: RecentFood[] = deduplicatedFoods?.map(food => ({
        id: food.id, // Use actual library food ID instead of recent- prefix
        name: food.name,
        calories_per_100g: food.calories_per_100g,
        carbs_per_100g: food.carbs_per_100g,
        image_url: food.image_url,
        last_used: foodMap.get(food.name.toLowerCase())?.last_used || food.updated_at,
        usage_count: 1,
        is_favorite: food.is_favorite || false
      })).slice(0, 20) || [];

      console.log('🔥 RECENT FOODS - Final recent foods array:', recentArray.map(f => ({ name: f.name, id: f.id, is_favorite: f.is_favorite })));

      return recentArray;
    },
    {
      enabled: !!user && !libraryIndex.loading,
      staleTime: 2 * 60 * 1000, // 2 minute stale time - reasonable for recent foods
    }
  );

  const refreshRecentFoods = useCallback(async () => {
    // Force refetch recent foods data
    await recentFoodsQuery.refetch();
  }, [recentFoodsQuery]);

  return {
    recentFoods: recentFoodsQuery.data || [],
    loading: recentFoodsQuery.isInitialLoading || libraryIndex.loading,
    refreshRecentFoods
  };
};
