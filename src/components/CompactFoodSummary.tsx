import React from 'react';
import { ClickableTooltip } from '@/components/ClickableTooltip';
import { useProfile } from '@/hooks/useProfile';

interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  carbs: number;
  consumed: boolean;
}

interface CompactFoodSummaryProps {
  entries: FoodEntry[];
}

export const CompactFoodSummary: React.FC<CompactFoodSummaryProps> = ({ entries }) => {
  const { profile } = useProfile();

  // Calculate totals
  const totalCalories = entries.reduce((sum, entry) => sum + entry.calories, 0);
  const consumedCalories = entries.filter(entry => entry.consumed).reduce((sum, entry) => sum + entry.calories, 0);
  const totalCarbs = entries.reduce((sum, entry) => sum + entry.carbs, 0);
  const consumedCarbs = entries.filter(entry => entry.consumed).reduce((sum, entry) => sum + entry.carbs, 0);

  const dailyCalorieGoal = profile?.daily_calorie_goal || 2000;
  const dailyCarbGoal = profile?.daily_carb_goal || 150;

  const getProgressColor = (current: number, goal: number) => {
    const percentage = (current / goal) * 100;
    if (percentage > 100) return 'text-destructive';
    if (percentage > 80) return 'text-warning';
    return 'text-foreground';
  };

  return (
    <div className="flex items-center gap-4 text-sm">
      {/* Calories Section */}
      <div className="flex items-center gap-2">
        <ClickableTooltip content={`Calories planned: ${Math.round(totalCalories)} | Daily goal: ${Math.round(dailyCalorieGoal)}`}>
          <span className={`text-muted-foreground/80 ${getProgressColor(totalCalories, dailyCalorieGoal)}`}>
            {Math.round(totalCalories)}
          </span>
        </ClickableTooltip>
        <span className="text-muted-foreground/60">|</span>
        <ClickableTooltip content={`Calories eaten: ${Math.round(consumedCalories)} | Daily goal: ${Math.round(dailyCalorieGoal)}`}>
          <span className={`font-medium ${getProgressColor(consumedCalories, dailyCalorieGoal)}`}>
            {Math.round(consumedCalories)}
          </span>
        </ClickableTooltip>
        <span className="text-xs text-muted-foreground">cal</span>
      </div>

      {/* Carbs Section */}
      <div className="flex items-center gap-2">
        <ClickableTooltip content={`Carbs planned: ${Math.round(totalCarbs)}g | Daily goal: ${Math.round(dailyCarbGoal)}g`}>
          <span className={`text-muted-foreground/80 ${getProgressColor(totalCarbs, dailyCarbGoal)}`}>
            {Math.round(totalCarbs)}
          </span>
        </ClickableTooltip>
        <span className="text-muted-foreground/60">|</span>
        <ClickableTooltip content={`Carbs eaten: ${Math.round(consumedCarbs)}g | Daily goal: ${Math.round(dailyCarbGoal)}g`}>
          <span className={`font-medium ${getProgressColor(consumedCarbs, dailyCarbGoal)}`}>
            {Math.round(consumedCarbs)}
          </span>
        </ClickableTooltip>
        <span className="text-xs text-muted-foreground">carbs</span>
      </div>
    </div>
  );
};