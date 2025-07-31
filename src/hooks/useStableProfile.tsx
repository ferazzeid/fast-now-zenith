import { useRef, useMemo } from 'react';
import { useProfile } from '@/hooks/useProfile';

/**
 * A stable version of useProfile that prevents infinite re-renders
 * by maintaining stable object references and deep comparison
 */
export const useStableProfile = () => {
  const { profile, loading, updateProfile, loadProfile, isProfileComplete, calculateBMR, calculateWalkingCalories } = useProfile();
  
  // Keep track of previous profile to prevent unnecessary updates
  const previousProfileRef = useRef(profile);
  const stableProfileRef = useRef(profile);
  
  // Create stable profile object that only changes when values actually change
  const stableProfile = useMemo(() => {
    if (!profile) {
      if (previousProfileRef.current !== null) {
        previousProfileRef.current = null;
        stableProfileRef.current = null;
      }
      return null;
    }
    
    // Deep comparison of relevant fields
    const prev = previousProfileRef.current;
    const hasChanged = !prev ||
      prev.weight !== profile.weight ||
      prev.height !== profile.height ||
      prev.age !== profile.age ||
      prev.units !== profile.units ||
      prev.default_walking_speed !== profile.default_walking_speed;
    
    if (hasChanged) {
      previousProfileRef.current = profile;
      stableProfileRef.current = profile;
    }
    
    return stableProfileRef.current;
  }, [profile]);
  
  // Create stable calculation functions that don't change between renders
  const stableCalculateWalkingCalories = useMemo(() => {
    return (durationMinutes: number, speedMph: number = 3) => {
      return calculateWalkingCalories(durationMinutes, speedMph);
    };
  }, [calculateWalkingCalories]);
  
  const stableIsProfileComplete = useMemo(() => {
    return () => isProfileComplete();
  }, [isProfileComplete]);
  
  return {
    profile: stableProfile,
    loading,
    updateProfile,
    loadProfile,
    isProfileComplete: stableIsProfileComplete,
    calculateBMR,
    calculateWalkingCalories: stableCalculateWalkingCalories
  };
};
