import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Settings } from "lucide-react";

export const AdminIntermittentFastingSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for current setting
  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-settings', 'intermittent_fasting_enabled'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'intermittent_fasting_enabled')
        .maybeSingle();
      
      if (error) throw error;
      return data?.setting_value === 'true';
    },
  });

  // Mutation to update setting
  const updateSetting = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { error } = await supabase
        .from('shared_settings')
        .upsert({
          setting_key: 'intermittent_fasting_enabled',
          setting_value: enabled.toString()
        });
      
      if (error) throw error;
      return enabled;
    },
    onSuccess: (enabled) => {
      queryClient.setQueryData(['admin-settings', 'intermittent_fasting_enabled'], enabled);
      toast({
        title: "Settings updated",
        description: `Intermittent Fasting ${enabled ? 'enabled' : 'disabled'} successfully.`
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update intermittent fasting settings.",
        variant: "destructive"
      });
    }
  });

  const handleToggle = (checked: boolean) => {
    updateSetting.mutate(checked);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Intermittent Fasting Mode
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="if-enabled">Enable Intermittent Fasting</Label>
            <p className="text-sm text-muted-foreground">
              Allow users to switch between Extended Fasting and Intermittent Fasting modes
            </p>
          </div>
          <Switch
            id="if-enabled"
            checked={settings || false}
            onCheckedChange={handleToggle}
            disabled={isLoading || updateSetting.isPending}
          />
        </div>
        
        {settings && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-foreground">
              <strong>Intermittent Fasting features:</strong>
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>• 16:8, OMAD, and custom IF presets</li>
              <li>• Dual timers for fasting and eating windows</li>
              <li>• Daily IF session tracking and streaks</li>
              <li>• Manual start/stop for each window</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};