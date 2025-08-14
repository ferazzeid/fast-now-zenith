/**
 * Utility functions for walking step estimation
 * These are estimates based on average stride length calculations
 * and should not be considered as accurate as actual step counters
 */

import { useCallback } from 'react';
import { useProfileQuery } from '@/hooks/useProfileQuery';

interface StepEstimationProps {
  durationMinutes: number;
  speedMph: number;
  userHeight?: number;
  units?: 'metric' | 'imperial';
}

/**
 * Calculate estimated stride length based on height and walking speed
 * Formula sources:
 * - Basic stride = height * 0.414 (average for walking)
 * - Speed adjustment factor applied based on pace
 */
export const calculateStrideLength = (heightInches: number, speedMph: number): number => {
  // Base stride length (in inches) - conservative estimate
  const baseStride = heightInches * 0.414;
  
  // Speed adjustment factor
  // Slower walking = shorter stride, faster = longer stride
  let speedFactor = 1.0;
  if (speedMph <= 2.5) speedFactor = 0.9;       // Slow pace
  else if (speedMph <= 3.5) speedFactor = 1.0;  // Average pace
  else if (speedMph <= 4.5) speedFactor = 1.1;  // Brisk pace
  else speedFactor = 1.2;                        // Fast pace
  
  return baseStride * speedFactor;
};

/**
 * Estimate steps taken during a walking session
 */
export const estimateSteps = ({
  durationMinutes,
  speedMph,
  userHeight = 70, // Default 70 inches (5'10")
  units = 'imperial'
}: StepEstimationProps): number => {
  // Convert height to inches if metric
  const heightInches = units === 'metric' ? userHeight / 2.54 : userHeight;
  
  // Calculate distance traveled
  const distanceMiles = (durationMinutes / 60) * speedMph;
  const distanceInches = distanceMiles * 63360; // Convert miles to inches
  
  // Calculate stride length
  const strideInches = calculateStrideLength(heightInches, speedMph);
  
  // Estimate steps
  const estimatedSteps = Math.round(distanceInches / strideInches);
  
  return estimatedSteps;
};

/**
 * Get steps per minute for real-time display
 */
export const getStepsPerMinute = (speedMph: number, userHeight: number = 70, units: 'metric' | 'imperial' = 'imperial'): number => {
  const heightInches = units === 'metric' ? userHeight / 2.54 : userHeight;
  const strideInches = calculateStrideLength(heightInches, speedMph);
  const stepsPerMile = 63360 / strideInches; // 63,360 inches in a mile
  const stepsPerMinute = (speedMph * stepsPerMile) / 60;
  
  return Math.round(stepsPerMinute);
};

/**
 * Hook for step estimation utilities that uses stable profile data
 */
export const useStepEstimation = () => {
  const { profile } = useProfileQuery();

  // Create stable functions with useCallback to prevent re-renders
  const estimateStepsForSession = useCallback((durationMinutes: number, speedMph: number): number => {
    return estimateSteps({
      durationMinutes,
      speedMph,
      userHeight: profile?.height || 175,
      units: 'metric' as const
    });
  }, [profile?.height]);

  const getRealTimeStepsPerMinute = useCallback((speedMph: number): number => {
    return getStepsPerMinute(
      speedMph,
      profile?.height || 175,
      'metric' as const
    );
  }, [profile?.height]);

  return {
    estimateStepsForSession,
    getRealTimeStepsPerMinute,
    profile
  };
};