import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LoadingRecovery } from './LoadingRecovery';
import { useIsMobile } from '@/hooks/use-mobile';

interface AdminHealthCheckProps {
  children: React.ReactNode;
}

export const AdminHealthCheck = ({ children }: AdminHealthCheckProps) => {
  const [healthStatus, setHealthStatus] = useState<'checking' | 'healthy' | 'unhealthy'>('checking');
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const checkHealth = async () => {
    try {
      setError(null);
      setHealthStatus('checking');

      // Test basic database connectivity
      const { error: dbError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (dbError) {
        throw new Error(`Database connectivity issue: ${dbError.message}`);
      }

      // Test admin functionality with general settings (public read)
      const { error: settingsError } = await supabase
        .from('general_settings')
        .select('setting_key')
        .limit(1);

      if (settingsError) {
        throw new Error(`Admin functions unavailable: ${settingsError.message}`);
      }

      setHealthStatus('healthy');
    } catch (err) {
      console.error('Admin health check failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setHealthStatus('unhealthy');
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  if (healthStatus === 'checking') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="space-y-4 text-center max-w-md">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto animate-spin" />
          <p className="text-sm text-muted-foreground">Checking admin system health...</p>
          {isMobile && (
            <p className="text-xs text-muted-foreground/70">Mobile connections may take longer</p>
          )}
        </div>
      </div>
    );
  }

  if (healthStatus === 'unhealthy') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <LoadingRecovery
          onRetry={checkHealth}
          message={error || 'Admin system health check failed'}
          showError={true}
        />
      </div>
    );
  }

  return <>{children}</>;
};