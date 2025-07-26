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
}

export const useWalkingSession = () => {
  const [currentSession, setCurrentSession] = useState<WalkingSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedSpeed, setSelectedSpeed] = useState<number>(3); // Default to average speed
  const { user } = useAuth();
  const { calculateWalkingCalories } = useProfile();

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
          speed_mph: speedMph
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentSession(data);
      setSelectedSpeed(speedMph);
      return { data, error: null };
    } catch (error: any) {
      console.error('Error starting walking session:', error);
      return { error, data: null };
    } finally {
      setLoading(false);
    }
  }, [user, selectedSpeed]);

  const endWalkingSession = useCallback(async () => {
    if (!user || !currentSession) return { error: { message: 'No active session' } };

    setLoading(true);
    try {
      const endTime = new Date();
      const startTime = new Date(currentSession.start_time);
      const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
      const speedMph = currentSession.speed_mph || selectedSpeed || 3;
      
      // Calculate calories using profile data and speed
      const calories = calculateWalkingCalories(durationMinutes, speedMph);
      
      // Calculate distance (time × speed)
      const distance = (durationMinutes / 60) * speedMph; // Distance in miles

      const { data, error } = await supabase
        .from('walking_sessions')
        .update({
          end_time: endTime.toISOString(),
          status: 'completed',
          calories_burned: calories,
          distance: Math.round(distance * 100) / 100 // Round to 2 decimal places
        })
        .eq('id', currentSession.id)
        .select()
        .single();

      if (error) throw error;

      setCurrentSession(null);
      return { data, error: null };
    } catch (error: any) {
      console.error('Error ending walking session:', error);
      return { error, data: null };
    } finally {
      setLoading(false);
    }
  }, [user, currentSession, selectedSpeed, calculateWalkingCalories]);

  // Load active session on mount
  useEffect(() => {
    loadActiveSession();
  }, [loadActiveSession]);

  return {
    currentSession,
    loading,
    selectedSpeed,
    setSelectedSpeed,
    startWalkingSession,
    endWalkingSession,
    loadActiveSession
  };
};