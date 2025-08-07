import { useMemo } from 'react';
import { useDailyDeficitQuery } from '@/hooks/optimized/useDailyDeficitQuery';
import { useProfile } from '@/hooks/useProfile';

interface GoalCalculations {
  weeksToGoal: number | null;
  dailyDeficitNeeded: number | null;
  currentDeficit: number;
  goalWeight: number | null;
  currentWeight: number | null;
  weightToLose: number | null;
  fatInGrams: number;
  thirtyDayProjection: number;
}

export const useGoalCalculations = (): GoalCalculations => {
  const { deficit } = useDailyDeficitQuery();
  const { profile } = useProfile();

  const calculations = useMemo(() => {
    const currentWeight = profile?.weight || null;
    const goalWeight = profile?.goal_weight || null;
    const currentDeficit = deficit?.calories || 0;

    // Convert deficit calories to fat grams (1g fat = 7.7 calories)
    const fatInGrams = Math.round(Math.max(0, currentDeficit) / 7.7 * 10) / 10;

    // 30-day fat loss projection (current deficit × 30 days ÷ 7.7 cal/g)
    const thirtyDayProjection = Math.round(Math.max(0, currentDeficit * 30) / 7.7 * 10) / 10;

    if (!currentWeight || !goalWeight || currentWeight <= goalWeight) {
      return {
        weeksToGoal: null,
        dailyDeficitNeeded: null,
        currentDeficit,
        goalWeight,
        currentWeight,
        weightToLose: null,
        fatInGrams,
        thirtyDayProjection
      };
    }

    const weightToLose = currentWeight - goalWeight;
    
    // Convert weight to grams based on units
    let weightToLoseGrams: number;
    if (profile?.units === 'metric') {
      weightToLoseGrams = weightToLose * 1000; // kg to grams
    } else {
      weightToLoseGrams = weightToLose * 453.592; // lbs to grams
    }

    // Assume 1g of body weight loss = 7.7 calories (approximate)
    const totalCaloriesNeeded = weightToLoseGrams * 7.7;

    let weeksToGoal: number | null = null;
    let dailyDeficitNeeded: number | null = null;

    if (currentDeficit > 0) {
      const daysToGoal = totalCaloriesNeeded / currentDeficit;
      weeksToGoal = Math.round(daysToGoal / 7 * 10) / 10;
    }

    // Calculate daily deficit needed for 1 lb/week or 0.5 kg/week loss
    const weeklyWeightLoss = profile?.units === 'metric' ? 0.5 : 1; // kg or lbs
    const weeklyCaloriesNeeded = (profile?.units === 'metric' ? 500 : 453.592) * 7.7; // Convert to calories
    dailyDeficitNeeded = Math.round(weeklyCaloriesNeeded / 7);

    return {
      weeksToGoal,
      dailyDeficitNeeded,
      currentDeficit,
      goalWeight,
      currentWeight,
      weightToLose,
      fatInGrams,
      thirtyDayProjection
    };
  }, [deficit?.calories, profile?.weight, profile?.goal_weight, profile?.units]);

  return calculations;
};