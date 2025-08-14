import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { enqueueOperation } from '@/utils/outbox';

interface FoodEntry {
  id: string;
  user_id: string;
  name: string;
  calories: number;
  carbs: number;
  serving_size: number;
  created_at: string;
  consumed: boolean;
  image_url?: string;
}

interface NewFoodEntry {
  name: string;
  calories: number;
  carbs: number;
  serving_size: number;
  consumed?: boolean;
  image_url?: string;
}

interface DailyTotals {
  calories: number;
  carbs: number;
}

export const useOfflineFoodEntries = () => {
  const [todayEntries, setTodayEntries] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Calculate daily totals from entries
  const todayTotals: DailyTotals = {
    calories: todayEntries.filter(entry => entry.consumed).reduce((sum, entry) => sum + entry.calories, 0),
    carbs: todayEntries.filter(entry => entry.consumed).reduce((sum, entry) => sum + entry.carbs, 0),
  };

  // Load food entries with offline support
  const loadFoodEntries = useCallback(async () => {
    if (!user) {
      setTodayEntries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data, error } = await supabase
        .from('food_entries')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString())
        .order('consumed', { ascending: true })
        .order('created_at', { ascending: false });

      if (error && navigator.onLine) {
        console.error('Error loading food entries:', error);
        return;
      }

      setTodayEntries(data || []);
    } catch (error) {
      console.error('Error loading food entries:', error);
      // Keep existing entries if offline
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadFoodEntries();
    } else {
      setTodayEntries([]);
      setLoading(false);
    }
  }, [user, loadFoodEntries]);

  const addFoodEntry = useCallback(async (newEntry: NewFoodEntry) => {
    if (!user) throw new Error('User not authenticated');

    const localId = `local-${Date.now()}`;
    const optimisticEntry: FoodEntry = {
      id: localId,
      user_id: user.id,
      name: newEntry.name,
      calories: newEntry.calories,
      carbs: newEntry.carbs,
      serving_size: newEntry.serving_size,
      consumed: newEntry.consumed ?? true,
      image_url: newEntry.image_url,
      created_at: new Date().toISOString(),
    };

    // Optimistically add to UI
    setTodayEntries(prev => [optimisticEntry, ...prev]);

    try {
      if (navigator.onLine) {
        // Try online operation
        const { data, error } = await supabase
          .from('food_entries')
          .insert({
            user_id: user.id,
            name: newEntry.name,
            calories: newEntry.calories,
            carbs: newEntry.carbs,
            serving_size: newEntry.serving_size,
            consumed: newEntry.consumed ?? true,
            image_url: newEntry.image_url,
          })
          .select()
          .single();

        if (error) throw error;

        // Replace optimistic entry with real data
        setTodayEntries(prev => prev.map(entry => 
          entry.id === localId ? data : entry
        ));

        return data;
      } else {
        throw new Error('Offline mode');
      }
    } catch (error) {
      console.log('Going offline for food entry creation');
      
      // Queue for later sync
      await enqueueOperation({
        entity: 'food_entry',
        action: 'create',
        user_id: user.id,
        payload: {
          local_id: localId,
          name: newEntry.name,
          calories: newEntry.calories,
          carbs: newEntry.carbs,
          serving_size: newEntry.serving_size,
          consumed: newEntry.consumed ?? true,
          image_url: newEntry.image_url,
        },
      });

      toast({
        title: "Food Added (Offline)",
        description: "Entry will sync when back online.",
      });

      return optimisticEntry;
    }
  }, [user, toast]);

  const updateFoodEntry = useCallback(async ({ id, updates }: { id: string; updates: Partial<NewFoodEntry> }) => {
    if (!user) throw new Error('User not authenticated');

    // Optimistically update UI
    setTodayEntries(prev => prev.map(entry => 
      entry.id === id ? { ...entry, ...updates } : entry
    ));

    try {
      if (navigator.onLine && !id.startsWith('local-')) {
        // Try online operation
        const { data, error } = await supabase
          .from('food_entries')
          .update(updates)
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;

        // Update with server response
        setTodayEntries(prev => prev.map(entry => 
          entry.id === id ? data : entry
        ));

        return data;
      } else {
        throw new Error('Offline mode or local entry');
      }
    } catch (error) {
      console.log('Going offline for food entry update');
      
      // Queue for later sync
      await enqueueOperation({
        entity: 'food_entry',
        action: 'update',
        user_id: user.id,
        payload: {
          entry_id: id,
          updates,
        },
      });

      toast({
        title: "Food Updated (Offline)",
        description: "Changes will sync when back online.",
      });
    }
  }, [user, toast]);

  const deleteFoodEntry = useCallback(async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    // Optimistically remove from UI
    const previousEntries = todayEntries;
    setTodayEntries(prev => prev.filter(entry => entry.id !== id));

    try {
      if (navigator.onLine && !id.startsWith('local-')) {
        // Try online operation
        const { error } = await supabase
          .from('food_entries')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        throw new Error('Offline mode or local entry');
      }
    } catch (error) {
      console.log('Going offline for food entry deletion');
      
      // Queue for later sync (unless it's a local entry)
      if (!id.startsWith('local-')) {
        await enqueueOperation({
          entity: 'food_entry',
          action: 'delete',
          user_id: user.id,
          payload: {
            entry_id: id,
          },
        });
      }

      toast({
        title: "Food Deleted (Offline)",
        description: "Deletion will sync when back online.",
      });
    }
  }, [user, toast, todayEntries]);

  const toggleConsumption = useCallback(async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    const currentEntry = todayEntries.find(entry => entry.id === id);
    if (!currentEntry) throw new Error('Entry not found');

    const newConsumed = !currentEntry.consumed;

    // Optimistically update UI
    setTodayEntries(prev => prev.map(entry => 
      entry.id === id ? { ...entry, consumed: newConsumed } : entry
    ));

    try {
      if (navigator.onLine && !id.startsWith('local-')) {
        // Try online operation
        const { data, error } = await supabase
          .from('food_entries')
          .update({ consumed: newConsumed })
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;

        const message = data.consumed ? "Food marked as eaten" : "Food returned to active list";
        toast({
          title: message,
          description: "Food status updated successfully.",
        });

        return data;
      } else {
        throw new Error('Offline mode or local entry');
      }
    } catch (error) {
      console.log('Going offline for consumption toggle');
      
      // Queue for later sync
      await enqueueOperation({
        entity: 'food_entry',
        action: 'toggle_consumed',
        user_id: user.id,
        payload: {
          entry_id: id,
          consumed: newConsumed,
        },
      });

      const message = newConsumed ? "Food marked as eaten (Offline)" : "Food returned to active list (Offline)";
      toast({
        title: message,
        description: "Status will sync when back online.",
      });
    }
  }, [user, toast, todayEntries]);

  const refreshFoodEntries = useCallback(async () => {
    await loadFoodEntries();
  }, [loadFoodEntries]);

  return {
    // Data
    todayEntries,
    todayTotals,
    
    // Loading states
    loading,
    
    // Actions
    addFoodEntry,
    updateFoodEntry,
    deleteFoodEntry,
    toggleConsumption,
    refreshFoodEntries,
    
    // Mutation states (simplified for offline version)
    isAddingEntry: false,
    isUpdatingEntry: false,
    isDeletingEntry: false,
    isTogglingConsumption: false,
  };
};
