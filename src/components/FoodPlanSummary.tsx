import React from 'react';
import { Utensils } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useProfile } from '@/hooks/useProfile';

interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  carbs: number;
  consumed: boolean;
}

interface FoodPlanSummaryProps {
  entries: FoodEntry[];
}

export const FoodPlanSummary: React.FC<FoodPlanSummaryProps> = ({ entries }) => {
  const { profile } = useProfile();

  // Calculate planned and consumed totals
  const plannedCalories = entries.filter(entry => !entry.consumed).reduce((sum, entry) => sum + entry.calories, 0);
  const consumedCalories = entries.filter(entry => entry.consumed).reduce((sum, entry) => sum + entry.calories, 0);
  const plannedCarbs = entries.filter(entry => !entry.consumed).reduce((sum, entry) => sum + entry.carbs, 0);
  const consumedCarbs = entries.filter(entry => entry.consumed).reduce((sum, entry) => sum + entry.carbs, 0);

  const dailyCalorieGoal = profile?.daily_calorie_goal || 2000;
  const dailyCarbGoal = profile?.daily_carb_goal || 150;

  const getProgressColor = (current: number, goal: number) => {
    const percentage = (current / goal) * 100;
    if (percentage > 100) return 'text-red-600 dark:text-red-400';
    if (percentage > 80) return 'text-amber-600 dark:text-amber-400';
    return 'text-green-600 dark:text-green-400';
  };

  return (
    <div className="bg-muted/20 rounded-lg p-2 mb-4">
      <div className="grid grid-cols-2 gap-2">
        {/* Calories Card */}
        <Card className="p-3">
          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Calories
            </div>
            
            {/* Planned Calories */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Planned:</span>
              <span className="text-xs font-semibold">
                {Math.round(plannedCalories)} / {dailyCalorieGoal}
              </span>
            </div>
            
            {/* Consumed Calories */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Eaten:</span>
              <span className={`text-xs font-bold ${getProgressColor(consumedCalories, dailyCalorieGoal)}`}>
                {Math.round(consumedCalories)} / {dailyCalorieGoal}
              </span>
            </div>
          </div>
        </Card>

        {/* Carbs Card */}
        <Card className="p-3">
          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Carbs (g)
            </div>
            
            {/* Planned Carbs */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Planned:</span>
              <span className="text-xs font-semibold">
                {Math.round(plannedCarbs)} / {dailyCarbGoal}
              </span>
            </div>
            
            {/* Consumed Carbs */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Eaten:</span>
              <span className={`text-xs font-bold ${getProgressColor(consumedCarbs, dailyCarbGoal)}`}>
                {Math.round(consumedCarbs)} / {dailyCarbGoal}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};