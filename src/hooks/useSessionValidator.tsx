import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Session validation middleware that ensures auth.uid() is working before operations
 */
export const useSessionValidator = () => {
  const { toast } = useToast();

  const withValidSession = useCallback(
    async function<T>(
      operation: () => Promise<T>,
      operationName: string = 'Operation'
    ): Promise<T | null> {
      try {
        // Quick session check
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session?.user?.id) {
          console.warn(`🚫 ${operationName} blocked - no valid session`);
          toast({
            title: "Authentication Required",
            description: "Please sign in to continue.",
            variant: "destructive",
          });
          return null;
        }

        // Database auth context validation
        const { error: dbAuthError } = await supabase.rpc('is_current_user_admin');
        
        if (dbAuthError?.message?.includes('permission denied') ||
            dbAuthError?.message?.includes('insufficient_privilege')) {
          console.warn(`🚫 ${operationName} blocked - auth.uid() returning NULL`);
          
          // Try one session refresh
          const { error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            toast({
              title: "Session Expired",
              description: "Please sign in again to continue.",
              variant: "destructive",
            });
            return null;
          }
          
          // Retry the operation after refresh
          console.log(`🔄 Retrying ${operationName} after session refresh`);
          return await operation();
        }

        // Session is valid, proceed
        return await operation();
      } catch (error) {
        console.error(`❌ ${operationName} session validation failed:`, error);
        toast({
          title: "Session Error",
          description: "Please sign in again to continue.",
          variant: "destructive",
        });
        return null;
      }
    },
    [toast]
  );

  return { withValidSession };
};