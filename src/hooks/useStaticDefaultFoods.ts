import { useMemo } from 'react';
import { 
  DEFAULT_FOODS, 
  DefaultFood,
  searchDefaultFoods,
  getDefaultFoodByName,
  getDefaultFoodsByCategory 
} from '@/data/defaultFoods';

interface UseStaticDefaultFoodsResult {
  defaultFoods: DefaultFood[];
  loading: boolean;
  error: null;
  searchFoods: (query: string) => DefaultFood[];
  getFoodByName: (name: string) => DefaultFood | undefined;
  getFoodsByCategory: (category?: string) => DefaultFood[];
}

/**
 * Hook for instant access to bundled default foods
 * No database calls, no loading states - data is available immediately
 */
export const useStaticDefaultFoods = (): UseStaticDefaultFoodsResult => {
  const defaultFoods = useMemo(() => DEFAULT_FOODS, []);

  return {
    defaultFoods,
    loading: false, // Always false - data is bundled
    error: null,    // Always null - no network requests
    searchFoods: searchDefaultFoods,
    getFoodByName: getDefaultFoodByName,
    getFoodsByCategory: getDefaultFoodsByCategory
  };
};

export default useStaticDefaultFoods;