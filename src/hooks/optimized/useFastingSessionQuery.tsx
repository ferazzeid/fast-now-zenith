/**
 * LOVABLE_COMPONENT_STATUS: UPGRADED
 * LOVABLE_MIGRATION_PHASE: 2
 * LOVABLE_PRESERVE: true
 * LOVABLE_DESCRIPTION: Optimized fasting session hook with React Query caching
 * LOVABLE_DEPENDENCIES: @tanstack/react-query, supabase
 * LOVABLE_PERFORMANCE_IMPACT: Eliminates fasting session refetching, instant Timer page loading
 * 
 * MIGRATION_NOTE: This replaces /hooks/useFastingSession.tsx with performance optimizations.
 * Provides instant loading from cache and real-time updates for active sessions.
 * 
 * PERFORMANCE_IMPROVEMENTS:
 * - React Query caching with intelligent stale times
 * - Instant loading from cache on tab switches
 * - Real-time updates for active sessions (5-second refresh)
 * - Optimistic updates for session start/stop
 * - Proper error boundaries and fallbacks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCallback } from 'react';

export interface FastingSession {
  id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  goal_duration_seconds?: number;
  actual_duration_seconds?: number;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

interface StartFastingSessionData {
  goal_duration_seconds: number;
  start_time?: Date; // Optional custom start time for retroactive fasts
}

// Query keys for cache management
const activeSessionQueryKey = (userId: string | null) => ['active-fasting-session', userId];
const fastingHistoryQueryKey = (userId: string | null) => ['fasting-history', userId];

export const useFastingSessionQuery = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // PERFORMANCE: Cached active fasting session query
  const activeSessionQuery = useQuery({
    queryKey: activeSessionQueryKey(user?.id || null),
    queryFn: async (): Promise<FastingSession | null> => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('fasting_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('start_time', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || null;
    },
    enabled: !!user?.id,
    staleTime: 5 * 1000, // PERFORMANCE: 5 seconds stale time for active sessions
    gcTime: 30 * 1000, // PERFORMANCE: 30 seconds garbage collection
    refetchInterval: (data) => {
      // PERFORMANCE: Only poll if there's an active session
      return data ? 5000 : false; // 5 seconds for active sessions
    },
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  // PERFORMANCE: Cached fasting history query
  const fastingHistoryQuery = useQuery({
    queryKey: fastingHistoryQueryKey(user?.id || null),
    queryFn: async (): Promise<FastingSession[]> => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('fasting_sessions')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['completed', 'cancelled'])
        .order('start_time', { ascending: false })
        .limit(50); // Limit to recent sessions

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // PERFORMANCE: 10 minutes stale time for history
    gcTime: 30 * 60 * 1000, // PERFORMANCE: 30 minutes garbage collection
    refetchOnWindowFocus: false,
    retry: 3,
  });

  // PERFORMANCE: Optimistic start fasting session mutation
  const startSessionMutation = useMutation({
    mutationFn: async (sessionData: StartFastingSessionData): Promise<FastingSession> => {
      if (!user) throw new Error('User not authenticated');

      // End any existing active sessions first
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
        .insert({
          user_id: user.id,
          start_time: sessionData.start_time ? sessionData.start_time.toISOString() : new Date().toISOString(),
          goal_duration_seconds: sessionData.goal_duration_seconds,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (sessionData) => {
      // PERFORMANCE: Optimistic update
      await queryClient.cancelQueries({ queryKey: activeSessionQueryKey(user?.id || null) });

      const optimisticSession: FastingSession = {
        id: `temp-${Date.now()}`,
        user_id: user?.id || '',
        start_time: sessionData.start_time ? sessionData.start_time.toISOString() : new Date().toISOString(),
        goal_duration_seconds: sessionData.goal_duration_seconds,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      queryClient.setQueryData(activeSessionQueryKey(user?.id || null), optimisticSession);

      return { optimisticSession };
    },
    onError: (err, sessionData, context) => {
      // Log the actual error for debugging
      console.error('Fasting session start error:', err);
      
      // Rollback on error
      queryClient.setQueryData(activeSessionQueryKey(user?.id || null), null);
      toast({
        title: "Error starting fasting session",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: (data) => {
      // Replace optimistic update with real data
      queryClient.setQueryData(activeSessionQueryKey(user?.id || null), data);
      
      toast({
        title: "🎯 Fasting Started!",
        description: "Your fasting session has begun. Good luck!",
      });
    },
  });

  // PERFORMANCE: Optimistic end fasting session mutation
  const endSessionMutation = useMutation({
    mutationFn: async (sessionId: string): Promise<FastingSession> => {
      if (!user) throw new Error('User not authenticated');

      const currentSession = activeSessionQuery.data;
      if (!currentSession) throw new Error('No active session found');

      const now = new Date();
      const startTime = new Date(currentSession.start_time);
      const actualDurationSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);

      const { data, error } = await supabase
        .from('fasting_sessions')
        .update({
          end_time: now.toISOString(),
          actual_duration_seconds: actualDurationSeconds,
          status: 'completed',
        })
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (sessionId) => {
      // PERFORMANCE: Optimistic update
      await queryClient.cancelQueries({ queryKey: activeSessionQueryKey(user?.id || null) });

      const previousSession = queryClient.getQueryData(activeSessionQueryKey(user?.id || null));

      // Optimistically set to null (no active session)
      queryClient.setQueryData(activeSessionQueryKey(user?.id || null), null);

      return { previousSession };
    },
    onError: (err, sessionId, context) => {
      // Rollback on error
      if (context?.previousSession) {
        queryClient.setQueryData(activeSessionQueryKey(user?.id || null), context.previousSession);
      }
      toast({
        title: "Error ending fasting session",
        description: "Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: (data) => {
      // Ensure no active session
      queryClient.setQueryData(activeSessionQueryKey(user?.id || null), null);
      
      // Add to history
      queryClient.setQueryData(
        fastingHistoryQueryKey(user?.id || null),
        (old: FastingSession[] = []) => [data, ...old]
      );

      const hours = Math.floor((data.actual_duration_seconds || 0) / 3600);
      const minutes = Math.floor(((data.actual_duration_seconds || 0) % 3600) / 60);
      
      toast({
        title: "🎉 Fasting Completed!",
        description: `Great job! You fasted for ${hours}h ${minutes}m.`,
      });
    },
  });

  // PERFORMANCE: Cancel session mutation
  const cancelSessionMutation = useMutation({
    mutationFn: async (sessionId: string): Promise<void> => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('fasting_sessions')
        .update({ status: 'cancelled' })
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      // Clear active session
      queryClient.setQueryData(activeSessionQueryKey(user?.id || null), null);
      
      // Refresh history
      queryClient.invalidateQueries({ queryKey: fastingHistoryQueryKey(user?.id || null) });

      toast({
        title: "Fasting Cancelled",
        description: "Your fasting session has been cancelled.",
      });
    },
    onError: () => {
      toast({
        title: "Error cancelling session",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  // PERFORMANCE: Optimized refresh function
  const refreshActiveSession = useCallback(async () => {
    await queryClient.refetchQueries({ queryKey: activeSessionQueryKey(user?.id || null) });
  }, [queryClient, user?.id]);

  const refreshHistory = useCallback(async () => {
    await queryClient.refetchQueries({ queryKey: fastingHistoryQueryKey(user?.id || null) });
  }, [queryClient, user?.id]);

  return {
    // Data
    currentSession: activeSessionQuery.data || null,
    fastingHistory: fastingHistoryQuery.data || [],
    
    // Loading states
    loading: activeSessionQuery.isLoading,
    historyLoading: fastingHistoryQuery.isLoading,
    
    // Actions
    startFastingSession: startSessionMutation.mutateAsync,
    endFastingSession: endSessionMutation.mutateAsync,
    cancelFastingSession: cancelSessionMutation.mutateAsync,
    refreshActiveSession,
    refreshHistory,
    
    // Mutation states
    isStarting: startSessionMutation.isPending,
    isEnding: endSessionMutation.isPending,
    isCancelling: cancelSessionMutation.isPending,
  };
};