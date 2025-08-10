import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Smartphone, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { validatePWAManifest, forcePWARefresh } from '@/utils/pwaCache';

export const PWATestPanel: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastValidation, setLastValidation] = useState<any>(null);
  const { toast } = useToast();

  const testPWAManifest = async () => {
    setTesting(true);
    try {
      const result = await validatePWAManifest();
      setLastValidation(result);
      
      if (result.isValid) {
        toast({
          title: "✅ PWA Manifest Valid",
          description: `App name: ${result.manifest?.name || 'N/A'}`,
        });
      } else {
        toast({
          title: "⚠️ PWA Manifest Issues",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to test PWA manifest",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const refreshPWACache = async () => {
    setRefreshing(true);
    try {
      const success = await forcePWARefresh();
      
      if (success) {
        toast({
          title: "✅ PWA Cache Refreshed",
          description: "Try 'Add to Home Screen' again - it should show updated info!",
        });
      } else {
        toast({
          title: "⚠️ Refresh Completed",
          description: "Cache refresh completed but some issues occurred. Check console for details.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh PWA cache",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Smartphone className="w-5 h-5" />
          PWA Testing & Validation
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Test and refresh your PWA manifest after making changes
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={testPWAManifest} 
            disabled={testing}
            variant="outline"
            className="flex items-center gap-2"
          >
            {testing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            Test Manifest
          </Button>
          
          <Button 
            onClick={refreshPWACache} 
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            {refreshing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Force Refresh
          </Button>
        </div>

        {lastValidation && (
          <div className="p-4 border border-border rounded-lg bg-muted/20">
            <div className="flex items-center gap-2 mb-2">
              {lastValidation.isValid ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )}
              <span className="font-medium">
                Manifest Status: 
                <Badge variant={lastValidation.isValid ? "default" : "destructive"} className="ml-2">
                  {lastValidation.isValid ? "Valid" : "Invalid"}
                </Badge>
              </span>
            </div>
            
            {lastValidation.manifest && (
              <div className="text-sm space-y-1">
                <p><strong>Name:</strong> {lastValidation.manifest.name}</p>
                <p><strong>Short Name:</strong> {lastValidation.manifest.short_name}</p>
                <p><strong>Icons:</strong> {lastValidation.manifest.icons?.length || 0} defined</p>
              </div>
            )}
            
            {lastValidation.error && (
              <p className="text-sm text-red-600 mt-2">{lastValidation.error}</p>
            )}
          </div>
        )}

        <div className="p-4 border border-border rounded-lg bg-blue-50 dark:bg-blue-950/20">
          <h4 className="font-medium mb-2">Testing Instructions:</h4>
          <ol className="text-sm space-y-1 list-decimal list-inside">
            <li>After changing app settings, click "Force Refresh"</li>
            <li>Wait 30 seconds for cache to clear</li>
            <li>On mobile: Try "Add to Home Screen" in browser menu</li>
            <li>Check if new app name and icon appear correctly</li>
            <li>If issues persist, close and reopen browser completely</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};