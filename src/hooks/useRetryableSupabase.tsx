import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useRetryableSupabase = () => {
  const executeWithRetry = useCallback(async (operation: () => Promise<any>, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        return result;
      } catch (error: any) {
        console.log(`Attempt ${attempt} failed:`, error);
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }, []);

  return { executeWithRetry };
};