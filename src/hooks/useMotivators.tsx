import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Motivator {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateMotivatorData {
  title: string;
  content: string;
  category: string;
}

export const useMotivators = () => {
  const [motivators, setMotivators] = useState<Motivator[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const loadMotivators = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('motivators')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMotivators(data || []);
    } catch (error) {
      console.error('Error loading motivators:', error);
      toast({
        title: "Error loading motivators",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setMotivators(prev => [data, ...prev]);
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
      const { error } = await supabase
        .from('motivators')
        .update(updates)
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