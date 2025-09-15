import { useMemo } from 'react';
import { 
  SYSTEM_MOTIVATORS, 
  SystemMotivator,
  getActiveSystemMotivators,
  getSystemMotivatorBySlug,
  getSystemMotivatorsByCategory 
} from '@/data/systemMotivators';

interface UseStaticSystemMotivatorsResult {
  systemMotivators: SystemMotivator[];
  loading: boolean;
  error: null;
  getBySlug: (slug: string) => SystemMotivator | undefined;
  getByCategory: (category: string) => SystemMotivator[];
  searchMotivators: (query: string) => SystemMotivator[];
}

/**
 * Hook for instant access to bundled system motivators
 * No database calls, no loading states - data is available immediately
 */
export const useStaticSystemMotivators = (): UseStaticSystemMotivatorsResult => {
  const systemMotivators = useMemo(() => getActiveSystemMotivators(), []);

  const searchMotivators = useMemo(() => 
    (query: string): SystemMotivator[] => {
      if (!query.trim()) return systemMotivators;
      
      const searchTerm = query.toLowerCase().trim();
      return systemMotivators.filter(motivator => 
        motivator.title.toLowerCase().includes(searchTerm) ||
        motivator.content.toLowerCase().includes(searchTerm) ||
        motivator.category?.toLowerCase().includes(searchTerm) ||
        motivator.excerpt?.toLowerCase().includes(searchTerm)
      );
    }, [systemMotivators]
  );

  return {
    systemMotivators,
    loading: false, // Always false - data is bundled
    error: null,    // Always null - no network requests
    getBySlug: getSystemMotivatorBySlug,
    getByCategory: getSystemMotivatorsByCategory,
    searchMotivators
  };
};

export default useStaticSystemMotivators;