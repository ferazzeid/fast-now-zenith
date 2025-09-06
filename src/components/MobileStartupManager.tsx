import React from 'react';
import { useSimplifiedStartup } from '@/hooks/useSimplifiedStartup';
import { SimplifiedStartup } from '@/components/SimplifiedStartup';
import { detectStuckLoading, MobileRecovery } from '@/utils/startupPerformance';

interface MobileStartupManagerProps {
  children: React.ReactNode;
}

export const MobileStartupManager: React.FC<MobileStartupManagerProps> = ({ children }) => {
  const startup = useSimplifiedStartup();
  const [stuckDetectionTime, setStuckDetectionTime] = React.useState(Date.now());
  const [recoveryAttempt, setRecoveryAttempt] = React.useState(0);

  // Reset stuck detection when state changes
  React.useEffect(() => {
    setStuckDetectionTime(Date.now());
  }, [startup.state]);

  // Detect if we're stuck and trigger mobile recovery
  React.useEffect(() => {
    const checkInterval = setInterval(() => {
      const timeInState = Date.now() - stuckDetectionTime;
      
      if (detectStuckLoading(startup.state, timeInState)) {
        console.warn(`🚨 Mobile startup stuck in ${startup.state} for ${timeInState}ms`);
        
        // Progressive mobile recovery
        if (recoveryAttempt < 3 && MobileRecovery.isMobile()) {
          setRecoveryAttempt(prev => prev + 1);
          MobileRecovery.progressiveRecovery(recoveryAttempt + 1);
        }
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(checkInterval);
  }, [startup.state, stuckDetectionTime, recoveryAttempt]);

  // Mobile-specific startup logging
  React.useEffect(() => {
    if (MobileRecovery.isMobile()) {
      console.log(`📱 Mobile startup state: ${startup.state}`, {
        online: startup.isOnline,
        retryCount: startup.retryCount,
        error: startup.error
      });
    }
  }, [startup.state, startup.isOnline, startup.retryCount, startup.error]);

  if (startup.state !== 'ready') {
    return (
      <SimplifiedStartup
        state={startup.state}
        error={startup.error}
        isOnline={startup.isOnline}
        onRetry={startup.retry}
        onForceRefresh={startup.forceRefresh}
      >
        {children}
      </SimplifiedStartup>
    );
  }

  return <>{children}</>;
};