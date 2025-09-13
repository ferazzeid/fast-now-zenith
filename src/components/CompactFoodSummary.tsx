import React, { useState, useEffect } from 'react';
import { ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  const [showCarbs, setShowCarbs] = useState(false);

  // Load preference from localStorage
  useEffect(() => {
    const savedPreference = localStorage.getItem('compact-food-summary-mode');
    if (savedPreference === 'carbs') {
      setShowCarbs(true);
    }
  }, []);

  // Save preference to localStorage
  const toggleView = () => {
    const newShowCarbs = !showCarbs;
    setShowCarbs(newShowCarbs);
    localStorage.setItem('compact-food-summary-mode', newShowCarbs ? 'carbs' : 'calories');
  };

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

  if (showCarbs) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <ClickableTooltip content="Carbs eaten today">
          <span className={`font-medium ${getProgressColor(consumedCarbs, dailyCarbGoal)}`}>
            {Math.round(consumedCarbs)}g
          </span>
        </ClickableTooltip>
        <span className="text-muted-foreground/60">/</span>
        <ClickableTooltip content="Total carbs planned for today">
          <span className={`font-medium ${getProgressColor(totalCarbs, dailyCarbGoal)}`}>
            {Math.round(totalCarbs)}g
          </span>
        </ClickableTooltip>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleView}
          className="p-1 h-6 w-6 hover:bg-accent/50"
          aria-label="Switch to calories view"
        >
          <ToggleRight className="w-4 h-4 text-muted-foreground" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <ClickableTooltip content="Calories eaten today">
        <span className={`font-medium ${getProgressColor(consumedCalories, dailyCalorieGoal)}`}>
          {Math.round(consumedCalories)}
        </span>
      </ClickableTooltip>
      <span className="text-muted-foreground/60">/</span>
      <ClickableTooltip content="Total calories planned for today">
        <span className={`font-medium ${getProgressColor(totalCalories, dailyCalorieGoal)}`}>
          {Math.round(totalCalories)}
        </span>
      </ClickableTooltip>
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleView}
        className="p-1 h-6 w-6 hover:bg-accent/50"
        aria-label="Switch to carbs view"
      >
        <ToggleLeft className="w-4 h-4 text-muted-foreground" />
      </Button>
    </div>
  );
};