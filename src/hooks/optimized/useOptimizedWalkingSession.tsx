import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { useBaseQuery } from '@/hooks/useBaseQuery';

export interface WalkingSession {
  id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  distance?: number;
  calories_burned?: number;
  speed_mph?: number;
  estimated_steps?: number;
  session_state?: string;
  pause_start_time?: string;
  total_pause_duration?: number;
  created_at: string;
  deleted_at?: string;
  is_edited?: boolean;
  original_duration_minutes?: number;
  edit_reason?: string;
  status?: string;
}

const walkingSessionsQueryKey = (userId: string | null) => ['walking-sessions', userId];
const activeSessionQueryKey = (userId: string | null) => ['active-walking-session', userId];

export const useOptimizedWalkingSession = () => {
  const user = useAuthStore(state => state.user);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get all walking sessions using useBaseQuery
  const walkingSessionsQuery = useBaseQuery(
    walkingSessionsQueryKey(user?.id || null),
    async (): Promise<WalkingSession[]> => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('walking_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false })
        .limit(50); // Limit to recent sessions

      if (error) throw error;
      return data || [];
    },
    {
      enabled: !!user?.id,
      staleTime: 30 * 1000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Get active walking session using useBaseQuery
  const activeSessionQuery = useBaseQuery(
    activeSessionQueryKey(user?.id || null),
    async (): Promise<WalkingSession | null> => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('walking_sessions')
        .select('*')
        .eq('user_id', user.id)
        .in('session_state', ['active', 'paused'])
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || null;
    },
    {
      enabled: !!user?.id,
      staleTime: 5 * 1000, // 5 seconds for active session
      gcTime: 30 * 1000, // 30 seconds
      refetchInterval: (data) => data ? 30000 : false, // Only poll every 30s if active session
      refetchOnWindowFocus: true, // Sync when user returns to tab
    }
  );

  // Start walking session mutation
  const startSessionMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');

      // End any existing active sessions first
      await supabase
        .from('walking_sessions')
        .update({ 
          session_state: 'cancelled',
          end_time: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .in('session_state', ['active', 'paused']);

      const { data, error } = await supabase
        .from('walking_sessions')
        .insert({
          user_id: user.id,
          start_time: new Date().toISOString(),
          session_state: 'active',
          speed_mph: 3, // Default walking speed
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async () => {
      // Optimistic update
      const optimisticSession: WalkingSession = {
        id: `temp-${Date.now()}`,
        user_id: user?.id || '',
        start_time: new Date().toISOString(),
        session_state: 'active',
        speed_mph: 3,
        created_at: new Date().toISOString(),
      };
      queryClient.setQueryData(activeSessionQueryKey(user?.id || null), optimisticSession);
      return { optimisticSession };
    },
    onSuccess: (data) => {
      // Update both queries with real data
      queryClient.setQueryData(activeSessionQueryKey(user?.id || null), data);
      queryClient.invalidateQueries({ queryKey: walkingSessionsQueryKey(user?.id || null) });
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      queryClient.setQueryData(activeSessionQueryKey(user?.id || null), null);
      toast({
        title: "Failed to Start Walking",
        description: "There was an error starting your walking session.",
        variant: "destructive",
      });
    },
  });

  // Pause walking session mutation
  const pauseSessionMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const activeSession = queryClient.getQueryData(activeSessionQueryKey(user.id));
      if (!activeSession) throw new Error('No active session found');

      const { data, error } = await supabase
        .from('walking_sessions')
        .update({
          session_state: 'paused',
          pause_start_time: new Date().toISOString(),
        })
        .eq('id', (activeSession as WalkingSession).id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async () => {
      const previousSession = queryClient.getQueryData(activeSessionQueryKey(user?.id || null));
      queryClient.setQueryData(activeSessionQueryKey(user?.id || null), (old: WalkingSession | null) => {
        if (!old) return null;
        return { ...old, session_state: 'paused', pause_start_time: new Date().toISOString() };
      });
      return { previousSession };
    },
    onError: (err, variables, context) => {
      if (context?.previousSession) {
        queryClient.setQueryData(activeSessionQueryKey(user?.id || null), context.previousSession);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(activeSessionQueryKey(user?.id || null), data);
    },
  });

  // Resume walking session mutation
  const resumeSessionMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const activeSession = queryClient.getQueryData(activeSessionQueryKey(user.id)) as WalkingSession;
      if (!activeSession) throw new Error('No active session found');

      let totalPauseDuration = (activeSession.total_pause_duration || 0);
      
      if (activeSession.pause_start_time) {
        const pauseDuration = Math.floor((Date.now() - new Date(activeSession.pause_start_time).getTime()) / 1000);
        totalPauseDuration += pauseDuration;
      }

      const { data, error } = await supabase
        .from('walking_sessions')
        .update({
          session_state: 'active',
          pause_start_time: null,
          total_pause_duration: totalPauseDuration,
        })
        .eq('id', activeSession.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async () => {
      const previousSession = queryClient.getQueryData(activeSessionQueryKey(user?.id || null));
      queryClient.setQueryData(activeSessionQueryKey(user?.id || null), (old: WalkingSession | null) => {
        if (!old) return null;
        return { ...old, session_state: 'active', pause_start_time: null };
      });
      return { previousSession };
    },
    onError: (err, variables, context) => {
      if (context?.previousSession) {
        queryClient.setQueryData(activeSessionQueryKey(user?.id || null), context.previousSession);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(activeSessionQueryKey(user?.id || null), data);
    },
  });

  // End walking session mutation
  const endSessionMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const activeSession = queryClient.getQueryData(activeSessionQueryKey(user.id)) as WalkingSession;
      if (!activeSession) throw new Error('No active session found');

      const now = new Date();
      const startTime = new Date(activeSession.start_time);
      let totalElapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      
      // Calculate total pause time
      let totalPauseTime = activeSession.total_pause_duration || 0;
      if (activeSession.session_state === 'paused' && activeSession.pause_start_time) {
        const currentPauseDuration = Math.floor((now.getTime() - new Date(activeSession.pause_start_time).getTime()) / 1000);
        totalPauseTime += currentPauseDuration;
      }
      
      const activeDurationSeconds = Math.max(0, totalElapsed - totalPauseTime);
      const durationMinutes = Math.floor(activeDurationSeconds / 60);

      const { data, error } = await supabase
        .from('walking_sessions')
        .update({
          end_time: now.toISOString(),
          session_state: 'completed',
          duration_minutes: durationMinutes,
        })
        .eq('id', activeSession.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async () => {
      queryClient.setQueryData(activeSessionQueryKey(user?.id || null), null);
    },
    onSuccess: (data) => {
      // Clear active session and update sessions list
      queryClient.setQueryData(activeSessionQueryKey(user?.id || null), null);
      queryClient.invalidateQueries({ queryKey: walkingSessionsQueryKey(user?.id || null) });
    },
    onError: (err, variables, context) => {
      // Refetch active session on error
      queryClient.invalidateQueries({ queryKey: activeSessionQueryKey(user?.id || null) });
    },
  });

  // Cancel walking session mutation
  const cancelSessionMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const activeSession = queryClient.getQueryData(activeSessionQueryKey(user.id)) as WalkingSession;
      if (!activeSession) throw new Error('No active session found');

      const { data, error } = await supabase
        .from('walking_sessions')
        .update({
          session_state: 'cancelled',
          end_time: new Date().toISOString(),
        })
        .eq('id', activeSession.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async () => {
      queryClient.setQueryData(activeSessionQueryKey(user?.id || null), null);
    },
    onSuccess: () => {
      queryClient.setQueryData(activeSessionQueryKey(user?.id || null), null);
      queryClient.invalidateQueries({ queryKey: walkingSessionsQueryKey(user?.id || null) });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: activeSessionQueryKey(user?.id || null) });
    },
  });

  // Update session speed mutation (for real-time updates)
  const updateSessionSpeedMutation = useMutation({
    mutationFn: async (speed: number) => {
      if (!user) throw new Error('User not authenticated');

      const activeSession = queryClient.getQueryData(activeSessionQueryKey(user.id));
      if (!activeSession) throw new Error('No active session found');

      // Update both the session and save to profile as default
      const [sessionUpdate, profileUpdate] = await Promise.all([
        supabase
          .from('walking_sessions')
          .update({ speed_mph: speed })
          .eq('id', (activeSession as WalkingSession).id)
          .eq('user_id', user.id)
          .select()
          .single(),
        supabase
          .from('profiles')
          .update({ default_walking_speed: speed })
          .eq('user_id', user.id)
      ]);

      if (sessionUpdate.error) throw sessionUpdate.error;
      return sessionUpdate.data;
    },
    onMutate: async (speed) => {
      // Optimistically update active session
      queryClient.setQueryData(activeSessionQueryKey(user?.id || null), (old: WalkingSession | null) => {
        if (!old) return null;
        return { ...old, speed_mph: speed };
      });
    },
    onError: (err, speed, context) => {
      // Revert optimistic update on error
      queryClient.invalidateQueries({ queryKey: activeSessionQueryKey(user?.id || null) });
      toast({
        title: "Failed to update speed",
        description: "Could not save walking speed preference.",
        variant: "destructive",
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(activeSessionQueryKey(user?.id || null), data);
    },
  });

  // Helper function to calculate elapsed time
  const getElapsedTime = (session: WalkingSession | null): number => {
    if (!session) return 0;
    
    const now = new Date();
    const startTime = new Date(session.start_time);
    let totalElapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
    
    // Subtract total pause duration
    let totalPauseTime = session.total_pause_duration || 0;
    
    // If currently paused, add current pause duration
    if (session.session_state === 'paused' && session.pause_start_time) {
      const currentPauseDuration = Math.floor((now.getTime() - new Date(session.pause_start_time).getTime()) / 1000);
      totalPauseTime += currentPauseDuration;
    }
    
    return Math.max(0, totalElapsed - totalPauseTime);
  };

  return {
    // Data
    sessions: walkingSessionsQuery.data || [],
    activeSession: activeSessionQuery.data,
    currentSession: activeSessionQuery.data, // Alias for compatibility
    
    // Computed states
    isPaused: activeSessionQuery.data?.session_state === 'paused',
    selectedSpeed: activeSessionQuery.data?.speed_mph || 3,
    elapsedTime: getElapsedTime(activeSessionQuery.data),
    
    // Loading states using enhanced BaseQuery states
    loading: walkingSessionsQuery.isInitialLoading || activeSessionQuery.isInitialLoading,
    activeSessionLoading: activeSessionQuery.isInitialLoading,
    isRefetching: walkingSessionsQuery.isRefetching,
    error: walkingSessionsQuery.error || activeSessionQuery.error,
    errorMessage: walkingSessionsQuery.errorMessage || activeSessionQuery.errorMessage,
    
    // Actions
    startWalkingSession: startSessionMutation.mutateAsync,
    pauseWalkingSession: pauseSessionMutation.mutateAsync,
    resumeWalkingSession: resumeSessionMutation.mutateAsync,
    endWalkingSession: endSessionMutation.mutateAsync,
    cancelWalkingSession: cancelSessionMutation.mutateAsync,
    updateSessionSpeed: updateSessionSpeedMutation.mutateAsync,
    
    // Action states
    isStarting: startSessionMutation.isPending,
    isEnding: endSessionMutation.isPending,
    isPausing: pauseSessionMutation.isPending,
    isResuming: resumeSessionMutation.isPending,
    isCancelling: cancelSessionMutation.isPending,
    isUpdatingSpeed: updateSessionSpeedMutation.isPending,
    
    // Refetch functions
    refetchSessions: walkingSessionsQuery.refetch,
    refetchActiveSession: activeSessionQuery.refetch,
    loadActiveSession: activeSessionQuery.refetch, // Alias for compatibility
  };
};