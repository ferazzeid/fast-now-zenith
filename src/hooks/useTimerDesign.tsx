import { STATIC_COLORS, STATIC_ASSETS } from '@/utils/staticAssets';

export type TimerDesign = 'ceramic' | 'metaverse';

export const useTimerDesign = () => {
  // Return static timer design - no database dependency
  return {
    timerDesign: 'ceramic' as TimerDesign,
    isLoading: false,
    updateTimerDesign: () => {
      console.log('Timer design is now static - no updates needed');
    },
    isUpdating: false,
  };
};