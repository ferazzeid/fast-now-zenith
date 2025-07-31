import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStableAuth } from './useStableAuth';
import { useToast } from './use-toast';
import { useLoadingManager } from './useLoadingManager';

export interface Motivator {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  imageUrl?: string;
}

export interface CreateMotivatorData {
  title: string;
  content: string;
  category: string;
  imageUrl?: string;
}

export const useMotivators = () => {
  const [motivators, setMotivators] = useState<Motivator[]>([]);
  const { user } = useStableAuth();
  const { toast } = useToast();
  const { loading, startLoading, stopLoading } = useLoadingManager('motivators');

  const loadMotivators = async () => {
    if (!user) {
      stopLoading();
      return;
    }

    startLoading();
    try {
      const { data, error } = await supabase
        .from('motivators')
        .select('*, image_url')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data to include imageUrl property
      const transformedData = (data || []).map((item: any) => ({
        ...item,
        imageUrl: item.image_url
      }));
      
      setMotivators(transformedData);
    } catch (error) {
      console.error('Error loading motivators:', error);
      toast({
        title: "Error loading motivators",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      stopLoading();
    }
  };

  const createMotivator = async (motivatorData: CreateMotivatorData): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('motivators')
        .insert({
          user_id: user.id,
          title: motivatorData.title,
          content: motivatorData.content,
          category: motivatorData.category,
          image_url: motivatorData.imageUrl,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const transformedData = { ...data, imageUrl: data.image_url };
        setMotivators(prev => [transformedData as Motivator, ...prev]);
        toast({
          title: "✨ Motivator Created!",
          description: "Your new motivator has been saved.",
        });
        return data.id;
      }
      return null;
    } catch (error) {
      console.error('Error creating motivator:', error);
      toast({
        title: "Error creating motivator",
        description: "Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateMotivator = async (id: string, updates: Partial<CreateMotivatorData>): Promise<boolean> => {
    if (!user) return false;

    try {
      // Map imageUrl to image_url for database
      const dbUpdates: any = { ...updates };
      if (updates.imageUrl !== undefined) {
        dbUpdates.image_url = updates.imageUrl;
        delete dbUpdates.imageUrl;
      }

      const { error } = await supabase
        .from('motivators')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setMotivators(prev => 
        prev.map(m => m.id === id ? { ...m, ...updates } : m)
      );

      toast({
        title: "✨ Motivator Updated!",
        description: "Your changes have been saved.",
      });
      return true;
    } catch (error) {
      console.error('Error updating motivator:', error);
      toast({
        title: "Error updating motivator",
        description: "Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteMotivator = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('motivators')
        .update({ is_active: false })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setMotivators(prev => prev.filter(m => m.id !== id));
      
      toast({
        title: "🗑️ Motivator Removed",
        description: "Motivator has been deleted.",
      });
      return true;
    } catch (error) {
      console.error('Error deleting motivator:', error);
      toast({
        title: "Error deleting motivator",
        description: "Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    loadMotivators();
  }, [user]);

  return {
    motivators,
    loading,
    createMotivator,
    updateMotivator,
    deleteMotivator,
    refreshMotivators: loadMotivators
  };
};