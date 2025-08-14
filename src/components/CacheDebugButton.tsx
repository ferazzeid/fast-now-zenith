import React from 'react';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { fastingHoursKey } from '@/hooks/optimized/useFastingHoursQuery';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useToast } from '@/hooks/use-toast';

export const CacheDebugButton: React.FC = () => {
  const { isAdmin } = useAdminRole();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  if (!isAdmin) return null;

  const handleCacheDebug = async () => {
    const cacheData = queryClient.getQueryData(fastingHoursKey);
    console.log('🔧 BEFORE REFRESH - Cache data:', cacheData);
    
    toast({
      title: "Cache Debug",
      description: "Check console for cache data. Forcing refresh...",
    });
    
    // Aggressive cache clearing
    queryClient.removeQueries({ queryKey: fastingHoursKey });
    await queryClient.invalidateQueries({ queryKey: fastingHoursKey });
    await queryClient.refetchQueries({ queryKey: fastingHoursKey });
    
    setTimeout(() => {
      const newCacheData = queryClient.getQueryData(fastingHoursKey);
      console.log('🔧 AFTER REFRESH - Cache data:', newCacheData);
      
      toast({
        title: "Cache Refreshed",
        description: "Check console for updated cache data",
      });
    }, 2000);
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleCacheDebug}
      className="mt-2"
    >
      Debug & Force Refresh Cache
    </Button>
  );
};