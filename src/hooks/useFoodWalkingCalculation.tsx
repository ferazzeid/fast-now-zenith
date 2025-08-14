import { useCallback } from 'react';
import { useProfile } from '@/hooks/useProfile';

export const useFoodWalkingCalculation = () => {
  const { profile } = useProfile();

  const calculateWalkingMinutesForFood = useCallback((calories: number, speedMph: number = 3): number => {
    if (!profile?.weight || !calories) return 0;

    // MET values for different walking speeds
    const metValues: { [key: number]: number } = {
      2: 2.8,  // 2 mph - slow pace
      3: 3.2,  // 3 mph - average pace 
      4: 4.3,  // 4 mph - brisk pace
      5: 5.5   // 5 mph - fast pace
    };
    
    const met = metValues[Math.round(speedMph)] || 3.2;
    
    // Weight is already in kg
    const weightKg = profile.weight;
    
    // Calculate calories burned per minute: MET × weight(kg) / 60
    const caloriesPerMinute = (met * weightKg) / 60;
    
    // Calculate minutes needed to burn the food calories
    const minutesRequired = Math.ceil(calories / caloriesPerMinute);
    
    return minutesRequired;
  }, [profile?.weight, profile?.units]);

  const formatWalkingTime = useCallback((minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
  }, []);

  return {
    calculateWalkingMinutesForFood,
    formatWalkingTime
  };
};