import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { persistFastingSession, getPersistedFastingSession } from '@/utils/timerPersistence';
import { enqueueOperation } from '@/utils/outbox';

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

export const useOfflineFastingSession = () => {
  const [currentSession, setCurrentSession] = useState<FastingSession | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load active session with offline support
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

      if (error && navigator.onLine) {
        console.error('Error loading fasting session:', error);
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
    const startTime = customStartTime ? customStartTime.toISOString() : new Date().toISOString();
    const localId = `local-${Date.now()}`;

    // Create optimistic session
    const optimisticSession: FastingSession = {
      id: localId,
      user_id: user.id,
      start_time: startTime,
      goal_duration_seconds: goalDurationSeconds,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      if (navigator.onLine) {
        // Try online operation first
        await supabase
          .from('fasting_sessions')
          .update({ 
            status: 'cancelled',
            end_time: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('status', 'active');

        const { data, error } = await supabase
          .from('fasting_sessions')
          .insert([{
            user_id: user.id,
            start_time: startTime,
            goal_duration_seconds: goalDurationSeconds,
            status: 'active'
          }])
          .select()
          .single();

        if (error) throw error;

        const session = data as FastingSession;
        setCurrentSession(session);
        persistFastingSession({
          id: session.id,
          start_time: session.start_time,
          goal_duration_seconds: session.goal_duration_seconds,
          status: session.status,
          user_id: session.user_id,
        });
        
        return session;
      } else {
        throw new Error('Offline mode');
      }
    } catch (error) {
      console.log('Going offline for fasting session start');
      
      // Queue for later sync
      await enqueueOperation({
        entity: 'fasting_session',
        action: 'start',
        user_id: user.id,
        payload: {
          local_id: localId,
          start_time: startTime,
          goal_duration_seconds: goalDurationSeconds,
        },
      });

      // Set optimistic session
      setCurrentSession(optimisticSession);
      persistFastingSession({
        id: localId,
        start_time: startTime,
        goal_duration_seconds: goalDurationSeconds,
        status: 'active',
        user_id: user.id,
      });

      toast({
        title: "🎯 Fasting Started (Offline)",
        description: "Your session will sync when back online.",
      });

      return optimisticSession;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const endFastingSession = useCallback(async (sessionId?: string) => {
    if (!user || !currentSession) return null;

    const targetSessionId = sessionId || currentSession.id;
    setLoading(true);

    try {
      const endTime = new Date().toISOString();
      const startTime = currentSession.start_time;
      const durationSeconds = Math.floor((new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000);
      const status = 'completed';

      if (navigator.onLine && !targetSessionId.startsWith('local-')) {
        // Try online operation
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
        persistFastingSession(null);
        return data;
      } else {
        throw new Error('Offline mode or local session');
      }
    } catch (error) {
      console.log('Going offline for fasting session end');
      
      // Queue for later sync
      await enqueueOperation({
        entity: 'fasting_session',
        action: 'end',
        user_id: user.id,
        payload: {
          session_id: targetSessionId,
          end_time: new Date().toISOString(),
          duration_seconds: Math.floor((new Date().getTime() - new Date(currentSession.start_time).getTime()) / 1000),
          status: 'completed',
        },
      });

      setCurrentSession(null);
      persistFastingSession(null);

      toast({
        title: "🎉 Fasting Completed (Offline)",
        description: "Your session will sync when back online.",
      });

      return null;
    } finally {
      setLoading(false);
    }
  }, [user, currentSession, toast]);

  const cancelFastingSession = useCallback(async (sessionId?: string) => {
    if (!user || !currentSession) return null;

    const targetSessionId = sessionId || currentSession.id;
    setLoading(true);

    try {
      if (navigator.onLine && !targetSessionId.startsWith('local-')) {
        // Try online operation
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
        persistFastingSession(null);
        return data;
      } else {
        throw new Error('Offline mode or local session');
      }
    } catch (error) {
      console.log('Going offline for fasting session cancel');
      
      // Queue for later sync
      await enqueueOperation({
        entity: 'fasting_session',
        action: 'cancel',
        user_id: user.id,
        payload: {
          session_id: targetSessionId,
        },
      });

      setCurrentSession(null);
      persistFastingSession(null);

      toast({
        title: "Fasting Cancelled (Offline)",
        description: "Your cancellation will sync when back online.",
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