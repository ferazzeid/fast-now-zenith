import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface RecentFood {
  id: string;
  name: string;
  calories_per_100g: number;
  carbs_per_100g: number;
  image_url?: string;
  last_used: string;
  usage_count: number;
}

export const useRecentFoods = () => {
  const [recentFoods, setRecentFoods] = useState<RecentFood[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadRecentFoods();
    }
  }, [user]);

  const loadRecentFoods = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get recent food entries that aren't in user's personal library
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
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by food name and get most recent for each
      const foodMap = new Map<string, RecentFood>();
      
      data?.forEach((entry) => {
        const key = entry.name.toLowerCase();
        if (!foodMap.has(key) || new Date(entry.created_at) > new Date(foodMap.get(key)!.last_used)) {
          foodMap.set(key, {
            id: `recent-${key}`,
            name: entry.name,
            calories_per_100g: entry.calories || 0,
            carbs_per_100g: entry.carbs || 0,
            image_url: entry.image_url,
            last_used: entry.created_at,
            usage_count: 1
          });
        }
      });

      // Convert to array and limit to 20 most recent
      const recentArray = Array.from(foodMap.values())
        .sort((a, b) => new Date(b.last_used).getTime() - new Date(a.last_used).getTime())
        .slice(0, 20);

      setRecentFoods(recentArray);
    } catch (error) {
      console.error('Error loading recent foods:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    recentFoods,
    loading,
    refreshRecentFoods: loadRecentFoods
  };
};