import { useState, useEffect } from 'react';
import { TrendingUp, Target, Activity, Apple } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useFoodEntries } from '@/hooks/useFoodEntries';
import { useWalkingSession } from '@/hooks/useWalkingSession';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UserProfile {
  daily_calorie_goal?: number;
  daily_carb_goal?: number;
  weight?: number;
  height?: number;
  age?: number;
}

export const TodaysDashboard = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { user } = useAuth();
  const { todayTotals } = useFoodEntries();
  const { currentSession } = useWalkingSession();
  
  const todayWalkingMinutes = 0; // Simplified for now
  const estimatedCaloriesBurned = Math.round(todayWalkingMinutes * 3.5); // Rough estimate: 3.5 cal/min

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

    fetchProfile();
  }, [user]);

  const calorieGoal = profile?.daily_calorie_goal || 2000;
  const carbGoal = profile?.daily_carb_goal || 150;
  const netCalories = todayTotals.calories - estimatedCaloriesBurned;

  // Calculate BMR for more accurate estimates
  const bmr = profile?.weight && profile?.height && profile?.age 
    ? Math.round(10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5)
    : null;

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
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
            <div className="text-2xl font-bold">{todayWalkingMinutes}min</div>
            <p className="text-xs text-muted-foreground">
              ~{estimatedCaloriesBurned} calories burned
            </p>
            {currentSession && (
              <p className="text-xs text-green-600">Currently walking! 🚶‍♂️</p>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
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
          
          {todayWalkingMinutes === 0 ? (
            <p>• Try a 10-minute walk to boost your mood and burn calories</p>
          ) : todayWalkingMinutes >= 30 ? (
            <p>• Excellent! You've reached the recommended daily activity</p>
          ) : (
            <p>• Great start! Try to reach 30 minutes of walking today</p>
          )}
          
          {!profile?.daily_calorie_goal && (
            <p>• Set your daily goals in Settings for better tracking</p>
          )}
        </div>
      </Card>
    </div>
  );
};