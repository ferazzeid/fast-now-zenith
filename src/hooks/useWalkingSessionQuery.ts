import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';

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
  created_at: string;
  deleted_at?: string;
}

const walkingSessionsQueryKey = (userId: string | null) => ['walking-sessions', userId];
const activeSessionQueryKey = (userId: string | null) => ['active-walking-session', userId];

export const useWalkingSessionQuery = () => {
  const user = useAuthStore(state => state.user);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get all walking sessions
  const walkingSessionsQuery = useQuery({
    queryKey: walkingSessionsQueryKey(user?.id || null),
    queryFn: async (): Promise<WalkingSession[]> => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('walking_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false })
        .limit(50); // Limit to recent sessions

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });

  // Get active walking session
  const activeSessionQuery = useQuery({
    queryKey: activeSessionQueryKey(user?.id || null),
    queryFn: async (): Promise<WalkingSession | null> => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('walking_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('session_state', 'active')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || null;
    },
    enabled: !!user?.id,
    staleTime: 5 * 1000, // 5 seconds for active session
    gcTime: 30 * 1000, // 30 seconds
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
    retry: 3,
  });

  // Start walking session mutation
  const startSessionMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('walking_sessions')
        .insert({
          user_id: user.id,
          start_time: new Date().toISOString(),
          session_state: 'active',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Update both queries
      queryClient.setQueryData(activeSessionQueryKey(user?.id || null), data);
      queryClient.invalidateQueries({ queryKey: walkingSessionsQueryKey(user?.id || null) });
      
      toast({
        title: "Walking Started",
        description: "Your walking session has begun. Good luck!",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Start Walking",
        description: "There was an error starting your walking session.",
        variant: "destructive",
      });
    },
  });

  // End walking session mutation
  const endSessionMutation = useMutation({
    mutationFn: async (sessionData: {
      duration_minutes: number;
      distance_km?: number;
      calories_burned?: number;
      average_speed_kmh?: number;
      steps?: number;
    }) => {
      if (!user) throw new Error('User not authenticated');

      const activeSession = queryClient.getQueryData(activeSessionQueryKey(user.id));
      if (!activeSession) throw new Error('No active session found');

      const { data, error } = await supabase
        .from('walking_sessions')
        .update({
          end_time: new Date().toISOString(),
          session_state: 'completed',
          duration_minutes: sessionData.duration_minutes,
          distance: sessionData.distance_km,
          calories_burned: sessionData.calories_burned,
          speed_mph: sessionData.average_speed_kmh,
          estimated_steps: sessionData.steps,
        })
        .eq('id', (activeSession as WalkingSession).id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Clear active session and update sessions list
      queryClient.setQueryData(activeSessionQueryKey(user?.id || null), null);
      queryClient.invalidateQueries({ queryKey: walkingSessionsQueryKey(user?.id || null) });
      
      toast({
        title: "Walking Complete",
        description: `Great job! You burned ${data.calories_burned || 0} calories.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to End Walking",
        description: "There was an error ending your walking session.",
        variant: "destructive",
      });
    },
  });

  // Update active session mutation (for real-time updates)
  const updateSessionMutation = useMutation({
    mutationFn: async (updates: Partial<WalkingSession>) => {
      if (!user) throw new Error('User not authenticated');

      const activeSession = queryClient.getQueryData(activeSessionQueryKey(user.id));
      if (!activeSession) throw new Error('No active session found');

      const { data, error } = await supabase
        .from('walking_sessions')
        .update(updates)
        .eq('id', (activeSession as WalkingSession).id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (updates) => {
      // Optimistically update active session
      queryClient.setQueryData(activeSessionQueryKey(user?.id || null), (old: WalkingSession | null) => {
        if (!old) return null;
        return { ...old, ...updates };
      });
    },
    onError: (err, updates, context) => {
      // Revert optimistic update on error
      queryClient.invalidateQueries({ queryKey: activeSessionQueryKey(user?.id || null) });
    },
  });

  // Pause/Resume session mutation
  const togglePauseMutation = useMutation({
    mutationFn: async (isPaused: boolean) => {
      return await updateSessionMutation.mutateAsync({ 
        // Add pause tracking fields if needed
      });
    },
  });

  return {
    // Data
    sessions: walkingSessionsQuery.data || [],
    activeSession: activeSessionQuery.data,
    
    // Loading states
    loading: walkingSessionsQuery.isLoading,
    activeSessionLoading: activeSessionQuery.isLoading,
    
    // Actions
    startSession: startSessionMutation.mutate,
    endSession: endSessionMutation.mutate,
    updateSession: updateSessionMutation.mutate,
    togglePause: togglePauseMutation.mutate,
    
    // Action states
    isStarting: startSessionMutation.isPending,
    isEnding: endSessionMutation.isPending,
    isUpdating: updateSessionMutation.isPending,
    
    // Refetch functions
    refetchSessions: walkingSessionsQuery.refetch,
    refetchActiveSession: activeSessionQuery.refetch,
  };
};