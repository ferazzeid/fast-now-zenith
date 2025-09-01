import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { RefreshCw, User, Shield, Clock } from 'lucide-react';

interface AuthDebugPanelProps {
  showInProduction?: boolean;
}

export const AuthDebugPanel = ({ showInProduction = false }: AuthDebugPanelProps) => {
  const { user, session } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Only show in development unless explicitly requested
  if (!showInProduction && process.env.NODE_ENV === 'production') {
    return null;
  }

  const refreshDebugInfo = async () => {
    setIsRefreshing(true);
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      setDebugInfo({
        timestamp: new Date().toISOString(),
        hasUser: !!user,
        hasSession: !!session,
        sessionExpiry: session?.expires_at,
        sessionAccessToken: session?.access_token ? 'Present' : 'Missing',
        sessionRefreshToken: session?.refresh_token ? 'Present' : 'Missing',
        userEmail: user?.email,
        userId: user?.id,
        currentSessionFromClient: !!currentSession,
        currentUserFromClient: !!currentUser,
        sessionTokenLength: session?.access_token?.length || 0,
        isExpired: session?.expires_at ? new Date(session.expires_at * 1000) < new Date() : false,
      });
    } catch (error) {
      console.error('Debug info refresh error:', error);
      setDebugInfo({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
    setIsRefreshing(false);
  };

  useEffect(() => {
    refreshDebugInfo();
  }, [user, session]);

  const testEdgeFunction = async () => {
    try {
      console.log('Testing edge function authentication...');
      const { data, error } = await supabase.functions.invoke('analyze-food-image', {
        body: { test: true },
      });
      
      if (error) {
        console.error('Edge function test error:', error);
      } else {
        console.log('Edge function test success:', data);
      }
    } catch (error) {
      console.error('Edge function test failed:', error);
    }
  };

  return (
    <Card className="mb-4 border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium text-orange-800">
              <Shield className="w-4 h-4 inline mr-2" />
              Auth Debug Panel
            </CardTitle>
            <CardDescription className="text-xs text-orange-600">
              Development debugging information
            </CardDescription>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={refreshDebugInfo}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center">
            <User className="w-3 h-3 mr-1" />
            <span className="font-medium">User:</span>
            <Badge variant={debugInfo.hasUser ? "default" : "destructive"} className="ml-1 text-xs">
              {debugInfo.hasUser ? 'Present' : 'Missing'}
            </Badge>
          </div>
          <div className="flex items-center">
            <Shield className="w-3 h-3 mr-1" />
            <span className="font-medium">Session:</span>
            <Badge variant={debugInfo.hasSession ? "default" : "destructive"} className="ml-1 text-xs">
              {debugInfo.hasSession ? 'Active' : 'Missing'}
            </Badge>
          </div>
        </div>

        {debugInfo.hasSession && (
          <div className="space-y-1 p-2 bg-white rounded border">
            <div className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              <span className="font-medium">Expiry:</span>
              <code className="ml-1 text-xs bg-gray-100 px-1 rounded">
                {debugInfo.sessionExpiry ? new Date(debugInfo.sessionExpiry * 1000).toLocaleString() : 'None'}
              </code>
              <Badge variant={debugInfo.isExpired ? "destructive" : "default"} className="ml-1 text-xs">
                {debugInfo.isExpired ? 'Expired' : 'Valid'}
              </Badge>
            </div>
            <div className="text-xs text-gray-600">
              Token Length: {debugInfo.sessionTokenLength} | 
              Access Token: {debugInfo.sessionAccessToken} | 
              Refresh Token: {debugInfo.sessionRefreshToken}
            </div>
          </div>
        )}

        {debugInfo.userEmail && (
          <div className="text-xs text-gray-600">
            Email: {debugInfo.userEmail} | ID: {debugInfo.userId?.substring(0, 8)}...
          </div>
        )}

        {debugInfo.error && (
          <div className="text-xs text-red-600 p-2 bg-red-50 rounded border border-red-200">
            Error: {debugInfo.error}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button size="sm" variant="outline" onClick={testEdgeFunction}>
            Test Edge Function
          </Button>
        </div>

        <div className="text-xs text-gray-500">
          Last updated: {debugInfo.timestamp && new Date(debugInfo.timestamp).toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
};