import { useState, useEffect, useCallback } from 'react';
import { FastingHour, ContentVariant } from '@/hooks/optimized/useFastingHoursQuery';

interface UseContentRotationProps {
  fastingHour: FastingHour | null;
  autoRotate?: boolean;
  rotationInterval?: number; // milliseconds
}

interface ContentRotationState {
  currentContent: string;
  currentType: ContentVariant['type'];
  currentIndex: number;
  totalVariants: number;
  isRotating: boolean;
}

export function useContentRotation({
  fastingHour,
  autoRotate = true,
  rotationInterval = 10000 // Much slower - 10 seconds between changes
}: UseContentRotationProps) {
  const [rotationState, setRotationState] = useState<ContentRotationState>({
    currentContent: '',
    currentType: 'metabolic',
    currentIndex: 0,
    totalVariants: 0,
    isRotating: autoRotate
  });

  // Get the encouragement content (original tooltip from JSON)
  const getPrimaryContent = useCallback((hour: FastingHour): ContentVariant => {
    console.log('Getting encouragement content for hour:', hour.hour, hour);
    
    // Use encouragement field (original "tooltip" from JSON)
    if (hour.encouragement) {
      return { type: 'encouragement', content: hour.encouragement };
    }
    
    // Final fallback
    return { type: 'encouragement', content: "Guidance will be available soon." };
  }, []);

  // Update state when fastingHour changes - single content only
  useEffect(() => {
    console.log('Content effect triggered with fastingHour:', fastingHour);
    
    if (!fastingHour) {
      console.log('No fasting hour provided');
      return;
    }

    // Get single primary content
    const primaryContent = getPrimaryContent(fastingHour);
    console.log('Primary content for display:', primaryContent);
    
    // Set single content - no rotation
    setRotationState(prev => ({
      ...prev,
      currentContent: primaryContent.content,
      currentType: primaryContent.type,
      currentIndex: 0,
      totalVariants: 1, // Always 1 for single content system
      isRotating: false // No rotation in single content system
    }));
  }, [fastingHour, getPrimaryContent]);

  // No auto-rotation needed for single content system

  // Navigation functions not needed for single content system
  const goToNext = useCallback(() => {}, []);
  const goToPrevious = useCallback(() => {}, []);
  const goToIndex = useCallback(() => {}, []);
  const toggleRotation = useCallback(() => {}, []);

  return {
    ...rotationState,
    goToNext,
    goToPrevious,
    goToIndex,
    toggleRotation
  };
}