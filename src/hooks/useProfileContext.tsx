import { useState, useEffect } from 'react';
import { useProfile } from './useProfile';

export interface ProfileContext {
  weight?: number;
  height?: number;
  age?: number;
  sex?: 'male' | 'female';
  units?: 'metric' | 'imperial';
  dailyCalorieGoal?: number;
  dailyCarbGoal?: number;
  goalWeight?: number;
  activityLevel?: string;
  defaultWalkingSpeed?: number;
  manualTdeeOverride?: number;
  bmr?: number;
  isComplete: boolean;
}

export const useProfileContext = () => {
  const [context, setContext] = useState<ProfileContext | null>(null);
  const { profile, isProfileComplete, calculateBMR } = useProfile();

  useEffect(() => {
    if (!profile) {
      setContext(null);
      return;
    }

    const profileContext: ProfileContext = {
      weight: profile.weight,
      height: profile.height,
      age: profile.age,
      sex: profile.sex,
      units: profile.units || 'metric',
      dailyCalorieGoal: profile.daily_calorie_goal,
      dailyCarbGoal: profile.daily_carb_goal,
      goalWeight: profile.goal_weight,
      activityLevel: profile.activity_level,
      defaultWalkingSpeed: profile.default_walking_speed,
      manualTdeeOverride: profile.manual_tdee_override,
      bmr: calculateBMR(),
      isComplete: isProfileComplete()
    };

    setContext(profileContext);
  }, [profile, isProfileComplete, calculateBMR]);

  const buildContextString = (ctx: ProfileContext): string => {
    if (!ctx) return '';
    
    const parts: string[] = [];
    
    // Basic profile info
    if (ctx.weight !== undefined) {
      const unit = ctx.units === 'metric' ? 'kg' : 'lbs';
      parts.push(`Weight: ${ctx.weight}${unit}`);
    }
    
    if (ctx.height !== undefined) {
      const unit = ctx.units === 'metric' ? 'cm' : 'inches';
      parts.push(`Height: ${ctx.height}${unit}`);
    }
    
    if (ctx.age !== undefined) {
      parts.push(`Age: ${ctx.age} years old`);
    }
    
    if (ctx.sex) {
      parts.push(`Sex: ${ctx.sex}`);
    }
    
    // Goals
    if (ctx.dailyCalorieGoal !== undefined) {
      parts.push(`Daily calorie goal: ${ctx.dailyCalorieGoal} calories`);
    }
    
    if (ctx.dailyCarbGoal !== undefined) {
      parts.push(`Daily carb goal: ${ctx.dailyCarbGoal} grams`);
    }
    
    if (ctx.goalWeight !== undefined) {
      const unit = ctx.units === 'metric' ? 'kg' : 'lbs';
      parts.push(`Goal weight: ${ctx.goalWeight}${unit}`);
    }
    
    // Activity and metrics
    if (ctx.activityLevel) {
      parts.push(`Activity level: ${ctx.activityLevel}`);
    }
    
    if (ctx.defaultWalkingSpeed !== undefined) {
      parts.push(`Default walking speed: ${ctx.defaultWalkingSpeed} mph`);
    }
    
    if (ctx.manualTdeeOverride !== undefined) {
      parts.push(`Custom TDEE: ${ctx.manualTdeeOverride} calories/day`);
    }
    
    if (ctx.bmr && ctx.bmr > 0) {
      parts.push(`BMR: ${ctx.bmr} calories/day`);
    }
    
    // Unit preference
    parts.push(`Unit preference: ${ctx.units}`);
    
    if (parts.length > 0) {
      return `User Profile: ${parts.join(', ')}.`;
    }
    
    return 'User profile is incomplete.';
  };

  return {
    context,
    buildContextString
  };
};