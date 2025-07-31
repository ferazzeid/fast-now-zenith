import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { subDays, startOfDay, endOfDay } from 'date-fns';

export const useCopyYesterdayFoods = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const copyYesterdayFoods = async () => {
    if (!user) {
      toast.error('User not authenticated');
      return { success: false };
    }

    setLoading(true);
    try {
      // Get yesterday's date range
      const yesterday = subDays(new Date(), 1);
      const yesterdayStart = startOfDay(yesterday);
      const yesterdayEnd = endOfDay(yesterday);

      // Fetch yesterday's food entries
      const { data: yesterdayEntries, error: fetchError } = await supabase
        .from('food_entries')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', yesterdayStart.toISOString())
        .lte('created_at', yesterdayEnd.toISOString())
        .order('created_at', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      if (!yesterdayEntries || yesterdayEntries.length === 0) {
        toast.info('No food entries found for yesterday');
        return { success: false };
      }

      // Create new entries for today (without id, user_id, and created_at)
      const newEntries = yesterdayEntries.map(entry => ({
        name: entry.name,
        calories: entry.calories,
        carbs: entry.carbs,
        serving_size: entry.serving_size,
        consumed: false, // Default to not consumed
        image_url: entry.image_url,
        user_id: user.id
      }));

      // Insert the new entries
      const { data: insertedEntries, error: insertError } = await supabase
        .from('food_entries')
        .insert(newEntries)
        .select();

      if (insertError) {
        throw insertError;
      }

      toast.success(`Copied ${insertedEntries?.length || 0} food items from yesterday`);
      return { success: true, count: insertedEntries?.length || 0 };

    } catch (error) {
      console.error('Error copying yesterday\'s foods:', error);
      toast.error('Failed to copy yesterday\'s foods');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return {
    copyYesterdayFoods,
    loading
  };
};