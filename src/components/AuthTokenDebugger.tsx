import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { debugAuthTokens, forceSessionReset, validateJWTInRequests } from '@/utils/authTokenDebugger';
import { useToast } from '@/hooks/use-toast';

export const AuthTokenDebugger = () => {
  const { toast } = useToast();

  const handleDebugTokens = async () => {
    const result = await debugAuthTokens();
    
    toast({
      title: result.hasValidSession ? "Session Valid" : "Session Invalid",
      description: result.reason,
      variant: result.hasValidSession ? "default" : "destructive",
    });
  };

  const handleForceReset = async () => {
    const success = await forceSessionReset();
    
    toast({
      title: success ? "Session Reset Complete" : "Reset Failed",
      description: success ? "Please sign in again" : "Could not reset session",
      variant: success ? "default" : "destructive",
    });
    
    if (success) {
      // Reload page after reset
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const handleMonitorJWT = () => {
    validateJWTInRequests();
    toast({
      title: "JWT Monitoring Active",
      description: "Check console for 30 seconds of request monitoring",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Authentication Token Debugger</CardTitle>
        <CardDescription>
          Debug JWT token issues and session synchronization problems
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={handleDebugTokens}
          variant="outline"
          className="w-full"
        >
          Debug Auth Tokens
        </Button>
        
        <Button 
          onClick={handleMonitorJWT}
          variant="outline"
          className="w-full"
        >
          Monitor JWT in Requests
        </Button>
        
        <Button 
          onClick={handleForceReset}
          variant="destructive"
          className="w-full"
        >
          Force Session Reset
        </Button>
        
        <p className="text-sm text-muted-foreground">
          Use "Debug Auth Tokens" first to identify issues. Check browser console for detailed output.
        </p>
      </CardContent>
    </Card>
  );
};