import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

interface WalkingSession {
  id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  calories_burned?: number;
  distance?: number;
  status: string;
  speed_mph?: number;
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
  const { profile, calculateWalkingCalories } = useProfile();

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
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
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

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('walking_sessions')
        .insert({
          user_id: user.id,
          start_time: new Date().toISOString(),
          status: 'active',
          speed_mph: speedMph,
          session_state: 'active',
          total_pause_duration: 0
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentSession(data);
      setSelectedSpeed(speedMph);
      setIsPaused(false);
      return { data, error: null };
    } catch (error: any) {
      console.error('Error starting walking session:', error);
      return { error, data: null };
    } finally {
      setLoading(false);
    }
  }, [user, selectedSpeed]);

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
      return { data, error: null };
    } catch (error: any) {
      console.error('Error pausing walking session:', error);
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
      return { data, error: null };
    } catch (error: any) {
      console.error('Error resuming walking session:', error);
      return { error, data: null };
    } finally {
      setLoading(false);
    }
  }, [user, currentSession]);

  const endWalkingSession = useCallback(async () => {
    console.log('Ending walking session...');
    if (!user || !currentSession) return { error: { message: 'No active session' } };

    setLoading(true);
    try {
      const endTime = new Date();
      const startTime = new Date(currentSession.start_time);
      
      // Calculate total active duration (excluding paused time)
      let totalDurationMs = endTime.getTime() - startTime.getTime();
      let totalPauseDuration = currentSession.total_pause_duration || 0;
      
      // If currently paused, add current pause duration
      if (isPaused && currentSession.pause_start_time) {
        const currentPauseDuration = Math.floor((endTime.getTime() - new Date(currentSession.pause_start_time).getTime()) / 1000);
        totalPauseDuration += currentPauseDuration;
      }
      
      // Convert to minutes and subtract paused time
      const activeDurationMinutes = (totalDurationMs / (1000 * 60)) - (totalPauseDuration / 60);
      const speedMph = currentSession.speed_mph || selectedSpeed || 3;
      
      // Calculate calories using profile data and speed
      const calories = calculateWalkingCalories(activeDurationMinutes, speedMph);
      
      // Calculate distance (active time × speed)
      const distance = (activeDurationMinutes / 60) * speedMph; // Distance in miles

      const { data, error } = await supabase
        .from('walking_sessions')
        .update({
          end_time: endTime.toISOString(),
          status: 'completed',
          session_state: 'completed',
          calories_burned: calories,
          distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
          total_pause_duration: totalPauseDuration
        })
        .eq('id', currentSession.id)
        .select()
        .single();

      if (error) throw error;

      setCurrentSession(null);
      setIsPaused(false);
      
      // Force immediate refresh
      console.log('Triggering walking history refresh after session end');
      setRefreshTrigger(prev => prev + 1);
      
      return { data, error: null };
    } catch (error: any) {
      console.error('Error ending walking session:', error);
      return { error, data: null };
    } finally {
      setLoading(false);
    }
  }, [user, currentSession, selectedSpeed, calculateWalkingCalories, isPaused]);

  // Load active session on mount
  useEffect(() => {
    loadActiveSession();
  }, [loadActiveSession]);

  // Initialize selectedSpeed from profile
  useEffect(() => {
    if (profile?.default_walking_speed) {
      setSelectedSpeed(profile.default_walking_speed);
    }
  }, [profile?.default_walking_speed]);

  // Update session speed during active session
  const updateSessionSpeed = useCallback(async (newSpeed: number) => {
    if (!currentSession || !user) return { error: null, data: null };

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('walking_sessions')
        .update({ speed_mph: newSpeed })
        .eq('id', currentSession.id)
        .select()
        .single();

      if (error) throw error;

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

  // Manual trigger for refresh
  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

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
    loadActiveSession,
    updateSessionSpeed,
    refreshTrigger,
    triggerRefresh
  };
};