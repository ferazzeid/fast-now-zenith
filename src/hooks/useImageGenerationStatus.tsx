import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface ImageGeneration {
  id: string;
  motivator_id: string;
  status: string;
  image_url: string | null;
  error_message: string | null;
  completed_at: string | null;
}

export const useImageGenerationStatus = (motivatorId?: string) => {
  const { user } = useAuth();
  const [generations, setGenerations] = useState<ImageGeneration[]>([]);
  const [loading, setLoading] = useState(false);

  // Get the current generation status for a specific motivator
  const getGenerationStatus = (targetMotivatorId: string) => {
    const generation = generations.find(g => g.motivator_id === targetMotivatorId);
    return generation?.status || null;
  };

  // Load existing generations
  const loadGenerations = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('motivator_image_generations')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['pending', 'generating'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading generations:', error);
        return;
      }

      setGenerations(data || []);
    } catch (error) {
      console.error('Error loading generations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    loadGenerations();

    const channel = supabase
      .channel('motivator-image-generations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'motivator_image_generations',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Generation status change:', payload);
          
          if (payload.eventType === 'INSERT') {
            setGenerations(prev => [...prev, payload.new as ImageGeneration]);
          } else if (payload.eventType === 'UPDATE') {
            setGenerations(prev => 
              prev.map(gen => 
                gen.id === payload.new.id ? payload.new as ImageGeneration : gen
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setGenerations(prev => 
              prev.filter(gen => gen.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Clean up completed/failed generations after a delay
  useEffect(() => {
    const cleanup = setTimeout(() => {
      setGenerations(prev => 
        prev.filter(gen => !['completed', 'failed'].includes(gen.status))
      );
    }, 5000); // Keep completed/failed for 5 seconds

    return () => clearTimeout(cleanup);
  }, [generations]);

  return {
    generations,
    loading,
    getGenerationStatus,
    refreshGenerations: loadGenerations
  };
};