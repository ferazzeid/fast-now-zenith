import { useState, useEffect } from 'react';
import { TrendingUp, Target, Activity, Apple } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useFoodEntriesQuery } from '@/hooks/optimized/useFoodEntriesQuery';
import { useOptimizedWalkingSession } from '@/hooks/optimized/useOptimizedWalkingSession';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

import { DailyStatsPanel } from '@/components/DailyStatsPanel';

interface UserProfile {
  daily_calorie_goal?: number;
  daily_carb_goal?: number;
  weight?: number;
  height?: number;
  age?: number;
}

export const TodaysDashboard = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [todayWalkingStats, setTodayWalkingStats] = useState({ minutes: 0, calories: 0 });
  const { user } = useAuth();
  const { todayTotals } = useFoodEntriesQuery();
  const { currentSession } = useOptimizedWalkingSession();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('daily_calorie_goal, daily_carb_goal, weight, height, age')
        .eq('user_id', user.id)
        .single();
      
      setProfile(data);
    };

    const fetchTodayWalkingStats = async () => {
      if (!user) return;
      
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      const { data } = await supabase
        .from('walking_sessions')
        .select('start_time, end_time, calories_burned')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('start_time', startOfDay.toISOString());
      
      const stats = (data || []).reduce(
        (acc, session) => {
          const duration = session.end_time && session.start_time
            ? Math.floor((new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / (1000 * 60))
            : 0;
          
          return {
            minutes: acc.minutes + duration,
            calories: acc.calories + (session.calories_burned || 0),
          };
        },
        { minutes: 0, calories: 0 }
      );
      
      setTodayWalkingStats(stats);
    };

    fetchProfile();
    fetchTodayWalkingStats();
  }, [user]);

  const calorieGoal = profile?.daily_calorie_goal || 2000;
  const carbGoal = profile?.daily_carb_goal || 150;
  const netCalories = todayTotals.calories - todayWalkingStats.calories;

  // Calculate BMR for more accurate estimates
  const bmr = profile?.weight && profile?.height && profile?.age 
    ? Math.round(10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5)
    : null;

  return (
    <div className="space-y-4">
      {/* Daily Deficit Panel */}
      <DailyStatsPanel />
      
      <div className="text-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
          Today's Overview
        </h2>
        <p className="text-muted-foreground">Your daily progress at a glance</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Calories */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Apple className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium">Calories</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-bold">{todayTotals.calories}</span>
              <span className="text-sm text-muted-foreground">/{calorieGoal}</span>
            </div>
            <Progress 
              value={Math.min(100, (todayTotals.calories / calorieGoal) * 100)} 
              className="h-2"
            />
            <p className="text-xs text-muted-foreground">
              {calorieGoal - todayTotals.calories > 0 
                ? `${calorieGoal - todayTotals.calories} left` 
                : `${todayTotals.calories - calorieGoal} over goal`
              }
            </p>
          </div>
        </Card>

        {/* Carbs */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium">Carbs</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-bold">{todayTotals.carbs}g</span>
              <span className="text-sm text-muted-foreground">/{carbGoal}g</span>
            </div>
            <Progress 
              value={Math.min(100, (todayTotals.carbs / carbGoal) * 100)} 
              className="h-2"
            />
            <p className="text-xs text-muted-foreground">
              {carbGoal - todayTotals.carbs > 0 
                ? `${Math.round(carbGoal - todayTotals.carbs)}g left` 
                : `${Math.round(todayTotals.carbs - carbGoal)}g over goal`
              }
            </p>
          </div>
        </Card>
      </div>

      {/* Walking & Net Calories */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium">Walking</span>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold">{todayWalkingStats.minutes}min</div>
            <p className="text-xs text-muted-foreground">
              ~{todayWalkingStats.calories} calories burned
            </p>
            {currentSession && (
              <p className="text-xs text-green-600">Currently walking! 🚶‍♂️</p>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
                              <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Net Calories</span>
          </div>
          <div className="space-y-1">
            <div className={`text-2xl font-bold ${netCalories > 0 ? 'text-red-500' : 'text-green-500'}`}>
              {netCalories > 0 ? '+' : ''}{netCalories}
            </div>
            <p className="text-xs text-muted-foreground">
              Consumed - Burned
            </p>
            {bmr && (
              <p className="text-xs text-muted-foreground">
                BMR: {bmr} cal/day
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Insights */}
      <Card className="p-4 bg-primary/5">
        <h3 className="font-medium mb-2">Quick Insights</h3>
        <div className="space-y-1 text-sm text-muted-foreground">
          {todayTotals.calories === 0 ? (
            <p>• Start by logging your first meal of the day</p>
          ) : todayTotals.calories < calorieGoal * 0.5 ? (
            <p>• You're doing great! Consider a healthy snack if you're hungry</p>
          ) : todayTotals.calories > calorieGoal ? (
            <p>• Over your calorie goal - a walk could help balance it out</p>
          ) : (
            <p>• Good calorie balance! Keep it up</p>
          )}
          
          {todayWalkingStats.minutes === 0 ? (
            <p>• Try a 10-minute walk to boost your mood and burn calories</p>
          ) : todayWalkingStats.minutes >= 30 ? (
            <p>• Excellent! You've reached the recommended daily activity</p>
          ) : (
            <p>• Great start! Try to reach 30 minutes of walking today</p>
          )}
          
          {!profile?.daily_calorie_goal && (
            <p>• Set your daily goals in Settings for better tracking</p>
          )}
        </div>
      </Card>

      {/* Walking Statistics Section */}
      
    </div>
  );
};