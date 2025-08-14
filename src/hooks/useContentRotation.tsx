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

  // Build content variants from fastingHour data (excludes admin_personal_log)
  const buildContentVariants = useCallback((hour: FastingHour): ContentVariant[] => {
    console.log('Building content variants for hour:', hour.hour, hour);
    
    const variants: ContentVariant[] = [];
    
    // Include stage in rotation
    if (hour.stage) {
      variants.push({ type: 'stage', content: hour.stage });
    }
    
    if (hour.metabolic_changes) {
      variants.push({ type: 'metabolic', content: hour.metabolic_changes });
    }
    
    if (hour.physiological_effects) {
      variants.push({ type: 'physiological', content: hour.physiological_effects });
    }
    
    if (hour.mental_emotional_state && hour.mental_emotional_state.length > 0) {
      variants.push({ type: 'mental', content: hour.mental_emotional_state.join('. ') });
    }
    
    // Include encouragement in rotation
    if (hour.encouragement) {
      variants.push({ type: 'encouragement', content: hour.encouragement });
    }
    
    // Fallback to body_state if no other content
    if (variants.length === 0 && hour.body_state) {
      variants.push({ type: 'physiological', content: hour.body_state });
    }
    
    // NOTE: admin_personal_log is intentionally excluded from rotation
    // It's displayed separately in AdminPersonalLogInterface
    
    console.log('Built variants (excluding admin logs):', variants);
    return variants;
  }, []);

  // Update rotation state when fastingHour changes
  useEffect(() => {
    console.log('Content rotation effect triggered with fastingHour:', fastingHour);
    
    if (!fastingHour) {
      console.log('No fasting hour provided');
      return;
    }

    let variants: ContentVariant[] = [];
    
    // Try to use provided rotation data first and filter out empty content, \n characters, and admin logs
    if (fastingHour.content_rotation_data?.variants?.length) {
      console.log('Using provided rotation data:', fastingHour.content_rotation_data.variants);
      variants = fastingHour.content_rotation_data.variants
        .filter(v => 
          v.content && 
          v.content.trim() !== '' && 
          !v.content.includes('coming soon') &&
          v.type !== 'admin_personal_log' // Exclude admin logs from rotation
        )
        .map(v => ({
          ...v,
          content: v.content.replace(/\\n/g, ' ').replace(/\n/g, ' ').trim()
        }));
    }
    
    // If no valid variants from rotation data, build them
    if (variants.length === 0) {
      console.log('Building variants from hour data');
      variants = buildContentVariants(fastingHour);
    }
    
    console.log('Final variants for display:', variants);
    
    if (variants.length > 0) {
      // Reset to first variant when hour changes and force immediate update
      setRotationState(prev => ({
        ...prev,
        currentContent: variants[0]?.content || '',
        currentType: variants[0]?.type || 'metabolic',
        currentIndex: 0,
        totalVariants: variants.length,
        isRotating: autoRotate // Keep rotation state consistent
      }));
    } else {
      // Fallback if no variants
      console.log('No variants found, using fallback');
      setRotationState(prev => ({
        ...prev,
        currentContent: fastingHour.body_state || "Information will be available soon.",
        currentType: 'physiological',
        currentIndex: 0,
        totalVariants: 1
      }));
    }
  }, [fastingHour, buildContentVariants]);

  // Auto-rotation logic with fade transition
  useEffect(() => {
    if (!rotationState.isRotating || rotationState.totalVariants <= 1) return;
    
    const interval = setInterval(() => {
      setRotationState(prev => {
        if (!fastingHour) return prev;
        
        const variants = fastingHour.content_rotation_data?.variants?.length 
          ? fastingHour.content_rotation_data.variants.filter(v => v.content && !v.content.includes('coming soon'))
          : buildContentVariants(fastingHour);
          
        const nextIndex = (prev.currentIndex + 1) % variants.length;
        const nextVariant = variants[nextIndex];
        
        return {
          ...prev,
          currentContent: nextVariant?.content || '',
          currentType: nextVariant?.type || 'metabolic',
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