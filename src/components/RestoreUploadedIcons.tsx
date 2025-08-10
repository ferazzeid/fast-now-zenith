import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const RestoreUploadedIcons = () => {
  const { toast } = useToast();

  const restoreIcons = async () => {
    try {
      // Restore your uploaded custom icons based on console logs
      const updates = [
        {
          setting_key: 'app_icon_url',
          setting_value: 'https://texnkijwcygodtywgedm.supabase.co/storage/v1/object/public/website-images/brand-assets/appIcon-1754811832353.png'
        },
        {
          setting_key: 'app_logo', 
          setting_value: 'https://texnkijwcygodtywgedm.supabase.co/storage/v1/object/public/website-images/brand-assets/logo-1754811845683.png'
        }
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('shared_settings')
          .upsert(update, { onConflict: 'setting_key' });

        if (error) throw error;
      }

      toast({
        title: "Icons Restored",
        description: "Your custom uploaded icons have been restored successfully!",
      });

      // Force page reload to see changes
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error('Error restoring icons:', error);
      toast({
        title: "Error",
        description: "Failed to restore uploaded icons. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="mb-6 border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-orange-800">🔧 Restore Your Uploaded Icons</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-orange-700 mb-4">
          Your custom uploaded icons were accidentally overwritten. Click below to restore them.
        </p>
        <Button onClick={restoreIcons} className="bg-orange-600 hover:bg-orange-700">
          Restore My Custom Icons
        </Button>
      </CardContent>
    </Card>
  );
};