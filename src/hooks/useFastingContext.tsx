import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface FastingContext {
  isCurrentlyFasting: boolean;
  currentFastDuration: number; // in hours
  fastingGoal: number; // in hours
  timeUntilGoal: number; // in hours
  lastFastCompleted: Date | null;
  averageFastDuration: number; // in hours
  totalFastsCompleted: number;
  currentTime: string;
  currentDate: string;
  suggestedMealTime: string;
}

export const useFastingContext = () => {
  const [context, setContext] = useState<FastingContext | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchFastingContext = async (): Promise<FastingContext | null> => {
    if (!user) return null;

    setLoading(true);
    try {
      // Get current active fasting session
      const { data: activeFast } = await supabase
        .from('fasting_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('start_time', { ascending: false })
        .limit(1)
        .single();

      // Get historical fasting data
      const { data: completedFasts } = await supabase
        .from('fasting_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('end_time', { ascending: false });

      const now = new Date();
      
      // Calculate current fast duration
      let currentFastDuration = 0;
      let fastingGoal = 16; // Default 16 hours
      let timeUntilGoal = 0;
      
      if (activeFast) {
        const startTime = new Date(activeFast.start_time);
        currentFastDuration = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        fastingGoal = (activeFast.goal_duration_seconds || 57600) / 3600; // Convert to hours
        timeUntilGoal = Math.max(0, fastingGoal - currentFastDuration);
      }

      // Calculate stats from completed fasts
      const totalFastsCompleted = completedFasts?.length || 0;
      const averageFastDuration = totalFastsCompleted > 0 
        ? (completedFasts?.reduce((sum, fast) => sum + (fast.duration_seconds || 0), 0) || 0) / totalFastsCompleted / 3600
        : 0;

      const lastFastCompleted = completedFasts?.[0]?.end_time 
        ? new Date(completedFasts[0].end_time)
        : null;

      // Calculate suggested meal time
      const suggestedMealTime = activeFast && timeUntilGoal > 0
        ? new Date(now.getTime() + (timeUntilGoal * 60 * 60 * 1000)).toLocaleTimeString()
        : 'Now (goal reached!)';

      const fastingContext: FastingContext = {
        isCurrentlyFasting: !!activeFast,
        currentFastDuration,
        fastingGoal,
        timeUntilGoal,
        lastFastCompleted,
        averageFastDuration,
        totalFastsCompleted,
        currentTime: now.toLocaleTimeString(),
        currentDate: now.toLocaleDateString(),
        suggestedMealTime
      };

      setContext(fastingContext);
      return fastingContext;
    } catch (error) {
      console.error('Error fetching fasting context:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const buildContextString = (ctx: FastingContext): string => {
    const parts = [
      `Current time: ${ctx.currentTime} on ${ctx.currentDate}`
    ];

    if (ctx.isCurrentlyFasting) {
      parts.push(
        `User is currently fasting for ${ctx.currentFastDuration.toFixed(1)} hours`,
        `Fasting goal: ${ctx.fastingGoal} hours`,
        ctx.timeUntilGoal > 0 
          ? `Time until goal: ${ctx.timeUntilGoal.toFixed(1)} hours (suggested meal time: ${ctx.suggestedMealTime})`
          : `Goal achieved! User can break fast now.`
      );
    } else {
      parts.push('User is not currently fasting');
      if (ctx.lastFastCompleted) {
        parts.push(`Last fast completed: ${ctx.lastFastCompleted.toLocaleDateString()}`);
      }
    }

    if (ctx.totalFastsCompleted > 0) {
      parts.push(
        `Total fasts completed: ${ctx.totalFastsCompleted}`,
        `Average fast duration: ${ctx.averageFastDuration.toFixed(1)} hours`
      );
    }

    return parts.join('. ') + '.';
  };

  useEffect(() => {
    if (user) {
      fetchFastingContext();
    } else {
      setContext(null);
    }
  }, [user]);

  return {
    context,
    loading,
    buildContextString,
    refreshContext: fetchFastingContext
  };
};