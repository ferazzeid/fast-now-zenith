import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CalorieGoalWarningProps {
  calorieGoal: number;
  sex: string;
}

export const CalorieGoalWarning = ({ calorieGoal, sex }: CalorieGoalWarningProps) => {
  const safetyFloor = sex === 'male' ? 1500 : sex === 'female' ? 1200 : 1200;
  const isLow = calorieGoal > 0 && calorieGoal < safetyFloor;

  if (!isLow) return null;

  return (
    <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
      <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
      <AlertDescription className="text-yellow-800 dark:text-yellow-300">
        Your calorie goal is below recommended minimums ({safetyFloor} for {sex === 'female' ? 'women' : 'men'}). 
        This should only be temporary and may not provide adequate nutrition.
      </AlertDescription>
    </Alert>
  );
};