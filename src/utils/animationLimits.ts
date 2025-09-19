import { Motivator } from '@/hooks/useMotivators';

export const ANIMATION_LIMITS = {
  QUOTES: 2,
  NOTES: 2
} as const;

export const checkAnimationLimit = (
  motivators: Motivator[],
  type: 'saved_quote' | 'personal_note',
  excludeId?: string
): { canEnable: boolean; currentCount: number; limit: number } => {
  const limit = type === 'saved_quote' ? ANIMATION_LIMITS.QUOTES : ANIMATION_LIMITS.NOTES;
  
  const visibleCount = motivators
    .filter(m => 
      m.category === type && 
      m.show_in_animations === true && 
      m.id !== excludeId
    )
    .length;

  return {
    canEnable: visibleCount < limit,
    currentCount: visibleCount,
    limit
  };
};

export const getAnimationLimitMessage = (
  type: 'saved_quote' | 'personal_note',
  limit: number
): string => {
  const itemType = type === 'saved_quote' ? 'quotes' : 'notes';
  return `You can only have ${limit} ${itemType} visible in timer animations. Please disable one first to enable another.`;
};