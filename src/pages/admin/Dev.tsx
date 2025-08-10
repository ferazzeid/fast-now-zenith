import { AdminSubnav } from "@/components/AdminSubnav";
import { usePageSEO } from "@/hooks/usePageSEO";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";
import { BarcodeScannerExperiment } from "@/components/dev/BarcodeScannerExperiment";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAIImageGeneration } from "@/hooks/useAIImageGeneration";

function AIImageToggleSettings() {
  const { aiImageEnabled, loading, updateAIImageSetting } = useAIImageGeneration();
  const { toast } = useToast();

  const handleToggle = async (checked: boolean) => {
    const result = await updateAIImageSetting(checked);
    if (result.success) {
      toast({
        title: checked ? 'AI Image Generation Enabled' : 'AI Image Generation Disabled',
        description: checked 
          ? 'AI image generation features are now visible to users.'
          : 'AI image generation features are now hidden from users.'
      });
    } else {
      toast({
        title: 'Error',
        description: 'Failed to update AI image generation setting',
        variant: 'destructive'
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Experimental Features</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-sm font-medium">Enable AI Image Generation</Label>
            <p className="text-xs text-muted-foreground">
              Show or hide AI image generation features across the app (experimental)
            </p>
          </div>
          <Switch
            checked={aiImageEnabled}
            onCheckedChange={handleToggle}
            disabled={loading}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDev() {
  usePageSEO({
    title: "Admin Dev",
    description: "Developer tools and role testing.",
    canonicalPath: "/admin/dev",
  });

  return (
    <AdminProtectedRoute>
      <main className="container mx-auto p-6 space-y-8 overflow-x-hidden bg-background min-h-[calc(100vh-80px)]" role="main">
        <h1 className="sr-only">Admin Dev</h1>
        <AdminSubnav />

        <section aria-label="Experimental features">
          <AIImageToggleSettings />
        </section>

        <section aria-label="Barcode Scanner Experiment" className="space-y-4 pb-24">
          <h2 className="text-xl font-semibold">Barcode Scanner</h2>
          <BarcodeScannerExperiment />
        </section>

      </main>
    </AdminProtectedRoute>
  );
}
