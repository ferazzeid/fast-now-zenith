import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface AdminGoalIdea {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl?: string;
}

export const useAdminGoalIdeas = () => {
  const [goalIdeas, setGoalIdeas] = useState<AdminGoalIdea[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadGoalIdeas = async (retryCount = 0) => {
    console.log('🔄 Loading admin goal ideas...', retryCount > 0 ? `(retry ${retryCount})` : '');
    try {
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'admin_goal_ideas')
        .maybeSingle();

      if (error) {
        console.error('Admin Goal Ideas Database error:', error);
        
        // Retry on network errors up to 3 times with backoff
        if (error.message?.includes('Failed to fetch') && retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
          console.log(`⏳ Retrying in ${delay}ms...`);
          setTimeout(() => loadGoalIdeas(retryCount + 1), delay);
          return;
        }
        
        toast({
          variant: "destructive",
          title: "Connection Error",
          description: "Failed to load motivator ideas. Please check your connection and try again."
        });
        setGoalIdeas([]);
        setLoading(false);
        return;
      }

      if (data?.setting_value) {
        try {
          const parsedGoalIdeas = JSON.parse(data.setting_value);
          const validIdeas = Array.isArray(parsedGoalIdeas) ? parsedGoalIdeas : [];
          console.log('✅ Admin Goal Ideas loaded successfully:', validIdeas);
          // Create completely new array to force React re-render
          setGoalIdeas(validIdeas.map(idea => ({ ...idea })));
        } catch (parseError) {
          console.error('Error parsing admin goal ideas:', parseError);
          toast({
            variant: "destructive",
            title: "Data Error",
            description: "Failed to parse motivator ideas data."
          });
          setGoalIdeas([]);
        }
      } else {
        console.log('No admin goal ideas data found in database');
        setGoalIdeas([]);
      }
    } catch (error) {
      console.error('Error loading admin goal ideas:', error);
      
      // Retry on network errors
      if (error.message?.includes('Failed to fetch') && retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`⏳ Retrying in ${delay}ms...`);
        setTimeout(() => loadGoalIdeas(retryCount + 1), delay);
        return;
      }
      
      toast({
        variant: "destructive", 
        title: "Connection Error",
        description: "Failed to load motivator ideas. Please check your connection and try again."
      });
      setGoalIdeas([]);
    } finally {
      if (retryCount >= 3) {
        setLoading(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadGoalIdeas();
  }, [refreshTrigger]);

  const forceRefresh = () => {
    console.log('🔄 Force refreshing admin goal ideas...');
    setRefreshTrigger(prev => prev + 1);
  };

  return {
    goalIdeas,
    loading,
    refreshGoalIdeas: loadGoalIdeas,
    forceRefresh
  };
};