import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { startOfDay, endOfDay } from 'date-fns';
import { useStandardizedLoading } from './useStandardizedLoading';

export const useCopyHistoricalDay = () => {
  const { execute, isLoading } = useStandardizedLoading();
  const { user } = useAuth();

  const copyDayToToday = async (date: string) => {
    if (!user) {
      toast.error('User not authenticated');
      return { success: false };
    }

    const result = await execute(async () => {
      // Get the date range for the specified day
      const targetDate = new Date(date);
      const dayStart = startOfDay(targetDate);
      const dayEnd = endOfDay(targetDate);

      // Fetch food entries for the specified day (only consumed items like the UI shows)
      const { data: dayEntries, error: fetchError } = await supabase
        .from('food_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('consumed', true) // Only copy consumed items like displayed in history
        .gte('created_at', dayStart.toISOString())
        .lte('created_at', dayEnd.toISOString())
        .order('created_at', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      if (!dayEntries || dayEntries.length === 0) {
        toast.info('No food entries found for this day');
        return { success: false };
      }

      // Create new entries for today
      const newEntries = dayEntries.map(entry => ({
        name: entry.name,
        calories: entry.calories,
        carbs: entry.carbs,
        serving_size: entry.serving_size,
        consumed: false, // Default to not consumed (planning)
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

      const formattedDate = new Date(date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      
      toast.success(`Copied ${insertedEntries?.length || 0} food items from ${formattedDate} to today's plan`);
      return { success: true, count: insertedEntries?.length || 0 };
    }, {
      onError: (error) => {
        console.error('Error copying day\'s foods:', error);
        toast.error('Failed to copy food items');
      }
    });

    return result.success ? result.data : { success: false };
  };

  return {
    copyDayToToday,
    loading: isLoading
  };
};