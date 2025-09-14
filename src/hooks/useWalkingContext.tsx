import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useStandardizedLoading } from './useStandardizedLoading';

export interface WalkingContext {
  isCurrentlyWalking: boolean;
  currentWalkingDuration: number; // in minutes
  isPaused: boolean;
  totalWalkingTimeToday: number; // in minutes
  totalWalkingSessions: number;
  averageSessionDuration: number; // in minutes
  totalCaloriesBurned: number;
  currentTime: string;
  currentDate: string;
}

export const useWalkingContext = () => {
  const [context, setContext] = useState<WalkingContext | null>(null);
  const { isLoading, execute } = useStandardizedLoading();
  const { user } = useAuth();

  const fetchWalkingContext = async (): Promise<WalkingContext | null> => {
    if (!user) return null;

    const result = await execute(async () => {
      // Get current active walking session
      const { data: activeWalk } = await supabase
        .from('walking_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('start_time', { ascending: false })
        .limit(1)
        .single();

      // Get today's completed sessions
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      const { data: todaySessions } = await supabase
        .from('walking_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('start_time', startOfDay.toISOString());

      // Get all completed sessions for stats
      const { data: allSessions } = await supabase
        .from('walking_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('end_time', { ascending: false });

      const now = new Date();
      
      // Calculate current walking duration
      let currentWalkingDuration = 0;
      let isPaused = false;
      
      if (activeWalk) {
        const startTime = new Date(activeWalk.start_time);
        let totalElapsed = (now.getTime() - startTime.getTime()) / (1000 * 60); // minutes
        
        // Subtract paused time
        const pausedTime = (activeWalk.total_pause_duration || 0) / 60; // convert to minutes
        let currentPauseTime = 0;
        
        isPaused = activeWalk.session_state === 'paused';
        
        // If currently paused, add current pause duration
        if (isPaused && activeWalk.pause_start_time) {
          currentPauseTime = (now.getTime() - new Date(activeWalk.pause_start_time).getTime()) / (1000 * 60);
        }
        
        currentWalkingDuration = Math.max(0, totalElapsed - pausedTime - currentPauseTime);
      }

      // Calculate today's total walking time (from completed sessions)
      const totalWalkingTimeToday = (todaySessions?.reduce((sum, session) => {
        if (session.start_time && session.end_time) {
          const duration = (new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / (1000 * 60);
          return sum + duration;
        }
        return sum;
      }, 0) || 0) + currentWalkingDuration;

      // Calculate stats from all completed sessions
      const totalWalkingSessions = allSessions?.length || 0;
      const averageSessionDuration = totalWalkingSessions > 0 
        ? (allSessions?.reduce((sum, session) => {
            if (session.start_time && session.end_time) {
              const duration = (new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / (1000 * 60);
              return sum + duration;
            }
            return sum;
          }, 0) || 0) / totalWalkingSessions
        : 0;

      const totalCaloriesBurned = allSessions?.reduce((sum, session) => 
        sum + (session.calories_burned || 0), 0) || 0;

      const walkingContext: WalkingContext = {
        isCurrentlyWalking: !!activeWalk,
        currentWalkingDuration,
        isPaused,
        totalWalkingTimeToday,
        totalWalkingSessions,
        averageSessionDuration,
        totalCaloriesBurned,
        currentTime: now.toLocaleTimeString(),
        currentDate: now.toLocaleDateString()
      };

      return walkingContext;
    }, {
      onSuccess: (data) => {
        setContext(data);
      },
      onError: (error) => {
        console.error('Error fetching walking context:', error);
      }
    });

    return result?.data || null;
  };

  const buildContextString = (ctx: WalkingContext): string => {
    const parts = [
      `Current time: ${ctx.currentTime} on ${ctx.currentDate}`
    ];

    if (ctx.isCurrentlyWalking) {
      parts.push(
        `User is currently walking for ${ctx.currentWalkingDuration.toFixed(1)} minutes`,
        ctx.isPaused ? 'Session is currently paused' : 'Session is active'
      );
    } else {
      parts.push('User is not currently walking');
    }

    parts.push(`Total walking time today: ${ctx.totalWalkingTimeToday.toFixed(1)} minutes`);

    if (ctx.totalWalkingSessions > 0) {
      parts.push(
        `Total walking sessions completed: ${ctx.totalWalkingSessions}`,
        `Average session duration: ${ctx.averageSessionDuration.toFixed(1)} minutes`,
        `Total calories burned: ${ctx.totalCaloriesBurned}`
      );
    }

    return parts.join('. ') + '.';
  };

  useEffect(() => {
    if (user) {
      fetchWalkingContext();
    } else {
      setContext(null);
    }
  }, [user]);

  return {
    context,
    loading: isLoading,
    buildContextString,
    refreshContext: fetchWalkingContext
  };
};