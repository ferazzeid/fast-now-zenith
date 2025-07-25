import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface WalkingSession {
  id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  calories_burned?: number;
  distance?: number;
  status: string;
}

export const useWalkingSession = () => {
  const [currentSession, setCurrentSession] = useState<WalkingSession | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

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

  const startWalkingSession = useCallback(async () => {
    if (!user) return { error: { message: 'User not authenticated' } };

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('walking_sessions')
        .insert({
          user_id: user.id,
          start_time: new Date().toISOString(),
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentSession(data);
      return { data, error: null };
    } catch (error: any) {
      console.error('Error starting walking session:', error);
      return { error, data: null };
    } finally {
      setLoading(false);
    }
  }, [user]);

  const endWalkingSession = useCallback(async () => {
    if (!user || !currentSession) return { error: { message: 'No active session' } };

    setLoading(true);
    try {
      const endTime = new Date();
      const startTime = new Date(currentSession.start_time);
      const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
      
      // Simple calorie calculation: ~3.5 calories per minute for walking
      // This would be enhanced with user weight, pace, etc.
      const estimatedCalories = Math.round(durationMinutes * 3.5);

      const { data, error } = await supabase
        .from('walking_sessions')
        .update({
          end_time: endTime.toISOString(),
          status: 'completed',
          calories_burned: estimatedCalories
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
  }, [user, currentSession]);

  return {
    currentSession,
    loading,
    startWalkingSession,
    endWalkingSession,
    loadActiveSession
  };
};