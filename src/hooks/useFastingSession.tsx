import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { persistFastingSession, getPersistedFastingSession } from '@/utils/timerPersistence';

export interface FastingSession {
  id: string;
  start_time: string;
  end_time?: string;
  duration_seconds?: number;
  goal_duration_seconds?: number;
  status: 'active' | 'completed' | 'cancelled';
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const useFastingSession = () => {
  const [currentSession, setCurrentSession] = useState<FastingSession | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load active session on mount with proper user dependency
  const loadActiveSession = useCallback(async () => {
    if (!user) {
      setCurrentSession(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Try to get from server first
      const { data, error } = await supabase
        .from('fasting_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('start_time', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error loading fasting session:', error);
        // Don't throw - fall back to persisted session
      }

      const serverSession = data as FastingSession || null;
      setCurrentSession(serverSession);
      
      // Persist to local storage for offline fallback
      if (serverSession) {
        persistFastingSession({
          id: serverSession.id,
          start_time: serverSession.start_time,
          goal_duration_seconds: serverSession.goal_duration_seconds,
          status: serverSession.status,
          user_id: serverSession.user_id,
        });
      }
    } catch (error) {
      console.error('Error loading active session:', error);
      
      // Fall back to persisted session if network fails
      const persistedSession = getPersistedFastingSession();
      if (persistedSession && persistedSession.user_id === user.id && persistedSession.status === 'active') {
        setCurrentSession(persistedSession as FastingSession);
      } else {
        setCurrentSession(null);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadActiveSession();
    } else {
      setCurrentSession(null);
      setLoading(false);
    }
  }, [user, loadActiveSession]);

  const startFastingSession = useCallback(async (goalDurationSeconds: number, customStartTime?: Date) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to start a fasting session",
        variant: "destructive",
      });
      return null;
    }

    setLoading(true);
    try {
      // End any existing active sessions first
      await supabase
        .from('fasting_sessions')
        .update({ 
          status: 'cancelled',
          end_time: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('status', 'active');

      // Use custom start time or current time
      const startTime = customStartTime ? customStartTime.toISOString() : new Date().toISOString();

      // Create new session
      const { data, error } = await supabase
        .from('fasting_sessions')
        .insert([
          {
            user_id: user.id,
            start_time: startTime,
            goal_duration_seconds: goalDurationSeconds,
            status: 'active'
          }
        ])
        .select()
        .single();

      if (error) throw error;

      const session = data as FastingSession;
      setCurrentSession(session);
      
      // Persist to local storage
      persistFastingSession({
        id: session.id,
        start_time: session.start_time,
        goal_duration_seconds: session.goal_duration_seconds,
        status: session.status,
        user_id: session.user_id,
      });
      
      return session;
    } catch (error) {
      console.error('Error starting fasting session:', error);
      toast({
        title: "Error",
        description: "Failed to start fasting session",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const endFastingSession = useCallback(async (sessionId?: string) => {
    if (!user) return null;

    const targetSessionId = sessionId || currentSession?.id;
    if (!targetSessionId) return null;

    setLoading(true);
    try {
      const endTime = new Date().toISOString();
      const startTime = currentSession?.start_time || new Date().toISOString();
      const durationSeconds = Math.floor((new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000);
      
      // When manually ending a session, determine status based on whether goal was reached
      const goalDurationSeconds = currentSession?.goal_duration_seconds || 0;
      const status = durationSeconds >= goalDurationSeconds ? 'completed' : 'cancelled';

      const { data, error } = await supabase
        .from('fasting_sessions')
        .update({
          status,
          end_time: endTime,
          duration_seconds: durationSeconds
        })
        .eq('id', targetSessionId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setCurrentSession(null);
      persistFastingSession(null); // Clear persisted session
      return data;
    } catch (error) {
      console.error('Error ending fasting session:', error);
      toast({
        title: "Error",
        description: "Failed to end fasting session",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, currentSession, toast]);

  const cancelFastingSession = useCallback(async (sessionId?: string) => {
    if (!user) return null;

    const targetSessionId = sessionId || currentSession?.id;
    if (!targetSessionId) return null;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('fasting_sessions')
        .update({
          status: 'cancelled',
          end_time: new Date().toISOString()
        })
        .eq('id', targetSessionId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setCurrentSession(null);
      persistFastingSession(null); // Clear persisted session
      return data;
    } catch (error) {
      console.error('Error cancelling fasting session:', error);
      toast({
        title: "Error",
        description: "Failed to cancel fasting session",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, currentSession, toast]);


  return {
    currentSession,
    loading,
    startFastingSession,
    endFastingSession,
    cancelFastingSession,
    loadActiveSession
  };
};