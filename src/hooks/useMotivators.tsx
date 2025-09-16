import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from './use-toast';
import { useMotivatorCache } from './useMotivatorCache';
import { generateUniqueSlug } from '@/utils/slugUtils';
import { validateAndFixUrl } from '@/utils/urlUtils';
import { useStandardizedLoading } from './useStandardizedLoading';

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
  show_in_animations?: boolean;
  linkUrl?: string;
  author?: string;
}

export interface CreateMotivatorData {
  title: string;
  content: string;
  category: string;
  imageUrl?: string;
  show_in_animations?: boolean;
  linkUrl?: string;
  author?: string;
}

export const useMotivators = () => {
  const [motivators, setMotivators] = useState<Motivator[]>([]);
  const { isLoading, execute } = useStandardizedLoading();
  const { user } = useAuth();
  const { toast } = useToast();
  const { cachedMotivators, shouldFetchMotivators, cacheMotivators, invalidateCache } = useMotivatorCache();

  const loadMotivators = async (forceRefresh = false) => {
    if (!user) return;

    // Use cached data if available and not forcing refresh
    if (!forceRefresh && cachedMotivators && !shouldFetchMotivators()) {
      console.log('Using cached motivators, skipping API call');
      setMotivators(cachedMotivators);
      return;
    }

    await execute(async () => {
      const { data, error } = await supabase
        .from('motivators')
        .select('*, image_url, link_url')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      console.log('📊 RAW DATABASE RESPONSE:', {
        timestamp: Date.now(),
        dataLength: (data || []).length,
        error: error ? 'present' : 'none'
      });
      
      // Transform data to include imageUrl and linkUrl properties with proper fallback
      const transformedData = (data || []).map((item: any) => ({
        ...item,
        imageUrl: item.image_url || item.imageUrl || null, // Handle both field names and provide fallback
        linkUrl: validateAndFixUrl(item.link_url || item.linkUrl), // Validate and fix URLs 
        show_in_animations: item.show_in_animations ?? true // Default to true if not set
      }));
      
      console.log('🎯 TRANSFORMED MOTIVATORS:', transformedData.map(m => ({ 
        id: m.id, 
        title: m.title, 
        category: m.category 
      })));
      
      setMotivators(transformedData);
      // Cache the fresh data
      cacheMotivators(transformedData);
      
      console.log('Loaded fresh motivators from API:', transformedData.length);
      
      return transformedData;
    }, {
      onSuccess: (data) => {
        setMotivators(data);
        cacheMotivators(data);
      },
      onError: (error) => {
        console.error('Error loading motivators:', error);
        
        // If we have cached data, use it as fallback
        if (cachedMotivators && cachedMotivators.length > 0) {
          console.log('Using cached motivators as fallback');
          setMotivators(cachedMotivators);
        } else {
          toast({
            title: "Error loading motivators",
            description: "Please check your connection and try again.",
            variant: "destructive",
          });
        }
      }
    });
  };

  const createMotivator = async (motivatorData: CreateMotivatorData): Promise<string | null> => {
    if (!user) return null;

    console.log('🔍 useMotivators createMotivator: Input data:', motivatorData);

    try {
      const dbData = {
        user_id: user.id,
        title: motivatorData.title,
        content: motivatorData.content,
        category: motivatorData.category,
        image_url: motivatorData.imageUrl,
        link_url: motivatorData.linkUrl,
        show_in_animations: motivatorData.show_in_animations ?? true,
        slug: generateUniqueSlug(motivatorData.title),
        is_active: true,
        author: motivatorData.author
      };

      console.log('🔍 useMotivators createMotivator: Database insert data:', dbData);

      const { data, error } = await supabase
        .from('motivators')
        .insert(dbData)
        .select()
        .single();

      if (error) throw error;

      console.log('🔍 useMotivators createMotivator: Database response:', data);

      if (data) {
        const transformedData = { ...data, imageUrl: data.image_url, linkUrl: data.link_url };
        console.log('🔍 useMotivators createMotivator: Transformed data:', transformedData);
        
        setMotivators(prev => [transformedData as Motivator, ...prev]);
        
        // No need to refresh immediately - state is already updated optimistically
        
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
    console.log('🔄 Updating motivator in useMotivators:', { id, updates });
    if (!user) return false;

    try {
      // Map imageUrl to image_url and linkUrl to link_url for database and handle show_in_animations
      const dbUpdates: any = { ...updates };
      if (updates.imageUrl !== undefined) {
        dbUpdates.image_url = updates.imageUrl;
        delete dbUpdates.imageUrl;
      }
      if (updates.linkUrl !== undefined) {
        dbUpdates.link_url = updates.linkUrl;
        delete dbUpdates.linkUrl;
      }
      if (updates.show_in_animations !== undefined) {
        dbUpdates.show_in_animations = updates.show_in_animations;
      }

      const { error } = await supabase
        .from('motivators')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state immediately with optimistic update
      setMotivators(prev => 
        prev.map(m => m.id === id ? { ...m, ...updates, show_in_animations: updates.show_in_animations ?? m.show_in_animations } : m)
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

  const createMultipleMotivators = async (motivators: CreateMotivatorData[]): Promise<string[]> => {
    if (!user || !motivators.length) return [];

    try {
      const motivatorData = motivators.map(motivator => ({
        user_id: user.id,
        title: motivator.title,
        content: motivator.content,
        category: motivator.category || 'general',
        image_url: motivator.imageUrl,
        link_url: motivator.linkUrl,
        show_in_animations: motivator.show_in_animations ?? true,
        slug: generateUniqueSlug(motivator.title),
        is_active: true
      }));

      const { data, error } = await supabase
        .from('motivators')
        .insert(motivatorData)
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        const transformedData = data.map(item => ({ ...item, imageUrl: item.image_url, linkUrl: item.link_url }));
        setMotivators(prev => [...transformedData as Motivator[], ...prev]);
        toast({
          title: "✨ Motivators Created!",
          description: `Successfully created ${data.length} motivator${data.length > 1 ? 's' : ''}`,
        });
        return data.map(item => item.id);
      }
      return [];
    } catch (error) {
      console.error('Error creating multiple motivators:', error);
      toast({
        title: "Error creating motivators",
        description: "Please try again.",
        variant: "destructive",
      });
      return [];
    }
  };

  const saveQuoteAsGoal = async (quote: { text: string; author?: string }): Promise<string | null> => {
    if (!user) return null;

    try {
      // Store author as title, quote text as content (without extra quotes)
      const title = quote.author || 'Unknown Author';
      const content = quote.text;

      const { data, error } = await supabase
        .from('motivators')
        .insert({
          user_id: user.id,
          title,
          content,
          category: 'saved_quote',
          slug: generateUniqueSlug(title),
          show_in_animations: true, // Default to showing saved quotes in animations
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const transformedData = { ...data, imageUrl: data.image_url, linkUrl: data.link_url };
        setMotivators(prev => [transformedData as Motivator, ...prev]);
        toast({
          title: "📝 Quote Saved!",
          description: "Quote has been saved to your goals.",
        });
        return data.id;
      }
      return null;
    } catch (error) {
      console.error('Error saving quote:', error);
      toast({
        title: "Error saving quote",
        description: "Please try again.",
        variant: "destructive",
      });
      return null;
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

  // Load cached motivators immediately on mount, then check for fresh data
  useEffect(() => {
    if (user) {
      console.log('🔄 useMotivators useEffect triggered, user:', user.id);
      console.log('📊 Current cached motivators:', cachedMotivators?.length || 0);
      
      // First load cached data if available (instant)
      if (cachedMotivators && cachedMotivators.length > 0) {
        console.log('📦 Loading cached motivators immediately');
        setMotivators(cachedMotivators);
      } else {
        console.log('📦 No cached motivators, starting fresh load');
      }
      
      // Always check for fresh data (background)
      loadMotivators(false);
    } else {
      console.log('❌ No user, clearing motivators');
      setMotivators([]);
    }
  }, [user?.id]); // Only depend on user.id to avoid unnecessary re-runs

  return {
    motivators,
    loading: isLoading,
    createMotivator: async (motivatorData: CreateMotivatorData) => {
      const result = await createMotivator(motivatorData);
      if (result) {
        invalidateCache(); // Clear cache when new motivator is created
        // Don't call loadMotivators here - createMotivator already refreshes
      }
      return result;
    },
    createMultipleMotivators: async (motivators: CreateMotivatorData[]) => {
      const result = await createMultipleMotivators(motivators);
      if (result.length > 0) {
        invalidateCache(); // Clear cache when new motivators are created
        // Don't call loadMotivators here - createMultipleMotivators already refreshes
      }
      return result;
    },
    updateMotivator: async (id: string, updates: Partial<CreateMotivatorData>) => {
      const result = await updateMotivator(id, updates);
      if (result) {
        invalidateCache(); // Clear cache when motivator is updated
        // Don't call loadMotivators here - updateMotivator already optimistically updates
      }
      return result;
    },
    deleteMotivator: async (id: string) => {
      const result = await deleteMotivator(id);
      if (result) {
        invalidateCache(); // Clear cache when motivator is deleted
        // Don't need to refresh - deleteMotivator already updates local state
      }
      return result;
    },
    saveQuoteAsGoal: async (quote: { text: string; author?: string }) => {
      const result = await saveQuoteAsGoal(quote);
      if (result) {
        invalidateCache(); // Clear cache when new quote is saved
        // Don't call loadMotivators here - saveQuoteAsGoal already refreshes
      }
      return result;
    },
    refreshMotivators: () => {
      console.log('🔄 Manual refresh triggered');
      return loadMotivators(true); // Always force refresh when manually called
    }
  };
};