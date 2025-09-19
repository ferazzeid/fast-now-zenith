import { useState } from 'react';
import { useBaseQuery } from '@/hooks/useBaseQuery';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';

interface Journey {
  id: string;
  user_id: string;
  journey_type: string;
  start_date: string;
  current_weight_at_start: number;
  target_weight: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface JourneyProgress {
  id: string;
  journey_id: string;
  progress_date: string;
  daily_deficit: number;
  fat_burned_grams: number;
  weight_on_day: number | null;
  notes: string | null;
}

export const useJourneyTracking = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch active journey
  const { data: activeJourney, isLoading: journeyLoading, refetch: refetchJourney } = useBaseQuery<Journey | null>(
    ['active-journey'],
    async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;

      const { data, error } = await supabase
        .from('user_journeys')
        .select('*')
        .eq('user_id', user.user.id)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // Ignore "no rows" error
      return data;
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Fetch journey progress
  const { data: journeyProgress } = useBaseQuery<JourneyProgress[]>(
    ['journey-progress', activeJourney?.id],
    async () => {
      if (!activeJourney) return [];

      const { data, error } = await supabase
        .from('journey_daily_progress')
        .select('*')
        .eq('journey_id', activeJourney.id)
        .order('progress_date', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    {
      enabled: !!activeJourney,
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );

  // Start journey mutation
  const startJourneyMutation = useMutation({
    mutationFn: async ({ startWeight, targetWeight }: { startWeight: number; targetWeight: number }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      // End any existing active journeys
      await supabase
        .from('user_journeys')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('user_id', user.user.id)
        .eq('is_active', true);

      // Create new journey
      const { data, error } = await supabase
        .from('user_journeys')
        .insert({
          user_id: user.user.id,
          journey_type: '90_day',
          start_date: new Date().toISOString().split('T')[0],
          current_weight_at_start: startWeight,
          target_weight: targetWeight,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Journey Started!",
        description: "Your 90-day weight loss journey has begun. Track your daily progress and stay motivated!",
      });
      queryClient.invalidateQueries({ queryKey: ['active-journey'] });
    },
    onError: (error) => {
      toast({
        title: "Error Starting Journey",
        description: error instanceof Error ? error.message : "Failed to start journey",
        variant: "destructive",
      });
    },
  });

  // Calculate current day of journey
  const getCurrentDay = () => {
    if (!activeJourney) return 0;
    
    const startDate = new Date(activeJourney.start_date);
    const today = new Date();
    const diffTime = today.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays + 1); // +1 because day 1 is the start date
  };

  // Calculate total fat burned so far
  const getTotalFatBurned = () => {
    if (!journeyProgress) return 0;
    return journeyProgress.reduce((total, day) => total + (day.fat_burned_grams || 0), 0);
  };

  // Calculate average daily deficit
  const getAverageDeficit = () => {
    if (!journeyProgress || journeyProgress.length === 0) return 0;
    const totalDeficit = journeyProgress.reduce((total, day) => total + (day.daily_deficit || 0), 0);
    return Math.round(totalDeficit / journeyProgress.length);
  };

  return {
    activeJourney,
    journeyProgress,
    journeyLoading,
    startJourney: startJourneyMutation.mutate,
    isStartingJourney: startJourneyMutation.isPending,
    getCurrentDay,
    getTotalFatBurned,
    getAverageDeficit,
    refetchJourney,
  };
};