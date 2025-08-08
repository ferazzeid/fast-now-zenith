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
  rotationInterval = 3000
}: UseContentRotationProps) {
  const [rotationState, setRotationState] = useState<ContentRotationState>({
    currentContent: '',
    currentType: 'metabolic',
    currentIndex: 0,
    totalVariants: 0,
    isRotating: autoRotate
  });

  // Build content variants from fastingHour data
  const buildContentVariants = useCallback((hour: FastingHour): ContentVariant[] => {
    const variants: ContentVariant[] = [];
    
    if (hour.metabolic_changes) {
      variants.push({ type: 'metabolic', content: hour.metabolic_changes });
    }
    if (hour.physiological_effects) {
      variants.push({ type: 'physiological', content: hour.physiological_effects });
    }
    if (hour.mental_emotional_state?.length) {
      variants.push({ type: 'mental', content: hour.mental_emotional_state.join(', ') });
    }
    if (hour.benefits_challenges) {
      variants.push({ type: 'benefits', content: hour.benefits_challenges });
    }
    if (hour.content_snippet) {
      variants.push({ type: 'snippet', content: hour.content_snippet });
    }
    
    return variants.length > 0 ? variants : [
      { type: 'metabolic', content: hour.body_state || hour.title }
    ];
  }, []);

  // Update rotation state when fastingHour changes
  useEffect(() => {
    if (!fastingHour) return;
    
    const variants = fastingHour.content_rotation_data?.variants?.length 
      ? fastingHour.content_rotation_data.variants
      : buildContentVariants(fastingHour);
    
    const startIndex = fastingHour.content_rotation_data?.current_index || 0;
    const validIndex = Math.min(startIndex, variants.length - 1);
    
    setRotationState(prev => ({
      ...prev,
      currentContent: variants[validIndex]?.content || '',
      currentType: variants[validIndex]?.type || 'metabolic',
      currentIndex: validIndex,
      totalVariants: variants.length
    }));
  }, [fastingHour, buildContentVariants]);

  // Auto-rotation logic
  useEffect(() => {
    if (!rotationState.isRotating || rotationState.totalVariants <= 1) return;
    
    const interval = setInterval(() => {
      setRotationState(prev => {
        if (!fastingHour) return prev;
        
        const variants = fastingHour.content_rotation_data?.variants?.length 
          ? fastingHour.content_rotation_data.variants
          : buildContentVariants(fastingHour);
          
        const nextIndex = (prev.currentIndex + 1) % variants.length;
        const nextVariant = variants[nextIndex];
        
        return {
          ...prev,
          currentContent: nextVariant.content,
          currentType: nextVariant.type,
          currentIndex: nextIndex
        };
      });
    }, rotationInterval);

    return () => clearInterval(interval);
  }, [rotationState.isRotating, rotationState.totalVariants, rotationInterval, fastingHour, buildContentVariants]);

  const goToNext = useCallback(() => {
    if (!fastingHour) return;
    
    const variants = fastingHour.content_rotation_data?.variants?.length 
      ? fastingHour.content_rotation_data.variants
      : buildContentVariants(fastingHour);
      
    setRotationState(prev => {
      const nextIndex = (prev.currentIndex + 1) % variants.length;
      const nextVariant = variants[nextIndex];
      
      return {
        ...prev,
        currentContent: nextVariant.content,
        currentType: nextVariant.type,
        currentIndex: nextIndex
      };
    });
  }, [fastingHour, buildContentVariants]);

  const goToPrevious = useCallback(() => {
    if (!fastingHour) return;
    
    const variants = fastingHour.content_rotation_data?.variants?.length 
      ? fastingHour.content_rotation_data.variants
      : buildContentVariants(fastingHour);
      
    setRotationState(prev => {
      const prevIndex = prev.currentIndex === 0 ? variants.length - 1 : prev.currentIndex - 1;
      const prevVariant = variants[prevIndex];
      
      return {
        ...prev,
        currentContent: prevVariant.content,
        currentType: prevVariant.type,
        currentIndex: prevIndex
      };
    });
  }, [fastingHour, buildContentVariants]);

  const goToIndex = useCallback((index: number) => {
    if (!fastingHour) return;
    
    const variants = fastingHour.content_rotation_data?.variants?.length 
      ? fastingHour.content_rotation_data.variants
      : buildContentVariants(fastingHour);
      
    const validIndex = Math.max(0, Math.min(index, variants.length - 1));
    const variant = variants[validIndex];
    
    setRotationState(prev => ({
      ...prev,
      currentContent: variant.content,
      currentType: variant.type,
      currentIndex: validIndex
    }));
  }, [fastingHour, buildContentVariants]);

  const toggleRotation = useCallback(() => {
    setRotationState(prev => ({
      ...prev,
      isRotating: !prev.isRotating
    }));
  }, []);

  return {
    ...rotationState,
    goToNext,
    goToPrevious,
    goToIndex,
    toggleRotation
  };
}