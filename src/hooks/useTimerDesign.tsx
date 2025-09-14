import { STATIC_COLORS, STATIC_ASSETS } from '@/utils/staticAssets';

export type TimerDesign = 'ceramic';

export const useTimerDesign = () => {
  // Return static ceramic timer design only
  return {
    timerDesign: 'ceramic' as TimerDesign,
    isLoading: false,
    updateTimerDesign: () => {
      // Timer design is now static ceramic only
    },
    isUpdating: false,
  };
};