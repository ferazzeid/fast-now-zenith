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

  // Calculate total and consumed totals
  const totalCalories = entries.reduce((sum, entry) => sum + entry.calories, 0);
  const consumedCalories = entries.filter(entry => entry.consumed).reduce((sum, entry) => sum + entry.calories, 0);
  const totalCarbs = entries.reduce((sum, entry) => sum + entry.carbs, 0);
  const consumedCarbs = entries.filter(entry => entry.consumed).reduce((sum, entry) => sum + entry.carbs, 0);

  const dailyCalorieGoal = profile?.daily_calorie_goal || 2000;
  const dailyCarbGoal = profile?.daily_carb_goal || 150;

  const getProgressColor = (current: number, goal: number) => {
    const percentage = (current / goal) * 100;
    if (percentage > 100) return 'text-red-600 dark:text-red-400';
    if (percentage > 80) return 'text-amber-600 dark:text-amber-400';
    return 'text-accent-foreground';
  };

  return (
    <Card className="rounded-lg p-2 mb-1 bg-card">
      <div className="p-3 space-y-3">
          {/* Header Row */}
          <div className="grid grid-cols-3 gap-2 items-center">
            <div></div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-center">
              Calories
            </div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-center">
              Carbs
            </div>
          </div>
          
          {/* Planned Row */}
          <div className="grid grid-cols-3 gap-2 items-center">
            <span className="text-xs text-muted-foreground">Planned:</span>
            <span className={`text-xs font-semibold text-center ${getProgressColor(totalCalories, dailyCalorieGoal)}`}>
              {Math.round(totalCalories)}
            </span>
            <span className={`text-xs font-semibold text-center ${getProgressColor(totalCarbs, dailyCarbGoal)}`}>
              {Math.round(totalCarbs)}g
            </span>
          </div>
          
          {/* Eaten Row */}
          <div className="grid grid-cols-3 gap-2 items-center">
            <span className="text-xs text-muted-foreground">Eaten:</span>
            <span className={`text-xs font-bold text-center ${getProgressColor(consumedCalories, dailyCalorieGoal)}`}>
              {Math.round(consumedCalories)}/{dailyCalorieGoal}
            </span>
            <span className={`text-xs font-bold text-center ${getProgressColor(consumedCarbs, dailyCarbGoal)}`}>
              {Math.round(consumedCarbs)}g/{dailyCarbGoal}g
            </span>
          </div>
        </div>
    </Card>
  );
};