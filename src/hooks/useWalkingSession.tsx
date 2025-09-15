import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOptimizedProfile } from '@/hooks/optimized/useOptimizedProfile';
import { estimateSteps } from '@/utils/stepEstimation';
import { enqueueOperation } from '@/utils/outbox';
import { persistWalkingSession, getPersistedWalkingSession } from '@/utils/timerPersistence';
import { useStandardizedLoading } from '@/hooks/useStandardizedLoading';
import { cleanupStaleWalkingSessions } from '@/utils/walkingSessionCleanup';

interface WalkingSession {
  id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  calories_burned?: number;
  distance?: number;
  status: string;
  speed_mph?: number;
  estimated_steps?: number;
  pause_start_time?: string;
  total_pause_duration?: number;
  session_state?: string;
}

export const useWalkingSession = () => {
  const [currentSession, setCurrentSession] = useState<WalkingSession | null>(null);
  const [selectedSpeed, setSelectedSpeed] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user } = useAuth();
  const { profile, calculateWalkingCalories } = useOptimizedProfile();
  const { isLoading, execute } = useStandardizedLoading();

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const loadActiveSession = useCallback(async () => {
    if (!user) return;
    
    await execute(async () => {
      // FIRST: Clean up any stale sessions (>12 hours old)
      await cleanupStaleWalkingSessions(user.id);
      
      // Constants for session age limits
      const eightHours = 8 * 60 * 60 * 1000;
      
      // Then try to get current active session from server
      const { data, error } = await supabase
        .from('walking_sessions')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['active', 'paused'])
        .order('start_time', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error loading walking session:', error);
        // Don't throw - fall back to persisted session
      }

      const serverSession = data as WalkingSession || null;
      
      // Additional safety check: if session is older than 8 hours, force end it
      if (serverSession) {
        const sessionAge = Date.now() - new Date(serverSession.start_time).getTime();
        
        if (sessionAge > eightHours) {
          console.log('🚶 Force ending stale session (>8 hours):', serverSession.id);
          await supabase
            .from('walking_sessions')
            .update({
              status: 'cancelled',
              end_time: new Date().toISOString(),
              session_state: null
            })
            .eq('id', serverSession.id);
          
          setCurrentSession(null);
          return null;
        }
      }
      
      setCurrentSession(serverSession);
      
      // Check if session is paused
      if (serverSession?.session_state === 'paused') {
        setIsPaused(true);
      } else {
        setIsPaused(false);
      }

      // Persist to local storage for offline fallback
      if (serverSession) {
        persistWalkingSession({
          id: serverSession.id,
          start_time: serverSession.start_time,
          status: serverSession.status,
          user_id: serverSession.user_id,
          speed_mph: serverSession.speed_mph,
          session_state: serverSession.session_state,
        });
      }

      // Fall back to persisted session if network fails
      const persistedSession = getPersistedWalkingSession();
      if (!serverSession && persistedSession && persistedSession.user_id === user.id && ['active', 'paused'].includes(persistedSession.status)) {
        // Also check age of persisted session
        const persistedAge = Date.now() - new Date(persistedSession.start_time).getTime();
        if (persistedAge <= eightHours) {
          setCurrentSession(persistedSession as WalkingSession);
        }
      }
      
      return serverSession;
    });
  }, [user, execute]);

  // Load active session on mount
  useEffect(() => {
    if (user) {
      loadActiveSession();
    } else {
      setCurrentSession(null);
    }
  }, [user, loadActiveSession]);

  const startWalkingSession = useCallback(async () => {
    if (!user) return null;

    return await execute(async () => {
      // End any existing active sessions first
      await supabase
        .from('walking_sessions')
        .update({ 
          status: 'cancelled',
          end_time: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .in('status', ['active', 'paused']);

      // Create new session
      const { data, error } = await supabase
        .from('walking_sessions')
        .insert([
          {
            user_id: user.id,
            start_time: new Date().toISOString(),
            status: 'active',
            speed_mph: selectedSpeed || 3.1,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      const session = data as WalkingSession;
      setCurrentSession(session);
      setIsPaused(false);
      
      // Persist to local storage
      persistWalkingSession({
        id: session.id,
        start_time: session.start_time,
        status: session.status,
        user_id: session.user_id,
        speed_mph: session.speed_mph,
      });
      
      return session;
    });
  }, [user, selectedSpeed, execute]);

  const pauseWalkingSession = useCallback(async () => {
    if (!user || !currentSession || currentSession.status !== 'active' || isPaused) return null;

    return await execute(async () => {
      const { data, error } = await supabase
        .from('walking_sessions')
        .update({
          session_state: 'paused',
          pause_start_time: new Date().toISOString()
        })
        .eq('id', currentSession.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      const updatedSession = data as WalkingSession;
      setIsPaused(true);
      setCurrentSession(updatedSession);
      return updatedSession;
    });
  }, [user, currentSession, isPaused, execute]);

  const resumeWalkingSession = useCallback(async () => {
    if (!user || !currentSession || currentSession.status !== 'active' || !isPaused) return null;

    return await execute(async () => {
      const pauseStartTime = currentSession.pause_start_time ? new Date(currentSession.pause_start_time) : new Date();
      const totalPauseDuration = (currentSession.total_pause_duration || 0) + 
        Math.floor((new Date().getTime() - pauseStartTime.getTime()) / 1000);

      const { data, error } = await supabase
        .from('walking_sessions')
        .update({
          session_state: 'active',
          pause_start_time: null,
          total_pause_duration: totalPauseDuration
        })
        .eq('id', currentSession.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      const updatedSession = data as WalkingSession;
      setIsPaused(false);
      setCurrentSession(updatedSession);
      return updatedSession;
    });
  }, [user, currentSession, isPaused, execute]);

  const endWalkingSession = useCallback(async (sessionId?: string, finalSpeed?: number) => {
    if (!user) return null;
    
    const targetSessionId = sessionId || currentSession?.id;
    if (!targetSessionId) return null;

    return await execute(async () => {
      const endTime = new Date().toISOString();
      const speed = finalSpeed || selectedSpeed || currentSession?.speed_mph || 3.1;
      
      // IMMEDIATELY clear local state for instant UI update
      setCurrentSession(null);
      setSelectedSpeed(null);
      setIsPaused(false);
      persistWalkingSession(null);
      localStorage.removeItem('walking_session');
      
      // Get session data for calculations
      const { data: sessionData } = await supabase
        .from('walking_sessions')
        .select('*')
        .eq('id', targetSessionId)
        .single();

      if (!sessionData) throw new Error('Session not found');

      const startTime = new Date(sessionData.start_time);
      const endTimeDate = new Date(endTime);
      const totalPauseDuration = sessionData.total_pause_duration || 0;
      
      // Calculate active duration (excluding pauses)
      const totalDurationMs = endTimeDate.getTime() - startTime.getTime();
      const activeDurationMs = totalDurationMs - (totalPauseDuration * 1000);
      const durationMinutes = Math.max(1, Math.floor(activeDurationMs / (1000 * 60))); // At least 1 minute
      
      // Calculate distance and calories
      const distanceMiles = (speed * durationMinutes) / 60;
      const caloriesBurned = profile && calculateWalkingCalories 
        ? calculateWalkingCalories(durationMinutes, speed)
        : Math.round(durationMinutes * 3.5); // Fallback calculation
      
      const estimatedSteps = estimateSteps({ 
        durationMinutes, 
        speedMph: speed,
        userHeight: profile?.height || 175
      });

      const updateData = {
        status: 'completed',
        end_time: endTime,
        speed_mph: speed,
        distance: distanceMiles,
        calories_burned: caloriesBurned,
        estimated_steps: estimatedSteps,
        session_state: null,
        pause_start_time: null
      };

      const { data, error } = await supabase
        .from('walking_sessions')
        .update(updateData)
        .eq('id', targetSessionId)
        .select()
        .single();

      if (error) {
        // Rollback local state if database update fails
        const rollbackSession = await supabase
          .from('walking_sessions')
          .select('*')
          .eq('id', targetSessionId)
          .single();
        
        if (rollbackSession.data) {
          setCurrentSession(rollbackSession.data as WalkingSession);
        }
        throw error;
      }

      const finalData = data as WalkingSession;
      triggerRefresh();
      return finalData;
    });
  }, [user, currentSession, profile, calculateWalkingCalories, selectedSpeed, triggerRefresh, execute]);

  const cancelWalkingSession = useCallback(async (sessionId?: string) => {
    if (!user) return null;
    
    const targetSessionId = sessionId || currentSession?.id;
    if (!targetSessionId) return null;

    return await execute(async () => {
      // IMMEDIATELY clear local state for instant UI update
      setCurrentSession(null);
      setSelectedSpeed(null);
      setIsPaused(false);
      persistWalkingSession(null);
      localStorage.removeItem('walking_session');

      const { data, error } = await supabase
        .from('walking_sessions')
        .update({
          status: 'cancelled',
          end_time: new Date().toISOString()
        })
        .eq('id', targetSessionId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        // Rollback local state if database update fails
        const rollbackSession = await supabase
          .from('walking_sessions')
          .select('*')
          .eq('id', targetSessionId)
          .single();
        
        if (rollbackSession.data) {
          setCurrentSession(rollbackSession.data as WalkingSession);
        }
        throw error;
      }

      triggerRefresh();
      return data;
    });
  }, [user, currentSession, triggerRefresh, execute]);

  const updateSessionCalories = useCallback(async (sessionId: string, speed: number) => {
    if (!user || !profile) return null;

    return await execute(async () => {
      const { data, error } = await supabase
        .from('walking_sessions')
        .update({ speed_mph: speed })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;

      if (currentSession && currentSession.id === sessionId) {
        setCurrentSession(data as WalkingSession);
      }
      
      return data;
    });
  }, [user, profile, currentSession, execute]);

  const editSessionTime = useCallback(async (sessionId: string, newStartTime: Date, newEndTime: Date, reason?: string) => {
    if (!user) return null;

    return await execute(async () => {
      const durationMinutes = Math.floor((newEndTime.getTime() - newStartTime.getTime()) / (1000 * 60));
      
      const { data, error } = await supabase
        .from('walking_sessions')
        .update({
          start_time: newStartTime.toISOString(),
          end_time: newEndTime.toISOString(),
          is_edited: true,
          edit_reason: reason,
          original_duration_minutes: durationMinutes
        })
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      const updatedSession = data as WalkingSession;
      triggerRefresh();
      return updatedSession;
    });
  }, [user, triggerRefresh, execute]);

  const deleteWalkingSession = useCallback(async (sessionId: string) => {
    if (!user) return false;

    const result = await execute(async () => {
      const { error } = await supabase
        .from('walking_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (error) throw error;

      if (currentSession && currentSession.id === sessionId) {
        setCurrentSession(null);
        setSelectedSpeed(null);
        setIsPaused(false);
      }
      
      triggerRefresh();
      return true;
    });
    
    return result.success;
  }, [user, currentSession, triggerRefresh, execute]);

  // Enhanced speed update function with profile saving
  const updateSelectedSpeed = useCallback(async (newSpeed: number) => {
    setSelectedSpeed(newSpeed);
    
    // Update current session speed if there's an active session
    if (currentSession && user) {
      await execute(async () => {
        const { error } = await supabase
          .from('walking_sessions')
          .update({ speed_mph: newSpeed })
          .eq('id', currentSession.id)
          .eq('user_id', user.id);

        if (error) throw error;
        
        setCurrentSession(prev => prev ? { ...prev, speed_mph: newSpeed } : null);
        return true;
      });
    }
    
    // Save to profile as default walking speed
    if (user) {
      try {
        await supabase
          .from('profiles')
          .update({ default_walking_speed: newSpeed })
          .eq('user_id', user.id);
      } catch (error) {
        console.error('Error saving walking speed to profile:', error);
      }
    }
  }, [currentSession, user, execute]);

  return {
    currentSession,
    loading: isLoading,
    selectedSpeed: selectedSpeed ?? 3.1, // Default to normal walking speed
    setSelectedSpeed: updateSelectedSpeed,
    updateSelectedSpeed,
    updateSessionSpeed: updateSelectedSpeed, // Alias for backwards compatibility
    isPaused,
    refreshTrigger,
    startWalkingSession,
    pauseWalkingSession,
    resumeWalkingSession,
    endWalkingSession,
    cancelWalkingSession,
    updateSessionCalories,
    editSessionTime,
    deleteWalkingSession,
    loadActiveSession,
    triggerRefresh,
  };
};