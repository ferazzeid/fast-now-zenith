import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

// Types for food editing
export interface FoodEditSearchResult {
  id: string;
  name: string;
  type: 'today' | 'library' | 'template';
  current_values: {
    serving_size?: number;
    calories?: number;
    carbs?: number;
    calories_per_100g?: number;
    carbs_per_100g?: number;
  };
}

export interface FoodEditPreview {
  id: string;
  name: string;
  type: 'today' | 'library' | 'template';
  before: any;
  after: any;
  confirmed: boolean;
}

export const useFoodEditingActions = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchResults, setSearchResults] = useState<FoodEditSearchResult[]>([]);
  const [editPreviews, setEditPreviews] = useState<FoodEditPreview[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Search for foods to edit
  const searchFoodsForEdit = async (searchTerm: string, context: 'today' | 'library' | 'templates') => {
    if (!user) throw new Error('User not authenticated');
    
    setIsSearching(true);
    const results: FoodEditSearchResult[] = [];
    
    try {
      if (context === 'today') {
        // Search today's food entries
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
          .from('food_entries')
          .select('id, name, serving_size, calories, carbs')
          .eq('user_id', user.id)
          .eq('source_date', today)
          .ilike('name', `%${searchTerm}%`);
        
        if (error) throw error;
        
        data?.forEach(entry => {
          results.push({
            id: entry.id,
            name: entry.name,
            type: 'today',
            current_values: {
              serving_size: entry.serving_size,
              calories: entry.calories,
              carbs: entry.carbs
            }
          });
        });
      } else if (context === 'library') {
        // Search user's food library
        const { data, error } = await supabase
          .from('user_foods')
          .select('id, name, calories_per_100g, carbs_per_100g')
          .eq('user_id', user.id)
          .ilike('name', `%${searchTerm}%`);
        
        if (error) throw error;
        
        data?.forEach(food => {
          results.push({
            id: food.id,
            name: food.name,
            type: 'library',
            current_values: {
              calories_per_100g: food.calories_per_100g,
              carbs_per_100g: food.carbs_per_100g
            }
          });
        });
      } else if (context === 'templates') {
        // Search user's daily food templates
        const { data, error } = await supabase
          .from('daily_food_templates')
          .select('id, name, serving_size, calories, carbs')
          .eq('user_id', user.id)
          .ilike('name', `%${searchTerm}%`);
        
        if (error) throw error;
        
        data?.forEach(template => {
          results.push({
            id: template.id,
            name: template.name,
            type: 'template',
            current_values: {
              serving_size: template.serving_size,
              calories: template.calories,
              carbs: template.carbs
            }
          });
        });
      }
      
      setSearchResults(results);
      return results;
    } catch (error) {
      console.error('Error searching foods:', error);
      toast({
        title: "Search Error",
        description: "Failed to search for foods. Please try again.",
        variant: "destructive"
      });
      return [];
    } finally {
      setIsSearching(false);
    }
  };

  // Edit food entry (today's log)
  const editFoodEntry = async (entryId: string, updates: any) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const { data, error } = await supabase
        .from('food_entries')
        .update(updates)
        .eq('id', entryId)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Invalidate food entries query to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['food-entries'] });
      
      toast({
        title: "Food Entry Updated",
        description: `Successfully updated ${data.name}`,
      });
      
      return data;
    } catch (error) {
      console.error('Error editing food entry:', error);
      toast({
        title: "Update Error",
        description: "Failed to update food entry. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Edit library food
  const editLibraryFood = async (foodId: string, updates: any) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const { data, error } = await supabase
        .from('user_foods')
        .update(updates)
        .eq('id', foodId)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Invalidate library foods query
      queryClient.invalidateQueries({ queryKey: ['user-foods'] });
      
      toast({
        title: "Library Food Updated",
        description: `Successfully updated ${data.name}`,
      });
      
      return data;
    } catch (error) {
      console.error('Error editing library food:', error);
      toast({
        title: "Update Error",
        description: "Failed to update library food. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Edit template food
  const editTemplateFood = async (templateId: string, updates: any) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const { data, error } = await supabase
        .from('daily_food_templates')
        .update(updates)
        .eq('id', templateId)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Invalidate templates query
      queryClient.invalidateQueries({ queryKey: ['daily-food-templates'] });
      
      toast({
        title: "Template Updated",
        description: `Successfully updated ${data.name}`,
      });
      
      return data;
    } catch (error) {
      console.error('Error editing template food:', error);
      toast({
        title: "Update Error",
        description: "Failed to update template. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Create edit preview
  const createEditPreview = (result: FoodEditSearchResult, proposedChanges: any): FoodEditPreview => {
    return {
      id: result.id,
      name: result.name,
      type: result.type,
      before: result.current_values,
      after: { ...result.current_values, ...proposedChanges },
      confirmed: false
    };
  };

  // Apply edit preview
  const applyEditPreview = async (preview: FoodEditPreview) => {
    const changes = Object.keys(preview.after).reduce((acc, key) => {
      if (preview.after[key] !== preview.before[key]) {
        acc[key] = preview.after[key];
      }
      return acc;
    }, {} as any);

    if (preview.type === 'today') {
      return await editFoodEntry(preview.id, changes);
    } else if (preview.type === 'library') {
      return await editLibraryFood(preview.id, changes);
    } else if (preview.type === 'template') {
      return await editTemplateFood(preview.id, changes);
    }
  };

  return {
    searchResults,
    editPreviews,
    isSearching,
    searchFoodsForEdit,
    editFoodEntry,
    editLibraryFood,
    editTemplateFood,
    createEditPreview,
    applyEditPreview,
    setEditPreviews
  };
};