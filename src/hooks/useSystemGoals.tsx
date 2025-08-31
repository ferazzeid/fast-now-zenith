import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from './use-toast';

export interface SystemGoal {
  id: string;
  title: string;
  content: string;
  category: string;
  image_url?: string;
  gender: string;  // Changed from 'male' | 'female' to string for compatibility
  slug: string;
  is_system_goal: boolean;
  is_active: boolean;
  is_published: boolean;
}

export const useSystemGoals = () => {
  const [goals, setGoals] = useState<SystemGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const loadSystemGoals = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Get user's gender from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('sex')
        .eq('user_id', user.id)
        .single();

      const userGender = profile?.sex || 'male'; // default to male if no profile

      // Load system goals filtered by user's gender
      const { data, error } = await supabase
        .from('motivators')
        .select('*')
        .eq('is_system_goal', true)
        .eq('gender', userGender)
        .eq('is_active', true)
        .eq('is_published', true)
        .order('title', { ascending: true });

      if (error) throw error;

      setGoals(data || []);
    } catch (error) {
      console.error('Error loading system goals:', error);
      toast({
        title: "Error loading goals",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSystemGoals();
  }, [user?.id]);

  return {
    goals,
    loading,
    refreshGoals: loadSystemGoals
  };
};