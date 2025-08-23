import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfileQuery } from '@/hooks/useProfileQuery';
import { estimateSteps } from '@/utils/stepEstimation';
import { enqueueOperation } from '@/utils/outbox';
import { persistWalkingSession, getPersistedWalkingSession } from '@/utils/timerPersistence';

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
  const [loading, setLoading] = useState(false);
  const [selectedSpeed, setSelectedSpeed] = useState<number>(3); // Default to average speed
  const [isPaused, setIsPaused] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user } = useAuth();
  const { profile, calculateWalkingCalories } = useProfileQuery();

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const loadActiveSession = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('walking_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('start_time', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error loading active walking session:', error);
        // Don't clear state on error - fall back to persisted data
        const persistedSession = getPersistedWalkingSession();
        if (persistedSession && persistedSession.user_id === user.id && persistedSession.status === 'active') {
          setCurrentSession(persistedSession);
          setIsPaused(persistedSession.session_state === 'paused');
        }
        return;
      }

      const session = data || null;
      setCurrentSession(session);
      setIsPaused(session?.session_state === 'paused');
      
      // Persist to local storage for offline fallback
      if (session) {
        persistWalkingSession({
          id: session.id,
          user_id: session.user_id,
          start_time: session.start_time,
          status: session.status,
          speed_mph: session.speed_mph,
          session_state: session.session_state,
          pause_start_time: session.pause_start_time,
          total_pause_duration: session.total_pause_duration,
        });
      }
    } catch (error) {
      console.error('Error loading active walking session:', error);
      // Fall back to persisted session if network fails
      const persistedSession = getPersistedWalkingSession();
      if (persistedSession && persistedSession.user_id === user.id && persistedSession.status === 'active') {
        setCurrentSession(persistedSession);
        setIsPaused(persistedSession.session_state === 'paused');
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  const startWalkingSession = useCallback(async (speedMph: number = selectedSpeed): Promise<{data: any, error: any}> => {
    if (!user) return { error: { message: 'User not authenticated' }, data: null };

    const speed = speedMph || selectedSpeed;
    const startTimeIso = new Date().toISOString();
    
    // Create optimistic session immediately for instant UI feedback
    const optimisticSession: WalkingSession = {
      id: `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      user_id: user.id,
      start_time: startTimeIso,
      status: 'active',
      session_state: 'active',
      total_pause_duration: 0,
      speed_mph: speed,
    };

    // Set optimistic state immediately
    setCurrentSession(optimisticSession);
    setSelectedSpeed(speed);
    setIsPaused(false);

    const offlineStart = async () => {
      // Update optimistic session with proper offline ID
      const localId = `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const localSession = { ...optimisticSession, id: localId };
      setCurrentSession(localSession);

      // Enqueue start op
      await enqueueOperation({
        entity: 'walking_session',
        action: 'start',
        user_id: user.id,
        payload: {
          local_id: localId,
          start_time: startTimeIso,
          speed_mph: speed,
          status: 'active',
          session_state: 'active',
          total_pause_duration: 0,
        },
      });
      return { data: localSession, error: null };
    };

    setLoading(true);
    try {
      // If offline, handle offline flow
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        const res = await offlineStart();
        return res;
      }

      // Online flow - but we already have optimistic UI
      const { data, error } = await supabase
        .from('walking_sessions')
        .insert({
          user_id: user.id,
          start_time: startTimeIso,
          status: 'active',
          speed_mph: speed,
          session_state: 'active',
          total_pause_duration: 0,
        })
        .select()
        .single();

      if (error) throw error;

      console.log('Walking session started successfully:', data);
      
      // Update with real session data from database
      setCurrentSession(data);
      
      // Persist to local storage
      persistWalkingSession({
        id: data.id,
        user_id: data.user_id,
        start_time: data.start_time,
        status: data.status,
        speed_mph: data.speed_mph,
        session_state: data.session_state,
        pause_start_time: data.pause_start_time,
        total_pause_duration: data.total_pause_duration,
      });

      // Force immediate refresh of the context
      console.log('Triggering refresh after session start');
      triggerRefresh();

      return { data, error: null };
    } catch (error: any) {
      console.error('Error starting walking session:', error);
      // Fallback to offline if network error
      if (error?.message?.includes('fetch')) {
        const res = await offlineStart();
        return res;
      }
      // Revert optimistic update on error
      setCurrentSession(null);
      setIsPaused(false);
      return { error, data: null };
    } finally {
      setLoading(false);
    }
  }, [user, selectedSpeed, triggerRefresh]);

  const pauseWalkingSession = useCallback(async (): Promise<{data: any, error: any}> => {
    if (!user || !currentSession) return { error: { message: 'No active session' }, data: null };

    const offlinePause = async () => {
      const pauseTime = new Date().toISOString();
      const updatedSession = { ...currentSession, session_state: 'paused', pause_start_time: pauseTime };
      setCurrentSession(updatedSession);
      setIsPaused(true);
      
      await enqueueOperation({
        entity: 'walking_session',
        action: 'pause',
        user_id: user.id,
        payload: { session_id: currentSession.id, pause_start_time: pauseTime },
      });
      return { data: updatedSession, error: null };
    };

    setLoading(true);
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return await offlinePause();
      }

      const { data, error } = await supabase
        .from('walking_sessions')
        .update({
          session_state: 'paused',
          pause_start_time: new Date().toISOString()
        })
        .eq('id', currentSession.id)
        .select()
        .single();

      if (error) throw error;

      setCurrentSession(data);
      setIsPaused(true);
      triggerRefresh();
      return { data, error: null };
    } catch (error: any) {
      console.error('Error pausing walking session:', error);
      if (error.message?.includes('fetch')) {
        return await offlinePause();
      }
      return { error, data: null };
    } finally {
      setLoading(false);
    }
  }, [user, currentSession, triggerRefresh]);

  const resumeWalkingSession = useCallback(async (): Promise<{data: any, error: any}> => {
    if (!user || !currentSession) return { error: { message: 'No active session' }, data: null };

    const offlineResume = async () => {
      const pauseDuration = currentSession.pause_start_time 
        ? Math.floor((new Date().getTime() - new Date(currentSession.pause_start_time).getTime()) / 1000)
        : 0;
      
      const updatedSession = { 
        ...currentSession, 
        session_state: 'active', 
        pause_start_time: null,
        total_pause_duration: (currentSession.total_pause_duration || 0) + pauseDuration
      };
      
      setCurrentSession(updatedSession);
      setIsPaused(false);
      
      await enqueueOperation({
        entity: 'walking_session',
        action: 'resume',
        user_id: user.id,
        payload: { session_id: currentSession.id, pause_duration_seconds: pauseDuration },
      });
      return { data: updatedSession, error: null };
    };

    setLoading(true);
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return await offlineResume();
      }

      const pauseDuration = currentSession.pause_start_time 
        ? Math.floor((new Date().getTime() - new Date(currentSession.pause_start_time).getTime()) / 1000)
        : 0;

      const { data, error } = await supabase
        .from('walking_sessions')
        .update({
          session_state: 'active',
          pause_start_time: null,
          total_pause_duration: (currentSession.total_pause_duration || 0) + pauseDuration
        })
        .eq('id', currentSession.id)
        .select()
        .single();

      if (error) throw error;

      setCurrentSession(data);
      setIsPaused(false);
      triggerRefresh();
      return { data, error: null };
    } catch (error: any) {
      console.error('Error resuming walking session:', error);
      if (error.message?.includes('fetch')) {
        return await offlineResume();
      }
      return { error, data: null };
    } finally {
      setLoading(false);
    }
  }, [user, currentSession, triggerRefresh]);

  const endWalkingSession = useCallback(async (manualDurationMinutes?: number): Promise<{data: any, error: any}> => {
    console.log('Ending walking session...');
    if (!user || !currentSession) return { error: { message: 'No active session' }, data: null };

    const calculateEndData = () => {
      const endTime = new Date();
      const startTime = new Date(currentSession.start_time);
      
      let activeDurationMinutes: number;
      let isManualEdit = false;
      
      if (manualDurationMinutes) {
        activeDurationMinutes = manualDurationMinutes;
        isManualEdit = true;
      } else {
        let totalDurationMs = endTime.getTime() - startTime.getTime();
        let totalPauseDuration = currentSession.total_pause_duration || 0;
        
        if (isPaused && currentSession.pause_start_time) {
          const currentPauseDuration = Math.floor((endTime.getTime() - new Date(currentSession.pause_start_time).getTime()) / 1000);
          totalPauseDuration += currentPauseDuration;
        }
        
        activeDurationMinutes = (totalDurationMs / (1000 * 60)) - (totalPauseDuration / 60);
      }
      
      const speedMph = currentSession.speed_mph || selectedSpeed || 3;
      const newEndTime = isManualEdit 
        ? new Date(startTime.getTime() + activeDurationMinutes * 60 * 1000)
        : endTime;
      
      let updateData: any = {
        end_time: newEndTime.toISOString(),
        status: 'completed',
        session_state: 'completed'
      };
      
      if (isManualEdit) {
        updateData = {
          ...updateData,
          calories_burned: null,
          distance: null,
          estimated_steps: null,
          is_edited: true,
          edit_reason: 'Manual duration correction'
        };
      } else {
        const calories = calculateWalkingCalories(activeDurationMinutes, speedMph);
        const distance = (activeDurationMinutes / 60) * speedMph;
        const userHeight = profile?.height || 175; // Default 175cm
        const units = 'metric' as const;
        const estimatedSteps = estimateSteps({
          durationMinutes: activeDurationMinutes,
          speedMph,
          userHeight,
          units
        });
        
        updateData = {
          ...updateData,
          calories_burned: calories,
          distance: Math.round(distance * 100) / 100,
          estimated_steps: estimatedSteps,
          total_pause_duration: currentSession.total_pause_duration || 0
        };
      }
      
      return updateData;
    };

    const offlineEnd = async () => {
      const updateData = calculateEndData();
      setCurrentSession(null);
      setIsPaused(false);
      
      await enqueueOperation({
        entity: 'walking_session',
        action: 'end',
        user_id: user.id,
        payload: { session_id: currentSession.id, updateData },
      });
      
      triggerRefresh();
      return { data: { ...currentSession, ...updateData }, error: null };
    };

    setLoading(true);
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return await offlineEnd();
      }

      const updateData = calculateEndData();

      const { data, error } = await supabase
        .from('walking_sessions')
        .update(updateData)
        .eq('id', currentSession.id)
        .select()
        .single();

      if (error) throw error;

      setCurrentSession(null);
      setIsPaused(false);
      persistWalkingSession(null); // Clear persisted session
      triggerRefresh();
      
      setTimeout(() => {
        loadActiveSession();
      }, 100);
      
      return { data, error: null };
    } catch (error: any) {
      console.error('Error ending walking session:', error);
      if (error.message?.includes('fetch')) {
        return await offlineEnd();
      }
      return { error, data: null };
    } finally {
      setLoading(false);
    }
  }, [user, currentSession, selectedSpeed, calculateWalkingCalories, isPaused, profile, triggerRefresh, loadActiveSession]);

  const cancelWalkingSession = useCallback(async (): Promise<{data: any, error: any}> => {
    console.log('Cancelling walking session...');
    if (!user || !currentSession) return { error: { message: 'No active session' }, data: null };

    const offlineCancel = async () => {
      setCurrentSession(null);
      setIsPaused(false);
      
      await enqueueOperation({
        entity: 'walking_session',
        action: 'cancel',
        user_id: user.id,
        payload: { session_id: currentSession.id },
      });
      
      triggerRefresh();
      return { data: true, error: null };
    };

    setLoading(true);
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return await offlineCancel();
      }

      const { error } = await supabase
        .from('walking_sessions')
        .delete()
        .eq('id', currentSession.id);

      if (error) throw error;

      setCurrentSession(null);
      setIsPaused(false);
      persistWalkingSession(null); // Clear persisted session
      triggerRefresh();
      
      return { data: true, error: null };
    } catch (error: any) {
      console.error('Error cancelling walking session:', error);
      if (error.message?.includes('fetch')) {
        return await offlineCancel();
      }
      return { error, data: null };
    } finally {
      setLoading(false);
    }
  }, [user, currentSession, triggerRefresh]);

  // Load active session on mount
  useEffect(() => {
    let mounted = true;
    
    const load = async () => {
      if (mounted) {
        await loadActiveSession();
      }
    };
    
    load();
    
    return () => {
      mounted = false;
    };
  }, [loadActiveSession]);

  // Initialize selectedSpeed from profile - stable dependency with debouncing
  useEffect(() => {
    if (profile?.default_walking_speed && profile.default_walking_speed !== selectedSpeed) {
      setSelectedSpeed(profile.default_walking_speed);
    }
  }, [profile?.default_walking_speed]); // Removed selectedSpeed to prevent infinite loops

  const updateSessionSpeed = useCallback(async (newSpeed: number): Promise<{data: any, error: any}> => {
    if (!currentSession || !user) return { error: null, data: null };

    const offlineUpdate = async () => {
      const updatedSession = { ...currentSession, speed_mph: newSpeed };
      setCurrentSession(updatedSession);
      
      await enqueueOperation({
        entity: 'walking_session',
        action: 'update_speed',
        user_id: user.id,
        payload: { session_id: currentSession.id, speed_mph: newSpeed },
      });
      return { data: updatedSession, error: null };
    };

    console.log('Updating session speed:', { currentSpeed: currentSession.speed_mph, newSpeed });
    setLoading(true);
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return await offlineUpdate();
      }

      const { data, error } = await supabase
        .from('walking_sessions')
        .update({ speed_mph: newSpeed })
        .eq('id', currentSession.id)
        .select()
        .single();

      if (error) {
        console.error('Database error updating session speed:', error);
        throw error;
      }

      console.log('Successfully updated session speed:', data);
      setCurrentSession(data);
      return { data, error: null };
    } catch (error: any) {
      console.error('Error updating session speed:', error);
      if (error.message?.includes('fetch')) {
        return await offlineUpdate();
      }
      return { error, data: null };
    } finally {
      setLoading(false);
    }
  }, [user, currentSession]);

  // Save selected speed to profile
  const saveSpeedToProfile = useCallback(async (newSpeed: number) => {
    if (!user) return;
    
    try {
      await supabase
        .from('profiles')
        .update({ default_walking_speed: newSpeed })
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error saving walking speed to profile:', error);
    }
  }, [user]);

  // Enhanced setSelectedSpeed that also saves to profile
  const updateSelectedSpeed = useCallback((newSpeed: number) => {
    setSelectedSpeed(newSpeed);
    saveSpeedToProfile(newSpeed);
  }, [saveSpeedToProfile]);

  // triggerRefresh defined earlier

  return {
    currentSession,
    loading,
    selectedSpeed,
    setSelectedSpeed: updateSelectedSpeed, // Use the enhanced version
    isPaused,
    startWalkingSession,
    pauseWalkingSession,
    resumeWalkingSession,
    endWalkingSession,
    cancelWalkingSession,
    loadActiveSession,
    updateSessionSpeed,
    refreshTrigger,
    triggerRefresh
  };
};