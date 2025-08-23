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
      <Card className="p-3">
        <div className="space-y-3">
          {/* Header Row */}
          <div className="grid grid-cols-3 gap-2 items-center">
            <div></div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-center">
              Calories
            </div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-center">
              Carbs (g)
            </div>
          </div>
          
          {/* Planned Row */}
          <div className="grid grid-cols-3 gap-2 items-center">
            <span className="text-xs text-muted-foreground">Planned:</span>
            <span className="text-xs font-semibold text-center">
              {Math.round(plannedCalories)}/{dailyCalorieGoal}
            </span>
            <span className="text-xs font-semibold text-center">
              {Math.round(plannedCarbs)}/{dailyCarbGoal}
            </span>
          </div>
          
          {/* Eaten Row */}
          <div className="grid grid-cols-3 gap-2 items-center">
            <span className="text-xs text-muted-foreground">Eaten:</span>
            <span className={`text-xs font-bold text-center ${getProgressColor(consumedCalories, dailyCalorieGoal)}`}>
              {Math.round(consumedCalories)}/{dailyCalorieGoal}
            </span>
            <span className={`text-xs font-bold text-center ${getProgressColor(consumedCarbs, dailyCarbGoal)}`}>
              {Math.round(consumedCarbs)}/{dailyCarbGoal}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};