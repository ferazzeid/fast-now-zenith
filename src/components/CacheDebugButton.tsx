import React from 'react';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { fastingHoursKey } from '@/hooks/optimized/useFastingHoursQuery';
import { useAdminRole } from '@/hooks/useAdminRole';

export const CacheDebugButton: React.FC = () => {
  const { isAdmin } = useAdminRole();
  const queryClient = useQueryClient();

  if (!isAdmin) return null;

  const handleCacheDebug = () => {
    console.log('🔧 CACHE DEBUG: Current fasting hours cache:', 
      queryClient.getQueryData(fastingHoursKey)
    );
    
    // Force a complete refresh
    queryClient.removeQueries({ queryKey: fastingHoursKey });
    queryClient.refetchQueries({ queryKey: fastingHoursKey });
    
    setTimeout(() => {
      console.log('🔧 CACHE DEBUG AFTER REFRESH: Updated fasting hours cache:', 
        queryClient.getQueryData(fastingHoursKey)
      );
    }, 2000);
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleCacheDebug}
      className="mt-2"
    >
      Debug Cache
    </Button>
  );
};