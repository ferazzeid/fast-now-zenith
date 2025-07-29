import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

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
        throw error;
      }

      setCurrentSession(data as FastingSession || null);
    } catch (error) {
      console.error('Error loading active session:', error);
      setCurrentSession(null);
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

      setCurrentSession(data as FastingSession);
      return data as FastingSession;
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

      const { data, error } = await supabase
        .from('fasting_sessions')
        .update({
          status: 'completed',
          end_time: endTime,
          duration_seconds: durationSeconds
        })
        .eq('id', targetSessionId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setCurrentSession(null);
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