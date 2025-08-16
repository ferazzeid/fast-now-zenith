import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';

interface AuthStatus {
  timestamp: string;
  frontendSession: boolean;
  frontendUserId: string | null;
  frontendTokenExists: boolean;
  databaseAuthUid: string | null;
  databaseAuthWorking: boolean;
  networkHeaders: string | null;
  error: string | null;
}

export default function JWTObservatory() {
  const [authHistory, setAuthHistory] = useState<AuthStatus[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const user = useAuthStore(state => state.user);

  const checkAuthStatus = async (): Promise<AuthStatus> => {
    const timestamp = new Date().toISOString();
    let status: AuthStatus = {
      timestamp,
      frontendSession: false,
      frontendUserId: null,
      frontendTokenExists: false,
      databaseAuthUid: null,
      databaseAuthWorking: false,
      networkHeaders: null,
      error: null,
    };

    try {
      // Check frontend session
      const { data: session } = await supabase.auth.getSession();
      status.frontendSession = !!session?.session;
      status.frontendUserId = session?.session?.user?.id || null;
      status.frontendTokenExists = !!session?.session?.access_token;

      // Test database auth.uid() directly
      const { data: dbUid, error: dbError } = await supabase.rpc('test_auth_uid');
      
      if (dbError) {
        status.error = `Database RPC error: ${dbError.message}`;
        status.databaseAuthWorking = false;
      } else {
        status.databaseAuthUid = dbUid;
        status.databaseAuthWorking = !!dbUid;
      }

      // Check if Authorization header would be sent (check session token)
      if (session?.session?.access_token) {
        status.networkHeaders = `Token present (${session.session.access_token.substring(0, 20)}...)`;
      } else {
        status.networkHeaders = 'No access token available';
      }

    } catch (error) {
      status.error = `Check failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }

    return status;
  };

  useEffect(() => {
    if (!isMonitoring) return;

    const monitor = async () => {
      const status = await checkAuthStatus();
      setAuthHistory(prev => {
        const newHistory = [status, ...prev].slice(0, 50); // Keep last 50 entries
        
        // Log significant changes
        if (prev.length > 0) {
          const lastStatus = prev[0];
          if (lastStatus.databaseAuthWorking !== status.databaseAuthWorking) {
            console.log('🔴 JWT TRANSMISSION FAILURE DETECTED:', {
              from: lastStatus.databaseAuthWorking ? 'WORKING' : 'BROKEN',
              to: status.databaseAuthWorking ? 'WORKING' : 'BROKEN',
              frontendHasSession: status.frontendSession,
              frontendHasToken: status.frontendTokenExists,
              databaseUid: status.databaseAuthUid,
              headers: status.networkHeaders,
              error: status.error,
              timestamp: status.timestamp
            });
          }
        }
        
        return newHistory;
      });
    };

    // Initial check
    monitor();

    // Check every 2 seconds
    const interval = setInterval(monitor, 2000);

    return () => clearInterval(interval);
  }, [isMonitoring]);

  const getStatusBadge = (working: boolean, label: string) => (
    <Badge variant={working ? "default" : "destructive"}>
      {working ? '✅' : '❌'} {label}
    </Badge>
  );

  const latestStatus = authHistory[0];
  const syncFailures = authHistory.filter(s => s.frontendSession && !s.databaseAuthWorking).length;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>JWT Token Observatory</CardTitle>
            <CardDescription>
              Real-time monitoring of JWT token transmission from frontend to database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsMonitoring(!isMonitoring)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded"
              >
                {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
              </button>
              <span className="text-sm text-muted-foreground">
                Checking every 2 seconds
              </span>
            </div>

            {latestStatus && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded">
                <div className="space-y-2">
                  <h3 className="font-medium">Frontend Status</h3>
                  {getStatusBadge(latestStatus.frontendSession, 'Session Exists')}
                  {getStatusBadge(latestStatus.frontendTokenExists, 'JWT Token Present')}
                  <p className="text-xs text-muted-foreground">
                    User ID: {latestStatus.frontendUserId || 'null'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium">Database Status</h3>
                  {getStatusBadge(latestStatus.databaseAuthWorking, 'auth.uid() Working')}
                  <p className="text-xs text-muted-foreground">
                    Database UID: {latestStatus.databaseAuthUid || 'null'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Headers: {latestStatus.networkHeaders}
                  </p>
                </div>
              </div>
            )}

            <div className="text-sm">
              <p className="font-medium">Sync Failures Detected: {syncFailures}</p>
              <p className="text-muted-foreground">
                (Frontend has session but database auth.uid() returns null)
              </p>
            </div>

            {latestStatus?.error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-sm">
                <strong>Error:</strong> {latestStatus.error}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Authentication History</CardTitle>
            <CardDescription>
              Real-time log of authentication status changes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {authHistory.map((status, index) => (
                <div 
                  key={index}
                  className={`flex items-center justify-between p-3 rounded text-sm ${
                    status.frontendSession && !status.databaseAuthWorking 
                      ? 'bg-destructive/10 border border-destructive/20' 
                      : 'bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs">
                      {new Date(status.timestamp).toLocaleTimeString()}
                    </span>
                    <div className="flex gap-2">
                      <span className={status.frontendSession ? 'text-green-600' : 'text-red-600'}>
                        Frontend: {status.frontendSession ? '✅' : '❌'}
                      </span>
                      <span className={status.databaseAuthWorking ? 'text-green-600' : 'text-red-600'}>
                        Database: {status.databaseAuthWorking ? '✅' : '❌'}
                      </span>
                    </div>
                  </div>
                  
                  {status.error && (
                    <span className="text-xs text-destructive">{status.error}</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}