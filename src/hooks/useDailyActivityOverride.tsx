import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useStandardizedLoading } from './useStandardizedLoading';
import { useQueryClient } from '@tanstack/react-query';

interface DailyActivityOverride {
  id: string;
  user_id: string;
  date: string;
  activity_level: string;
  created_at: string;
  updated_at: string;
}

export const useDailyActivityOverride = () => {
  const [todayOverride, setTodayOverride] = useState<DailyActivityOverride | null>(null);
  const { execute, isLoading } = useStandardizedLoading();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const getTodayOverride = useCallback(async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      const { data, error } = await supabase
        .from('daily_activity_overrides')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (error) {
        console.error('Error fetching today\'s activity override:', error);
        return;
      }

      setTodayOverride(data);
    } catch (error) {
      console.error('Error in getTodayOverride:', error);
    }
  }, [user]);

  const setActivityOverride = useCallback(async (activityLevel: string, isPermanent: boolean = false) => {
    if (!user) return;

    await execute(async () => {
      const today = new Date().toISOString().split('T')[0];

      console.log('Setting activity override:', { activityLevel, isPermanent, userId: user.id, date: today });

      // Use upsert with conflict resolution
      const { data, error } = await supabase
        .from('daily_activity_overrides')
        .upsert({
          user_id: user.id,
          date: today,
          activity_level: activityLevel
        }, {
          onConflict: 'user_id,date'
        })
        .select()
        .single();

      if (error) {
        console.error('Database error setting activity override:', error);
        throw error;
      }

      console.log('Successfully set activity override:', data);

      setTodayOverride(data);
      
      // Invalidate relevant caches immediately for instant UI updates  
      queryClient.invalidateQueries({ queryKey: ['bmr-tdee-stable'] });
      queryClient.invalidateQueries({ queryKey: ['daily-deficit-stable', user.id, today] });
      queryClient.invalidateQueries({ queryKey: ['profile-optimized'] });

      // If permanent, also update the profile
      if (isPermanent) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ activity_level: activityLevel })
          .eq('user_id', user.id);

        if (profileError) {
          console.error('Error updating profile activity level:', profileError);
          toast({
            variant: "destructive",
            title: "Profile Update Failed",
            description: "Today's override saved, but couldn't update your default activity level."
          });
        } else {
          toast({
            title: "Activity Level Updated",
            description: "Your default activity level has been updated permanently."
          });
        }
      } else {
        toast({
          title: "Activity Override Set",
          description: "Activity level changed for today only."
        });
      }
    }, {
      onError: (error: any) => {
        console.error('Error setting activity override:', error);
        
        let errorMessage = "Unable to set activity override. Please try again.";
        if (error?.message?.includes('Failed to fetch')) {
          errorMessage = "Network connection issue. Please check your connection and try again.";
        } else if (error?.code) {
          errorMessage = `Database error (${error.code}). Please try again.`;
        }
        
        toast({
          variant: "destructive",
          title: "Update Failed",
          description: errorMessage
        });
      }
    });
  }, [user, toast, execute]);

  const clearTodayOverride = useCallback(async () => {
    if (!user || !todayOverride) return;

    await execute(async () => {
      const { error } = await supabase
        .from('daily_activity_overrides')
        .delete()
        .eq('id', todayOverride.id);

      if (error) throw error;

      setTodayOverride(null);
      
      // Invalidate relevant caches immediately
      const today = new Date().toISOString().split('T')[0];
      queryClient.invalidateQueries({ queryKey: ['bmr-tdee-stable'] });
      queryClient.invalidateQueries({ queryKey: ['daily-deficit-stable', user.id, today] });
      queryClient.invalidateQueries({ queryKey: ['profile-optimized'] });
      
      toast({
        title: "Override Cleared",
        description: "Reverted to your default activity level for today."
      });
    }, {
      onError: (error) => {
        console.error('Error clearing activity override:', error);
        toast({
          variant: "destructive",
          title: "Clear Failed",
          description: "Unable to clear override. Please try again."
        });
      }
    });
  }, [user, todayOverride, toast, execute]);

  useEffect(() => {
    if (user) {
      getTodayOverride();
    } else {
      setTodayOverride(null);
    }
  }, [user, getTodayOverride]);

  return {
    todayOverride,
    loading: isLoading,
    setActivityOverride,
    clearTodayOverride,
    refreshOverride: getTodayOverride
  };
};