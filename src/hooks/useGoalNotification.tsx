import { useState, useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';

export const useGoalNotification = () => {
  const { profile, isProfileComplete } = useProfile();
  const [shouldShowGoalSetting, setShouldShowGoalSetting] = useState(false);
  const [lastProfileCheck, setLastProfileCheck] = useState<string | null>(null);

  useEffect(() => {
    const checkGoalNotification = () => {
      if (!profile || !isProfileComplete()) {
        setShouldShowGoalSetting(false);
        return;
      }

      // Check if goals are missing
      const hasGoals = profile.daily_calorie_goal && profile.daily_carb_goal;
      
      // Create a profile signature to detect changes
      const profileSignature = `${profile.weight}-${profile.height}-${profile.age}-${profile.activity_level}`;
      
      // Show notification if:
      // 1. Goals are missing OR
      // 2. Profile has changed significantly
      if (!hasGoals || (lastProfileCheck && lastProfileCheck !== profileSignature)) {
        setShouldShowGoalSetting(true);
        setLastProfileCheck(profileSignature);
      } else if (!lastProfileCheck) {
        setLastProfileCheck(profileSignature);
      }
    };

    checkGoalNotification();
  }, [profile, isProfileComplete, lastProfileCheck]);

  const dismissGoalNotification = () => {
    setShouldShowGoalSetting(false);
  };

  return {
    shouldShowGoalSetting,
    dismissGoalNotification
  };
};