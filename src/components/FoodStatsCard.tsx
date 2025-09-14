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

  console.log('🍽️ FoodStatsCard received entries:', entries?.length, entries);

  // Calculate totals
  const totalCalories = entries.reduce((sum, entry) => sum + entry.calories, 0);
  const consumedCalories = entries.filter(entry => entry.consumed).reduce((sum, entry) => sum + entry.calories, 0);
  const totalCarbs = entries.reduce((sum, entry) => sum + entry.carbs, 0);
  const consumedCarbs = entries.filter(entry => entry.consumed).reduce((sum, entry) => sum + entry.carbs, 0);

  const dailyCalorieGoal = profile?.daily_calorie_goal || 2000;
  const dailyCarbGoal = profile?.daily_carb_goal || 30;

  console.log('🍽️ Calculated totals:', { totalCalories, consumedCalories, totalCarbs, consumedCarbs, dailyCalorieGoal, dailyCarbGoal });

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

  // Calculate TDEE and remaining calories for tooltips
  const calculateTDEE = () => {
    if (!profile?.weight || !profile?.height || !profile?.age || !profile?.sex || !profile?.activity_level) return 2000;
    
    // Mifflin-St Jeor equation
    const weight = profile.weight;
    const height = profile.height;
    const age = profile.age;
    const sex = profile.sex;
    
    let bmr;
    if (sex === 'male') {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }
    
    const activityMultipliers = {
      sedentary: 1.2,
      lightly_active: 1.375,
      moderately_active: 1.55,
      very_active: 1.725,
      extra_active: 1.9
    };
    
    const multiplier = activityMultipliers[profile.activity_level as keyof typeof activityMultipliers] || 1.375;
    return Math.round(bmr * multiplier);
  };

  const tdee = calculateTDEE();
  const targetDeficit = 500; // Default target deficit
  const dailyAllowance = tdee - targetDeficit;
  const remainingCalories = dailyAllowance - consumedCalories;

  return (
    <Card className="p-3 text-center relative overflow-hidden min-h-[140px]">
      {/* Main Content */}
      <div className="flex flex-col justify-center items-center h-full space-y-2">
        {/* Top Row - Eaten (Large Numbers) */}
        <div className="grid grid-cols-2 gap-6 w-full">
          {/* Calories Eaten */}
          <div className="text-center">
            <ClickableTooltip content={`Daily target: ${dailyAllowance} calories`}>
              <div 
                className={`text-4xl font-mono font-bold mb-1 tracking-wide cursor-pointer ${consumedCalories > dailyAllowance ? 'text-destructive' : 'text-warm-text'}`}
                style={{ 
                  fontFeatureSettings: '"tnum" 1',
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}
              >
                <div className="flex items-baseline justify-center gap-1">
                  <span>{Math.round(consumedCalories)}</span>
                  <span className="text-lg font-mono">cal</span>
                </div>
              </div>
            </ClickableTooltip>
          </div>

          {/* Carbs Eaten */}
          <div className="text-center">
            <ClickableTooltip content={`Daily goal: ${Math.round(dailyCarbGoal)}g`}>
              <div 
                className={`text-4xl font-mono font-bold mb-1 tracking-wide cursor-pointer ${consumedCarbs > dailyCarbGoal ? 'text-destructive' : 'text-warm-text'}`}
                style={{ 
                  fontFeatureSettings: '"tnum" 1',
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}
              >
                <div className="flex items-baseline justify-center gap-1">
                  <span>{Math.round(consumedCarbs)}</span>
                  <span className="text-lg font-mono">g</span>
                </div>
              </div>
            </ClickableTooltip>
          </div>
        </div>

        {/* Divider Line */}
        <div className="w-full h-px bg-border/50 my-1"></div>

        {/* Bottom Row - Planned (Smaller Numbers) */}
        <div className="grid grid-cols-2 gap-6 w-full">
          {/* Calories Planned */}
          <div className="text-center">
            <ClickableTooltip content={`Daily target: ${dailyAllowance} calories`}>
              <div className={`text-sm ${getProgressColor(totalCalories, dailyAllowance)} cursor-pointer`}>
                <div className="flex items-baseline justify-center gap-1">
                  <span>{Math.round(totalCalories)}</span>
                  <span className="text-xs">cal</span>
                </div>
              </div>
            </ClickableTooltip>
          </div>

          {/* Carbs Planned */}
          <div className="text-center">
            <ClickableTooltip content={`Daily goal: ${Math.round(dailyCarbGoal)}g`}>
              <div className={`text-sm ${getProgressColor(totalCarbs, dailyCarbGoal)} cursor-pointer`}>
                <div className="flex items-baseline justify-center gap-1">
                  <span>{Math.round(totalCarbs)}</span>
                  <span className="text-xs">g</span>
                </div>
              </div>
            </ClickableTooltip>
          </div>
        </div>

        {/* Empty State - Only show if truly no entries */}
        {(!entries || entries.length === 0) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-muted-foreground">
            <Utensils className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No foods tracked yet</p>
          </div>
        )}
      </div>
    </Card>
  );
};