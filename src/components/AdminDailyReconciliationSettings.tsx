import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "lucide-react";

export const AdminDailyReconciliationSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for current setting
  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-settings', 'daily_reconciliation_enabled'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'daily_reconciliation_enabled')
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
          setting_key: 'daily_reconciliation_enabled',
          setting_value: enabled.toString()
        });
      
      if (error) throw error;
      return enabled;
    },
    onSuccess: (enabled) => {
      queryClient.setQueryData(['admin-settings', 'daily_reconciliation_enabled'], enabled);
      toast({
        title: "Settings updated",
        description: `Daily Reconciliation ${enabled ? 'enabled' : 'disabled'} successfully.`
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update daily reconciliation settings.",
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
          <Calendar className="w-5 h-5" />
          Daily Reconciliation System
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="reconciliation-enabled">Enable Daily Reconciliation</Label>
            <p className="text-sm text-muted-foreground">
              Experimental feature for daily summary review and day closure functionality
            </p>
          </div>
          <Switch
            id="reconciliation-enabled"
            checked={settings || false}
            onCheckedChange={handleToggle}
            disabled={isLoading || updateSetting.isPending}
          />
        </div>
        
        {settings && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-foreground">
              <strong>⚠️ Experimental Feature:</strong>
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>• Daily activity summary and review screen</li>
              <li>• Manual day closure and data locking</li>
              <li>• Historical trend analysis (7, 30, 90 days)</li>
              <li>• Admin-only access during development</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};