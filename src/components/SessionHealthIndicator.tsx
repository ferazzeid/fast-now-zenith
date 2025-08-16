import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { useAuthStateMonitor } from '@/hooks/useAuthStateMonitor';

export const SessionHealthIndicator = () => {
  const [healthStatus, setHealthStatus] = useState<'unknown' | 'healthy' | 'degraded' | 'failed'>('unknown');
  const { validateDatabaseAuth } = useAuthStateMonitor();

  useEffect(() => {
    const checkHealth = async () => {
      const result = await validateDatabaseAuth();
      setHealthStatus(result.authWorking ? 'healthy' : 'failed');
    };

    // Check health every 30 seconds
    checkHealth();
    const interval = setInterval(checkHealth, 30000);

    return () => clearInterval(interval);
  }, [validateDatabaseAuth]);

  const getStatusColor = () => {
    switch (healthStatus) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (healthStatus) {
      case 'healthy': return 'Session OK';
      case 'degraded': return 'Session Warning';
      case 'failed': return 'Session Error';
      default: return 'Checking...';
    }
  };

  if (healthStatus === 'healthy') return null; // Only show when there are issues

  return (
    <Badge variant="outline" className={`${getStatusColor()} text-white border-none`}>
      {getStatusText()}
    </Badge>
  );
};