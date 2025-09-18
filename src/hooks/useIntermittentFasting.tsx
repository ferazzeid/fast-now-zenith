import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCallback } from 'react';

export interface IntermittentFastingSession {
  id: string;
  user_id: string;
  session_date: string;
  fasting_window_hours: number;
  eating_window_hours: number;
  fasting_start_time?: string;
  fasting_end_time?: string;
  eating_start_time?: string;
  eating_end_time?: string;
  status: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface IntermittentFastingPreset {
  name: string;
  fasting_hours: number;
  eating_hours: number;
  description: string;
}

// Common IF presets - simplified to core options
export const IF_PRESETS: IntermittentFastingPreset[] = [
  {
    name: '16:8',
    fasting_hours: 16,
    eating_hours: 8,
    description: 'Fast for 16 hours, eat within 8 hours'
  },
  {
    name: 'OMAD',
    fasting_hours: 23,
    eating_hours: 1,
    description: 'One Meal A Day - 23 hour fast'
  }
];

interface StartIFSessionData {
  fasting_window_hours: number;
  eating_window_hours: number;
  session_date?: Date;
}

const todaySessionQueryKey = (userId: string | null) => ['if-session-today', userId];
const ifHistoryQueryKey = (userId: string | null) => ['if-history', userId];

export const useIntermittentFasting = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for today's IF session
  const todaySessionQuery = useQuery({
    queryKey: todaySessionQueryKey(user?.id || null),
    queryFn: async (): Promise<IntermittentFastingSession | null> => {
      if (!user) return null;
      
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      const { data, error } = await supabase
        .from('intermittent_fasting_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('session_date', today)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || null;
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // 1 minute
  });

  // Query for IF history (last 30 days)
  const historyQuery = useQuery({
    queryKey: ifHistoryQueryKey(user?.id || null),
    queryFn: async (): Promise<IntermittentFastingSession[]> => {
      if (!user) return [];
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase
        .from('intermittent_fasting_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('session_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('session_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Start IF session mutation
  const startIFSessionMutation = useMutation({
    mutationFn: async (sessionData: StartIFSessionData): Promise<IntermittentFastingSession> => {
      if (!user) throw new Error('User not authenticated');

      // Check for active extended fasting session first
      const { data: activeExtendedSession } = await supabase
        .from('fasting_sessions')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (activeExtendedSession) {
        throw new Error('You have an active extended fasting session. Please complete it first.');
      }

      const sessionDate = sessionData.session_date || new Date();
      const dateString = sessionDate.toISOString().split('T')[0];

      // Check if session already exists for this date
      const { data: existingSession } = await supabase
        .from('intermittent_fasting_sessions')
        .select('id')
        .eq('user_id', user.id)
        .eq('session_date', dateString)
        .maybeSingle();

      if (existingSession) {
        throw new Error('IF session already exists for this date');
      }

      const { data, error } = await supabase
        .from('intermittent_fasting_sessions')
        .insert({
          user_id: user.id,
          session_date: dateString,
          fasting_window_hours: sessionData.fasting_window_hours,
          eating_window_hours: sessionData.eating_window_hours,
          status: 'setup'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(todaySessionQueryKey(user?.id || null), data);
      queryClient.invalidateQueries({ queryKey: ifHistoryQueryKey(user?.id || null) });
      
      toast({
        title: "IF Session Setup!",
        description: `Your ${data.fasting_window_hours}:${data.eating_window_hours} schedule is ready to start.`
      });
    },
    onError: (error) => {
      toast({
        title: "Error starting IF session",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      });
    }
  });

  // Start fasting window mutation
  const startFastingWindowMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      if (!user) throw new Error('User not authenticated');

      // Check for active extended fasting session before starting IF fasting
      const { data: activeExtendedSession } = await supabase
        .from('fasting_sessions')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (activeExtendedSession) {
        throw new Error('You have an active extended fasting session. Please complete it first.');
      }

      const { data, error } = await supabase
        .from('intermittent_fasting_sessions')
        .update({
          fasting_start_time: new Date().toISOString(),
          status: 'fasting'
        })
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(todaySessionQueryKey(user?.id || null), data);
      toast({
        title: "Fasting Window Started!",
        description: "Your fasting period has begun."
      });
    }
  });

  // End fasting window mutation
  const endFastingWindowMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('intermittent_fasting_sessions')
        .update({
          fasting_end_time: new Date().toISOString(),
          eating_start_time: new Date().toISOString(),
          status: 'eating'
        })
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(todaySessionQueryKey(user?.id || null), data);
      toast({
        title: "Eating Window Started!",
        description: "Your eating period has begun."
      });
    }
  });

  // End eating window mutation
  const endEatingWindowMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('intermittent_fasting_sessions')
        .update({
          eating_end_time: new Date().toISOString(),
          status: 'completed',
          completed: true
        })
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(todaySessionQueryKey(user?.id || null), data);
      queryClient.invalidateQueries({ queryKey: ifHistoryQueryKey(user?.id || null) });
      toast({
        title: "IF Session Completed!",
        description: "Great job completing your intermittent fasting day!"
      });
    }
  });

  // Check if IF is enabled
  const { data: ifEnabled } = useQuery({
    queryKey: ['admin-settings', 'intermittent_fasting_enabled'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'intermittent_fasting_enabled')
        .maybeSingle();
      
      if (error) throw error;
      return data?.setting_value === 'true';
    },
    staleTime: 10 * 60 * 1000 // 10 minutes
  });

  // Navigation counter integration - get smart timer status for IF
  const getIFTimerStatus = useCallback(() => {
    if (!todaySessionQuery.data) {
      return { time: null, isEating: false, label: 'Ready' };
    }

    const session = todaySessionQuery.data;
    const now = new Date();

    if (session.status === 'fasting' && session.fasting_start_time) {
      const fastingStart = new Date(session.fasting_start_time);
      const elapsed = Math.floor((now.getTime() - fastingStart.getTime()) / 1000);
      
      return {
        time: elapsed,
        isEating: false,
        label: 'Fasting'
      };
    } else if (session.status === 'eating' && session.eating_start_time) {
      const eatingStart = new Date(session.eating_start_time);
      const elapsed = Math.floor((now.getTime() - eatingStart.getTime()) / 1000);
      
      return {
        time: elapsed,
        isEating: true,
        label: 'Eating'
      };
    }

    return { time: null, isEating: false, label: 'Ready' };
  }, [todaySessionQuery.data]);

  // Utility functions
  const refreshTodaySession = useCallback(async () => {
    await queryClient.refetchQueries({ queryKey: todaySessionQueryKey(user?.id || null) });
  }, [queryClient, user?.id]);

  const refreshHistory = useCallback(async () => {
    await queryClient.refetchQueries({ queryKey: ifHistoryQueryKey(user?.id || null) });
  }, [queryClient, user?.id]);

  return {
    // Data
    todaySession: todaySessionQuery.data || null,
    history: historyQuery.data || [],
    ifEnabled: ifEnabled || false,
    
    // Loading states
    loading: todaySessionQuery.isLoading,
    historyLoading: historyQuery.isLoading,
    
    // Actions
    startIFSession: startIFSessionMutation.mutateAsync,
    startFastingWindow: startFastingWindowMutation.mutateAsync,
    endFastingWindow: endFastingWindowMutation.mutateAsync,
    endEatingWindow: endEatingWindowMutation.mutateAsync,
    refreshTodaySession,
    refreshHistory,
    
    // Mutation states
    isStartingSession: startIFSessionMutation.isPending,
    isStartingFasting: startFastingWindowMutation.isPending,
    isEndingFasting: endFastingWindowMutation.isPending,
    isEndingEating: endEatingWindowMutation.isPending,
    
    // Smart navigation timer status
    getIFTimerStatus,
  };
};