import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

export const AdminDailyReconciliationSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for current setting - using consistent key with reconciliation page
  const { data: settings, isLoading } = useQuery({
    queryKey: ['daily-reconciliation-enabled'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'daily_reconciliation_enabled')
        .maybeSingle();
      
      if (error) throw error;
      return data?.setting_value === 'true';
    },
    staleTime: 10 * 1000, // Shorter cache time for faster updates
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
      // Update multiple query keys to ensure consistency
      queryClient.setQueryData(['daily-reconciliation-enabled'], enabled);
      queryClient.setQueryData(['admin-settings', 'daily_reconciliation_enabled'], enabled);
      
      // Invalidate both query keys to force refresh
      queryClient.invalidateQueries({ queryKey: ['daily-reconciliation-enabled'] });
      queryClient.invalidateQueries({ queryKey: ['admin-settings', 'daily_reconciliation_enabled'] });
      
      toast({
        title: enabled ? "Daily Reconciliation Enabled" : "Daily Reconciliation Disabled",
        description: enabled 
          ? "Experimental feature activated. You can now access the reconciliation dashboard." 
          : "Feature disabled. Access to reconciliation dashboard is now restricted.",
      });
    },
    onError: (error) => {
      console.error('Error updating daily reconciliation setting:', error);
      toast({
        title: "Error",
        description: "Failed to update reconciliation setting. Please try again.",
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
          <>
            <div className="pt-3 border-t border-border/50">
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link to="/admin/reconciliation" className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Open Reconciliation Dashboard
                </Link>
              </Button>
            </div>
            
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
          </>
        )}
      </CardContent>
    </Card>
  );
};