
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { AdminGoalIdea } from './useAdminGoalIdeas';

interface Motivator {
  id: string;
  title: string;
  content?: string;
  imageUrl?: string;
  category?: string;
}

export const useAdminGoalManagement = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const addToDefaultGoals = async (motivator: Motivator) => {
    setLoading(true);
    try {
      // First, get the current admin goal ideas
      const { data: currentData, error: fetchError } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'admin_goal_ideas')
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      const currentGoals: AdminGoalIdea[] = currentData?.setting_value 
        ? JSON.parse(currentData.setting_value) 
        : [];

      // Check if motivator already exists in default goals
      const existsAlready = currentGoals.some(goal => 
        goal.title === motivator.title || goal.id === motivator.id
      );

      if (existsAlready) {
        toast({
          title: "Already exists",
          description: "This motivator is already in the default goals.",
          variant: "destructive",
        });
        return false;
      }

      // Create new goal idea from motivator
      const newGoalIdea: AdminGoalIdea = {
        id: motivator.id,
        title: motivator.title,
        description: motivator.content || '',
        category: motivator.category || 'personal',
        imageUrl: motivator.imageUrl
      };

      const updatedGoals = [...currentGoals, newGoalIdea];

      // Update the database using upsert with conflict resolution
      const { error: updateError } = await supabase
        .from('shared_settings')
        .upsert({
          setting_key: 'admin_goal_ideas',
          setting_value: JSON.stringify(updatedGoals)
        }, {
          onConflict: 'setting_key'
        });

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "Added to default goals",
        description: `"${motivator.title}" has been added to the default goal ideas.`,
      });

      return true;
    } catch (error) {
      console.error('Error adding to default goals:', error);
      toast({
        title: "Error",
        description: "Failed to add motivator to default goals.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeFromDefaultGoals = async (goalId: string) => {
    setLoading(true);
    try {
      // Get current admin goal ideas
      const { data: currentData, error: fetchError } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'admin_goal_ideas')
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      const currentGoals: AdminGoalIdea[] = currentData?.setting_value 
        ? JSON.parse(currentData.setting_value) 
        : [];

      // Remove the goal
      const updatedGoals = currentGoals.filter(goal => goal.id !== goalId);

      // Update the database using upsert with conflict resolution
      const { error: updateError } = await supabase
        .from('shared_settings')
        .upsert({
          setting_key: 'admin_goal_ideas',
          setting_value: JSON.stringify(updatedGoals)
        }, {
          onConflict: 'setting_key'
        });

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "Removed from default goals",
        description: "The goal idea has been removed from the default list.",
      });

      return true;
    } catch (error) {
      console.error('Error removing from default goals:', error);
      toast({
        title: "Error",
        description: "Failed to remove goal from default list.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateDefaultGoal = async (goalId: string, updates: Partial<Motivator>): Promise<boolean> => {
    setLoading(true);
    try {
      console.log('🔄 Starting update for goal ID:', goalId, 'with updates:', updates);
      
      // Get current goal ideas
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'admin_goal_ideas')
        .maybeSingle();

      if (error) throw error;

      let goalIdeas = [];
      if (data?.setting_value) {
        goalIdeas = JSON.parse(data.setting_value);
      }

      console.log('📋 Current goal ideas:', goalIdeas);

      // Find and update the goal
      const goalIndex = goalIdeas.findIndex((goal: any) => goal.id === goalId);
      if (goalIndex === -1) {
        console.error('❌ Goal not found with ID:', goalId);
        toast({
          title: "Error",
          description: "Goal idea not found",
          variant: "destructive"
        });
        return false;
      }

      // Update the goal with new values
      goalIdeas[goalIndex] = {
        ...goalIdeas[goalIndex],
        title: updates.title || goalIdeas[goalIndex].title,
        description: updates.content || goalIdeas[goalIndex].description,
        imageUrl: updates.imageUrl !== undefined ? updates.imageUrl : goalIdeas[goalIndex].imageUrl
      };

      console.log('✏️ Updated goal:', goalIdeas[goalIndex]);

      // Save back to database using upsert with conflict resolution
      const { error: updateError } = await supabase
        .from('shared_settings')
        .upsert({
          setting_key: 'admin_goal_ideas',
          setting_value: JSON.stringify(goalIdeas)
        }, {
          onConflict: 'setting_key'
        });

      if (updateError) {
        console.error('❌ Database update error:', updateError);
        throw updateError;
      }

      console.log('✅ Successfully updated admin goal ideas in database');
      toast({
        title: "✅ Goal Updated!",
        description: "Admin goal idea has been updated successfully",
      });

      return true;
    } catch (error) {
      console.error('❌ Error updating default goal:', error);
      toast({
        title: "Error",
        description: "Failed to update goal idea",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const checkIfInDefaultGoals = async (motivatorId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'admin_goal_ideas')
        .maybeSingle();

      if (error || !data?.setting_value) {
        return false;
      }

      const currentGoals: AdminGoalIdea[] = JSON.parse(data.setting_value);
      return currentGoals.some(goal => goal.id === motivatorId);
    } catch (error) {
      console.error('Error checking if in default goals:', error);
      return false;
    }
  };

  return {
    addToDefaultGoals,
    removeFromDefaultGoals,
    updateDefaultGoal,
    checkIfInDefaultGoals,
    loading
  };
};
