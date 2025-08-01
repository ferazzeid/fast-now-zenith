import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

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
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

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

    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // Upsert the override for today
      const { data, error } = await supabase
        .from('daily_activity_overrides')
        .upsert({
          user_id: user.id,
          date: today,
          activity_level: activityLevel
        })
        .select()
        .single();

      if (error) throw error;

      setTodayOverride(data);

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
    } catch (error) {
      console.error('Error setting activity override:', error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Unable to set activity override. Please try again."
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const clearTodayOverride = useCallback(async () => {
    if (!user || !todayOverride) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('daily_activity_overrides')
        .delete()
        .eq('id', todayOverride.id);

      if (error) throw error;

      setTodayOverride(null);
      toast({
        title: "Override Cleared",
        description: "Reverted to your default activity level for today."
      });
    } catch (error) {
      console.error('Error clearing activity override:', error);
      toast({
        variant: "destructive",
        title: "Clear Failed",
        description: "Unable to clear override. Please try again."
      });
    } finally {
      setLoading(false);
    }
  }, [user, todayOverride, toast]);

  useEffect(() => {
    if (user) {
      getTodayOverride();
    } else {
      setTodayOverride(null);
    }
  }, [user, getTodayOverride]);

  return {
    todayOverride,
    loading,
    setActivityOverride,
    clearTodayOverride,
    refreshOverride: getTodayOverride
  };
};