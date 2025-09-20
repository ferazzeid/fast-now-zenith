import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface ConflictCheckParams {
  startTime: Date;
  endTime: Date;
  excludeSessionId?: string;
}

export const useFastingConflictCheck = () => {
  const { user } = useAuth();

  const checkConflictMutation = useMutation({
    mutationFn: async ({ startTime, endTime, excludeSessionId }: ConflictCheckParams) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('check_fast_conflicts', {
        p_user_id: user.id,
        p_start_time: startTime.toISOString(),
        p_end_time: endTime.toISOString(),
        p_exclude_session_id: excludeSessionId || null
      });

      if (error) {
        console.error('Error checking fast conflicts:', error);
        throw error;
      }

      return data as boolean; // Returns true if no conflicts, false if conflicts exist
    },
    onError: (error) => {
      console.error('Conflict check failed:', error);
      toast.error('Failed to check for scheduling conflicts');
    }
  });

  const checkForConflicts = async (params: ConflictCheckParams): Promise<boolean> => {
    try {
      const result = await checkConflictMutation.mutateAsync(params);
      return result;
    } catch (error) {
      console.error('Conflict check error:', error);
      return false; // Assume conflict on error for safety
    }
  };

  return {
    checkForConflicts,
    isChecking: checkConflictMutation.isPending,
    error: checkConflictMutation.error
  };
};