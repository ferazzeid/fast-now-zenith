import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { addDays, subDays, format } from 'date-fns';

export interface FastingTimelineSlot {
  id: string;
  user_id: string;
  slot_date: string;
  fast_type: 'extended' | 'intermittent';
  status: 'in_progress' | 'completed' | 'cancelled';
  fasting_session_id?: string;
  if_session_id?: string;
  hours_into_fast?: number;
  fast_start_time?: string;
  fast_end_time?: string;
  created_at: string;
  updated_at: string;
}

export const useFastingTimelineSlots = () => {
  const { user } = useAuth();

  // Calculate date range: 30 days past + today + 7 days future = 38 days total
  const today = new Date();
  const startDate = format(subDays(today, 30), 'yyyy-MM-dd');
  const endDate = format(addDays(today, 7), 'yyyy-MM-dd');

  const timelineSlotsQuery = useQuery({
    queryKey: ['fasting-timeline-slots', user?.id, startDate, endDate],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('fasting_timeline_slots')
        .select('*')
        .eq('user_id', user.id)
        .gte('slot_date', startDate)
        .lte('slot_date', endDate)
        .order('slot_date', { ascending: true });

      if (error) {
        console.error('Error fetching timeline slots:', error);
        throw error;
      }

      return data as FastingTimelineSlot[];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60, // 1 minute for live updates
  });

  // Helper function to get slots for a specific date
  const getSlotsForDate = (date: string) => {
    return timelineSlotsQuery.data?.filter(slot => slot.slot_date === date) || [];
  };

  // Helper function to get extended fast slot for a date
  const getExtendedFastForDate = (date: string) => {
    return timelineSlotsQuery.data?.find(
      slot => slot.slot_date === date && slot.fast_type === 'extended'
    );
  };

  // Helper function to get IF slot for a date
  const getIFSessionForDate = (date: string) => {
    return timelineSlotsQuery.data?.find(
      slot => slot.slot_date === date && slot.fast_type === 'intermittent'
    );
  };

  // Generate array of all dates in range for UI
  const generateDateRange = () => {
    const dates = [];
    for (let i = 30; i >= -7; i--) {
      const date = i > 0 ? subDays(today, i) : addDays(today, Math.abs(i));
      dates.push({
        date: format(date, 'yyyy-MM-dd'),
        displayDate: date,
        isToday: format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'),
        isPast: date < today,
        isFuture: date > today,
        extendedFast: getExtendedFastForDate(format(date, 'yyyy-MM-dd')),
        ifSession: getIFSessionForDate(format(date, 'yyyy-MM-dd')),
        allSlots: getSlotsForDate(format(date, 'yyyy-MM-dd'))
      });
    }
    return dates;
  };

  return {
    timelineSlots: timelineSlotsQuery.data || [],
    loading: timelineSlotsQuery.isLoading,
    error: timelineSlotsQuery.error,
    getSlotsForDate,
    getExtendedFastForDate,
    getIFSessionForDate,
    generateDateRange,
    refetch: timelineSlotsQuery.refetch,
    dateRange: { startDate, endDate }
  };
};