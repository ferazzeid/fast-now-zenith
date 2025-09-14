import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ClickableTooltip } from '@/components/ClickableTooltip';
import { useProfile } from '@/hooks/useProfile';
import { Utensils, Target, TrendingUp, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  carbs: number;
  consumed: boolean;
}

interface FoodStatsCardProps {
  entries: FoodEntry[];
}

export const FoodStatsCard: React.FC<FoodStatsCardProps> = ({ entries }) => {
  const { profile } = useProfile();

  // Calculate totals
  const totalCalories = entries.reduce((sum, entry) => sum + entry.calories, 0);
  const consumedCalories = entries.filter(entry => entry.consumed).reduce((sum, entry) => sum + entry.calories, 0);
  const totalCarbs = entries.reduce((sum, entry) => sum + entry.carbs, 0);
  const consumedCarbs = entries.filter(entry => entry.consumed).reduce((sum, entry) => sum + entry.carbs, 0);

  const dailyCalorieGoal = profile?.daily_calorie_goal || 2000;
  const dailyCarbGoal = profile?.daily_carb_goal || 150;

  const calorieProgress = Math.min((consumedCalories / dailyCalorieGoal) * 100, 100);
  const carbProgress = Math.min((consumedCarbs / dailyCarbGoal) * 100, 100);

  const getProgressColor = (current: number, goal: number) => {
    const percentage = (current / goal) * 100;
    if (percentage > 100) return 'text-destructive';
    if (percentage > 80) return 'text-orange-500';
    return 'text-foreground';
  };

  const getProgressBarColor = (current: number, goal: number) => {
    const percentage = (current / goal) * 100;
    if (percentage > 100) return 'bg-destructive';
    if (percentage > 80) return 'bg-orange-500';
    return 'bg-primary';
  };

  return (
    <Card className="p-4 text-center relative overflow-hidden min-h-[180px]">
      {/* Main Content */}
      <div className="flex flex-col justify-center items-center h-full space-y-4">
        {/* Top Row - Eaten (Large Numbers) */}
        <div className="grid grid-cols-2 gap-4 w-full mb-4">
          {/* Calories Eaten */}
          <div className="text-center">
            <ClickableTooltip content={`Calories eaten: ${Math.round(consumedCalories)} | Daily goal: ${Math.round(dailyCalorieGoal)}`}>
              <div 
                className="text-4xl font-mono font-bold text-warm-text mb-1 tracking-wide cursor-pointer"
                style={{ 
                  fontFeatureSettings: '"tnum" 1',
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}
              >
                {Math.round(consumedCalories)}
              </div>
            </ClickableTooltip>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Utensils className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Eaten</span>
              </div>
              <span className="text-xs text-foreground">calories</span>
            </div>
          </div>

          {/* Carbs Eaten */}
          <div className="text-center">
            <ClickableTooltip content={`Carbs eaten: ${Math.round(consumedCarbs)}g | Daily goal: ${Math.round(dailyCarbGoal)}g`}>
              <div 
                className="text-4xl font-mono font-bold text-warm-text mb-1 tracking-wide cursor-pointer"
                style={{ 
                  fontFeatureSettings: '"tnum" 1',
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}
              >
                {Math.round(consumedCarbs)}
              </div>
            </ClickableTooltip>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Utensils className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Eaten</span>
              </div>
              <span className="text-xs text-foreground">g carbs</span>
            </div>
          </div>
        </div>

        {/* Bottom Row - Planned (Current Size) */}
        <div className="grid grid-cols-2 gap-4 w-full">
          {/* Calories Planned */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Target className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Planned</span>
            </div>
            <ClickableTooltip content={`Calories planned: ${Math.round(totalCalories)} | Daily goal: ${Math.round(dailyCalorieGoal)}`}>
              <div className={`text-lg font-semibold ${getProgressColor(totalCalories, dailyCalorieGoal)} cursor-pointer`}>
                {Math.round(totalCalories)}
              </div>
            </ClickableTooltip>
            <div className="text-xs text-muted-foreground">cal</div>
          </div>

          {/* Carbs Planned */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Target className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Planned</span>
            </div>
            <ClickableTooltip content={`Carbs planned: ${Math.round(totalCarbs)}g | Daily goal: ${Math.round(dailyCarbGoal)}g`}>
              <div className={`text-lg font-semibold ${getProgressColor(totalCarbs, dailyCarbGoal)} cursor-pointer`}>
                {Math.round(totalCarbs)}
              </div>
            </ClickableTooltip>
            <div className="text-xs text-muted-foreground">g carbs</div>
          </div>
        </div>

        {/* Empty State */}
        {entries.length === 0 && (
          <div className="text-center text-muted-foreground">
            <Utensils className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No foods tracked yet</p>
          </div>
        )}
      </div>
    </Card>
  );
};