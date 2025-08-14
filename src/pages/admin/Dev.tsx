import { AdminSubnav } from "@/components/AdminSubnav";
import { usePageSEO } from "@/hooks/usePageSEO";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminRoleTester } from "@/components/AdminRoleTester";
import { AdminAnimationSettings } from "@/components/AdminAnimationSettings";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useConnectionStore } from "@/stores/connectionStore";
import { Info, Wifi, RefreshCw } from "lucide-react";

export default function AdminDev() {
  const { isOnline, lastChecked, isTestingConnection, testConnection } = useConnectionStore();
  
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

  return (
    <AdminProtectedRoute>
      <main className="container mx-auto p-6 space-y-8 overflow-x-hidden bg-background min-h-[calc(100vh-80px)]" role="main">
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

      </main>
    </AdminProtectedRoute>
  );
}
