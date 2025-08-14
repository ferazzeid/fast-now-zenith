import { AdminSubnav } from "@/components/AdminSubnav";
import { usePageSEO } from "@/hooks/usePageSEO";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminRoleTester } from "@/components/AdminRoleTester";
import { AdminAnimationSettings } from "@/components/AdminAnimationSettings";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useConnectionStore } from "@/stores/connectionStore";
import { Info, Wifi, RefreshCw, Globe, WifiOff, Eye } from "lucide-react";
import { OfflineScreen } from "@/components/OfflineScreen";
import { NetworkErrorBoundary } from "@/components/NetworkErrorBoundary";
import { TestErrorTrigger } from "@/components/TestErrorTrigger";
import { RealisticAppPreview } from "@/components/RealisticAppPreview";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

export default function AdminDev() {
  const { isOnline, lastChecked, isTestingConnection, testConnection } = useConnectionStore();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [offlineTestMode, setOfflineTestMode] = useState(false);
  const [previewMode, setPreviewMode] = useState<'banner' | 'fullscreen' | 'error' | null>(null);
  const [networkSpeed, setNetworkSpeed] = useState<'normal' | 'slow' | 'offline'>('normal');
  
  usePageSEO({
    title: "Admin Dev",
    description: "Developer tools and role testing.",
    canonicalPath: "/admin/dev",
  });

  const handleTestConnection = async () => {
    await testConnection();
  };

  const handleReloadApp = () => {
    window.location.reload();
  };

  const handleSlowNetwork = () => {
    setNetworkSpeed('slow');
    toast({
      title: "Slow Network Simulation",
      description: "Network requests will be delayed to simulate poor connectivity",
    });
    // Reset after 10 seconds
    setTimeout(() => {
      setNetworkSpeed('normal');
      toast({
        title: "Network Restored",
        description: "Network simulation returned to normal",
      });
    }, 10000);
  };

  const handleRecoveryTest = () => {
    toast({
      title: "Recovery Test Started",
      description: "Simulating offline → online recovery flow",
    });
    // Simulate recovery sequence
    setTimeout(() => {
      toast({
        title: "Recovery Complete",
        description: "All pending data has been synced successfully",
      });
    }, 3000);
  };

  const handleBlockingTest = () => {
    toast({
      title: "Blocking Action Simulated",
      description: "This action would be blocked when offline",
      variant: "destructive"
    });
  };

  return (
    <AdminProtectedRoute>
      <main className={`container mx-auto ${isMobile ? 'p-4' : 'p-6'} space-y-6 overflow-x-hidden bg-background min-h-[calc(100vh-80px)]`} role="main">
        <h1 className="sr-only">Admin Dev</h1>
        <AdminSubnav />

        <section aria-label="Role Testing" className="space-y-4">
          <h2 className="text-xl font-semibold">Role Testing</h2>
          
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Test how the app behaves for different user roles. Admin dashboard access remains available regardless of test role.
            </AlertDescription>
          </Alert>

          <AdminRoleTester />
        </section>

        <section aria-label="Animation Settings" className="space-y-4">
          <h2 className="text-xl font-semibold">Animation Settings</h2>
          <AdminAnimationSettings />
        </section>

        <section aria-label="Connection Debug" className="space-y-4">
          <h2 className="text-xl font-semibold">Connection Debug</h2>
          
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Wifi className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Network Status</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm">
                      Status: {isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  Last checked: {new Date(lastChecked).toLocaleTimeString()}
                </div>
                
                <div className="text-xs text-muted-foreground">
                  Navigator online: {typeof navigator !== 'undefined' ? navigator.onLine.toString() : 'undefined'}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleTestConnection}
                    variant="outline"
                    size="sm"
                    disabled={isTestingConnection}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${isTestingConnection ? 'animate-spin' : ''}`} />
                    {isTestingConnection ? 'Testing...' : 'Test Connection'}
                  </Button>
                  
                  <Button
                    onClick={handleReloadApp}
                    variant="outline"
                    size="sm"
                  >
                    Reload App
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </section>

        <section aria-label="Offline Testing" className="space-y-4">
          <h2 className="text-xl font-semibold">Offline Testing</h2>
          
          <Alert>
            <Globe className="h-4 w-4" />
            <AlertDescription>
              Test offline screens and user experience without actually going offline. Preview how the app handles network issues.
            </AlertDescription>
          </Alert>

          <div className={`grid grid-cols-1 ${isMobile ? '' : 'xl:grid-cols-2'} gap-6`}>
            {/* Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <WifiOff className="w-5 h-5" />
                  Offline Simulation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Test Mode</span>
                    <div className={`w-2 h-2 rounded-full ${offlineTestMode ? 'bg-orange-500' : 'bg-green-500'}`} />
                  </div>
                  
                  <Button
                    onClick={() => setOfflineTestMode(!offlineTestMode)}
                    variant={offlineTestMode ? "destructive" : "outline"}
                    className="w-full"
                  >
                    {offlineTestMode ? 'Stop Offline Test' : 'Start Offline Test'}
                  </Button>
                </div>

                <div className="space-y-2">
                  <span className="text-sm font-medium">Preview Modes</span>
                  <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
                    <Button
                      onClick={() => setPreviewMode(previewMode === 'banner' ? null : 'banner')}
                      variant={previewMode === 'banner' ? "default" : "outline"}
                      size="sm"
                    >
                      Banner
                    </Button>
                    <Button
                      onClick={() => setPreviewMode(previewMode === 'fullscreen' ? null : 'fullscreen')}
                      variant={previewMode === 'fullscreen' ? "default" : "outline"}
                      size="sm"
                    >
                      Full Screen
                    </Button>
                    <Button
                      onClick={() => setPreviewMode(previewMode === 'error' ? null : 'error')}
                      variant={previewMode === 'error' ? "default" : "outline"}
                      size="sm"
                    >
                      Error Boundary
                    </Button>
                    <Button
                      onClick={() => setPreviewMode(null)}
                      variant="ghost"
                      size="sm"
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                <div className="pt-2 text-xs text-muted-foreground">
                  <p>• Banner: Shows inline offline notification</p>
                  <p>• Full Screen: Shows blocking offline screen</p>
                  <p>• Error Boundary: Shows network error recovery</p>
                </div>
              </CardContent>
            </Card>

            {/* Preview Area */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Preview Area
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 min-h-[300px] bg-muted/30 relative overflow-hidden">
                  {previewMode === 'banner' && (
                    <RealisticAppPreview>
                      <OfflineScreen forceShow={true} className="w-full" />
                    </RealisticAppPreview>
                  )}
                  
                  {previewMode === 'fullscreen' && (
                    <div className="absolute inset-0 rounded-lg overflow-hidden">
                      <OfflineScreen forceShow={true} showFullScreen={true} />
                    </div>
                  )}
                  
                  {previewMode === 'error' && (
                    <TestErrorTrigger />
                  )}
                  
                  {!previewMode && (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center">
                        <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Select a preview mode to see offline screens</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Test Scenarios */}
          <Card>
            <CardHeader>
              <CardTitle>Test Scenarios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`grid grid-cols-1 ${isMobile ? '' : 'lg:grid-cols-2 xl:grid-cols-3'} gap-4`}>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Gradual Degradation</h4>
                  <p className="text-sm text-muted-foreground mb-3">Test how the app behaves when going from online to offline</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={handleSlowNetwork}
                    disabled={networkSpeed === 'slow'}
                  >
                    {networkSpeed === 'slow' ? 'Simulating...' : 'Simulate Slow Network'}
                  </Button>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Recovery Flow</h4>
                  <p className="text-sm text-muted-foreground mb-3">Test reconnection and data sync after being offline</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={handleRecoveryTest}
                  >
                    Test Recovery
                  </Button>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Critical Actions</h4>
                  <p className="text-sm text-muted-foreground mb-3">Test blocking offline actions that require connectivity</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={handleBlockingTest}
                  >
                    Test Blocking
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

      </main>
    </AdminProtectedRoute>
  );
}
