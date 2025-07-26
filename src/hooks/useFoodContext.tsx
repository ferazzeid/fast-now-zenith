import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface FoodContext {
  todayCalories: number;
  todayCarbs: number;
  calorieGoal: number;
  carbGoal: number;
  caloriesRemaining: number;
  carbsRemaining: number;
  todayEntryCount: number;
  lastMealTime: Date | null;
  recentEntries: Array<{ name: string; calories: number; carbs: number; time: string }>;
  weeklyAverageCalories: number;
  weeklyAverageCarbs: number;
  currentTime: string;
  currentDate: string;
}

export const useFoodContext = () => {
  const [context, setContext] = useState<FoodContext | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchFoodContext = async (): Promise<FoodContext | null> => {
    if (!user) return null;

    setLoading(true);
    try {
      // Get user profile for goals
      const { data: profile } = await supabase
        .from('profiles')
        .select('daily_calorie_goal, daily_carb_goal')
        .eq('user_id', user.id)
        .single();

      const calorieGoal = profile?.daily_calorie_goal || 2000;
      const carbGoal = profile?.daily_carb_goal || 150;

      // Get today's food entries
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

      const { data: todayEntries } = await supabase
        .from('food_entries')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startOfDay.toISOString())
        .lt('created_at', endOfDay.toISOString())
        .order('created_at', { ascending: false });

      // Calculate today's totals
      const todayCalories = todayEntries?.reduce((sum, entry) => sum + (entry.calories || 0), 0) || 0;
      const todayCarbs = todayEntries?.reduce((sum, entry) => sum + (entry.carbs || 0), 0) || 0;

      // Get last 7 days for weekly averages
      const weekAgo = new Date(startOfDay.getTime() - 7 * 24 * 60 * 60 * 1000);
      const { data: weekEntries } = await supabase
        .from('food_entries')
        .select('calories, carbs, created_at')
        .eq('user_id', user.id)
        .gte('created_at', weekAgo.toISOString())
        .lt('created_at', startOfDay.toISOString());

      // Calculate daily totals for the week
      const dailyTotals = new Map<string, { calories: number; carbs: number }>();
      weekEntries?.forEach(entry => {
        const date = new Date(entry.created_at).toDateString();
        if (!dailyTotals.has(date)) {
          dailyTotals.set(date, { calories: 0, carbs: 0 });
        }
        const daily = dailyTotals.get(date)!;
        daily.calories += entry.calories || 0;
        daily.carbs += entry.carbs || 0;
      });

      const weeklyAverageCalories = dailyTotals.size > 0 
        ? Array.from(dailyTotals.values()).reduce((sum, day) => sum + day.calories, 0) / dailyTotals.size
        : 0;
      const weeklyAverageCarbs = dailyTotals.size > 0 
        ? Array.from(dailyTotals.values()).reduce((sum, day) => sum + day.carbs, 0) / dailyTotals.size
        : 0;

      // Prepare recent entries for context
      const recentEntries = (todayEntries?.slice(0, 3) || []).map(entry => ({
        name: entry.name,
        calories: entry.calories || 0,
        carbs: entry.carbs || 0,
        time: new Date(entry.created_at).toLocaleTimeString()
      }));

      const lastMealTime = todayEntries?.[0] ? new Date(todayEntries[0].created_at) : null;

      const foodContext: FoodContext = {
        todayCalories,
        todayCarbs,
        calorieGoal,
        carbGoal,
        caloriesRemaining: Math.max(0, calorieGoal - todayCalories),
        carbsRemaining: Math.max(0, carbGoal - todayCarbs),
        todayEntryCount: todayEntries?.length || 0,
        lastMealTime,
        recentEntries,
        weeklyAverageCalories,
        weeklyAverageCarbs,
        currentTime: today.toLocaleTimeString(),
        currentDate: today.toLocaleDateString()
      };

      setContext(foodContext);
      return foodContext;
    } catch (error) {
      console.error('Error fetching food context:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const buildContextString = (ctx: FoodContext): string => {
    const parts = [
      `Current time: ${ctx.currentTime} on ${ctx.currentDate}`
    ];

    parts.push(
      `Today's nutrition: ${ctx.todayCalories} calories (${ctx.caloriesRemaining} remaining of ${ctx.calorieGoal} goal), ${ctx.todayCarbs}g carbs (${ctx.carbsRemaining}g remaining of ${ctx.carbGoal}g goal)`,
      `Today's meal count: ${ctx.todayEntryCount} entries logged`
    );

    if (ctx.lastMealTime) {
      parts.push(`Last meal logged: ${ctx.lastMealTime.toLocaleTimeString()}`);
    }

    if (ctx.recentEntries.length > 0) {
      const recentMeals = ctx.recentEntries.map(entry => 
        `${entry.name} (${entry.calories} cal, ${entry.carbs}g carbs at ${entry.time})`
      ).join(', ');
      parts.push(`Recent meals: ${recentMeals}`);
    }

    if (ctx.weeklyAverageCalories > 0) {
      parts.push(
        `Weekly averages: ${ctx.weeklyAverageCalories.toFixed(0)} calories/day, ${ctx.weeklyAverageCarbs.toFixed(0)}g carbs/day`
      );
    }

    return parts.join('. ') + '.';
  };

  useEffect(() => {
    if (user) {
      fetchFoodContext();
    } else {
      setContext(null);
    }
  }, [user]);

  return {
    context,
    loading,
    buildContextString,
    refreshContext: fetchFoodContext
  };
};