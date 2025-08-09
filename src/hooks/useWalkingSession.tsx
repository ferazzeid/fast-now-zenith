import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfileQuery } from '@/hooks/useProfileQuery';
import { estimateSteps } from '@/utils/stepEstimation';
import { enqueueOperation } from '@/utils/outbox';

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
        setCurrentSession(null);
        setIsPaused(false);
        return;
      }

      setCurrentSession(data || null);
      setIsPaused(data?.session_state === 'paused');
    } catch (error) {
      console.error('Error loading active walking session:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const startWalkingSession = useCallback(async (speedMph: number = selectedSpeed) => {
    if (!user) return { error: { message: 'User not authenticated' } };

    const offlineStart = async () => {
      const localId = `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const startIso = new Date().toISOString();
      const localSession: WalkingSession = {
        id: localId,
        user_id: user.id,
        start_time: startIso,
        status: 'active',
        session_state: 'active',
        total_pause_duration: 0,
        speed_mph: speedMph,
      } as any;

      // Optimistic local state
      setCurrentSession(localSession);
      setSelectedSpeed(speedMph);
      setIsPaused(false);

      // Enqueue start op
      await enqueueOperation({
        entity: 'walking_session',
        action: 'start',
        user_id: user.id,
        payload: {
          local_id: localId,
          start_time: startIso,
          speed_mph: speedMph,
          status: 'active',
          session_state: 'active',
          total_pause_duration: 0,
        },
      });
      return { data: localSession, error: null };
    };

    setLoading(true);
    try {
      // If offline, immediately create a local session and queue
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        const res = await offlineStart();
        return res;
      }

      const { data, error } = await supabase
        .from('walking_sessions')
        .insert({
          user_id: user.id,
          start_time: new Date().toISOString(),
          status: 'active',
          speed_mph: speedMph,
          session_state: 'active',
          total_pause_duration: 0,
        })
        .select()
        .single();

      console.log('Walking session started successfully:', data);
      setCurrentSession(data);
      setSelectedSpeed(speedMph);
      setIsPaused(false);

      // Force immediate refresh of the context
      console.log('Triggering refresh after session start');
      triggerRefresh();

      // Additional immediate load to ensure state is fresh
      setTimeout(() => {
        loadActiveSession();
      }, 100);

      return { data, error: null };
    } catch (error: any) {
      console.error('Error starting walking session:', error);
      // Fallback to offline if network error
      if (error?.message?.includes('fetch')) {
        const res = await offlineStart();
        return res;
      }
      return { error, data: null };
    } finally {
      setLoading(false);
    }
  }, [user, selectedSpeed, loadActiveSession, triggerRefresh]);

  const pauseWalkingSession = useCallback(async () => {
    if (!user || !currentSession) return { error: { message: 'No active session' } };

    setLoading(true);
    try {
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
      // Handle network errors gracefully
      if (error.message?.includes('fetch')) {
        return { error: { message: 'Network error. Please check your connection and try again.' }, data: null };
      }
      return { error, data: null };
    } finally {
      setLoading(false);
    }
  }, [user, currentSession]);

  const resumeWalkingSession = useCallback(async () => {
    if (!user || !currentSession) return { error: { message: 'No active session' } };

    setLoading(true);
    try {
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
      // Handle network errors gracefully
      if (error.message?.includes('fetch')) {
        return { error: { message: 'Network error. Please check your connection and try again.' }, data: null };
      }
      return { error, data: null };
    } finally {
      setLoading(false);
    }
  }, [user, currentSession]);

  const endWalkingSession = useCallback(async (manualDurationMinutes?: number) => {
    console.log('Ending walking session...');
    if (!user || !currentSession) return { error: { message: 'No active session' } };

    setLoading(true);
    try {
      const endTime = new Date();
      const startTime = new Date(currentSession.start_time);
      
      let activeDurationMinutes: number;
      let isManualEdit = false;
      
      if (manualDurationMinutes) {
        // Manual duration - use provided value
        activeDurationMinutes = manualDurationMinutes;
        isManualEdit = true;
      } else {
        // Calculate total active duration (excluding paused time)
        let totalDurationMs = endTime.getTime() - startTime.getTime();
        let totalPauseDuration = currentSession.total_pause_duration || 0;
        
        // If currently paused, add current pause duration
        if (isPaused && currentSession.pause_start_time) {
          const currentPauseDuration = Math.floor((endTime.getTime() - new Date(currentSession.pause_start_time).getTime()) / 1000);
          totalPauseDuration += currentPauseDuration;
        }
        
        // Convert to minutes and subtract paused time
        activeDurationMinutes = (totalDurationMs / (1000 * 60)) - (totalPauseDuration / 60);
      }
      
      const speedMph = currentSession.speed_mph || selectedSpeed || 3;
      
      // Calculate new end time based on start time + duration for manual edits
      const newEndTime = isManualEdit 
        ? new Date(startTime.getTime() + activeDurationMinutes * 60 * 1000)
        : endTime;
      
      let updateData: any = {
        end_time: newEndTime.toISOString(),
        status: 'completed',
        session_state: 'completed'
      };
      
      if (isManualEdit) {
        // For manual edits, null out calculated data and mark as edited
        updateData = {
          ...updateData,
          calories_burned: null,
          distance: null,
          estimated_steps: null,
          is_edited: true,
          edit_reason: 'Manual duration correction'
        };
      } else {
        // Calculate calories using profile data and speed
        const calories = calculateWalkingCalories(activeDurationMinutes, speedMph);
        
        // Calculate distance (active time × speed)
        const distance = (activeDurationMinutes / 60) * speedMph; // Distance in miles
        
        // Calculate estimated steps
        const userHeight = profile?.height || 70;
        const units = (profile?.units as 'metric' | 'imperial') || 'imperial';
        const estimatedSteps = estimateSteps({
          durationMinutes: activeDurationMinutes,
          speedMph,
          userHeight,
          units
        });
        
        updateData = {
          ...updateData,
          calories_burned: calories,
          distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
          estimated_steps: estimatedSteps,
          total_pause_duration: currentSession.total_pause_duration || 0
        };
      }

      const { data, error } = await supabase
        .from('walking_sessions')
        .update(updateData)
        .eq('id', currentSession.id)
        .select()
        .single();

      if (error) throw error;

      // Immediately clear current session to stop timer
      console.log('🛑 ENDING SESSION - clearing currentSession to null');
      setCurrentSession(null);
      setIsPaused(false);
      
      // Force immediate refresh of context and history
      console.log('🔄 Session ended, triggering refresh');
      triggerRefresh();
      
      // Additional immediate load to ensure state is fresh
      setTimeout(() => {
        loadActiveSession();
      }, 100);
      
      return { data, error: null };
    } catch (error: any) {
      console.error('Error ending walking session:', error);
      // Handle network errors gracefully
      if (error.message?.includes('fetch')) {
        return { error: { message: 'Network error. Please check your connection and try again.' }, data: null };
      }
      return { error, data: null };
    } finally {
      setLoading(false);
    }
  }, [user, currentSession, selectedSpeed, calculateWalkingCalories, isPaused, profile]);

  const cancelWalkingSession = useCallback(async () => {
    console.log('Cancelling walking session...');
    if (!user || !currentSession) return { error: { message: 'No active session' } };

    setLoading(true);
    try {
      // Simply delete the session record so it never appears in history
      const { error } = await supabase
        .from('walking_sessions')
        .delete()
        .eq('id', currentSession.id);

      if (error) throw error;

      // Clear current session
      setCurrentSession(null);
      setIsPaused(false);
      
      // Trigger refresh
      triggerRefresh();
      
      return { data: true, error: null };
    } catch (error: any) {
      console.error('Error cancelling walking session:', error);
      // Handle network errors gracefully
      if (error.message?.includes('fetch')) {
        return { error: { message: 'Network error. Please check your connection and try again.' }, data: null };
      }
      return { error, data: null };
    } finally {
      setLoading(false);
    }
  }, [user, currentSession]);

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

  // Update session speed during active session
  const updateSessionSpeed = useCallback(async (newSpeed: number) => {
    if (!currentSession || !user) return { error: null, data: null };

    console.log('Updating session speed:', { currentSpeed: currentSession.speed_mph, newSpeed });
    setLoading(true);
    try {
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