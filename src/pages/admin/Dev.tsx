import { AdminSubnav } from "@/components/AdminSubnav";
import { usePageSEO } from "@/hooks/usePageSEO";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminRoleTester } from "@/components/AdminRoleTester";
import { AdminAnimationSettings } from "@/components/AdminAnimationSettings";
import { PremiumAccessAuditReport } from "@/components/PremiumAccessAuditReport";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useConnectionStore } from "@/stores/connectionStore";
import { Info, Wifi, RefreshCw, Globe, WifiOff, Eye } from "lucide-react";
import { OfflineScreen } from "@/components/OfflineScreen";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { AdminHealthCheck } from "@/components/AdminHealthCheck";

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
      <AdminHealthCheck>
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

          <section aria-label="Premium Access Audit" className="space-y-4">
            <h2 className="text-xl font-semibold">Premium Access Audit</h2>
            <PremiumAccessAuditReport />
          </section>

          <section aria-label="Animation Settings" className="space-y-4 pb-24">
            <h2 className="text-xl font-semibold">Animation Settings</h2>
            <AdminAnimationSettings />
            <div className="h-8" />
          </section>
        </main>
      </AdminHealthCheck>
    </AdminProtectedRoute>
  );
}
