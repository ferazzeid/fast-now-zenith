import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useBaseQuery } from "@/hooks/useBaseQuery";
import { Loader2, TrendingUp, Clock, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const AdminProgressiveBurnSettings = () => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Fetch current setting
  const { data: isEnabled, isLoading, refetch } = useBaseQuery(
    ['progressive-burn-setting'],
    async () => {
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'progressive_daily_burn_enabled')
        .maybeSingle();

      if (error) {
        console.warn('Could not fetch progressive burn setting:', error);
        return false;
      }

      return data?.setting_value === 'true';
    },
    {
      staleTime: 30 * 1000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  const handleToggle = async (enabled: boolean) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('shared_settings')
        .upsert({
          setting_key: 'progressive_daily_burn_enabled',
          setting_value: enabled.toString()
        });

      if (error) throw error;

      // Force immediate refetch to update the toggle state
      await refetch();
      
      // Also invalidate related queries that might use this setting
      // This ensures the UI updates immediately
      setTimeout(() => {
        refetch();
      }, 100);
      
      toast({
        title: enabled ? "Progressive Daily Burn Enabled" : "Progressive Daily Burn Disabled",
        description: enabled 
          ? "TDEE will now be distributed throughout the day instead of shown all at once." 
          : "TDEE will be shown as full daily amount from midnight.",
      });
    } catch (error) {
      console.error('Error updating progressive burn setting:', error);
      toast({
        title: "Error",
        description: "Failed to update progressive burn setting. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Progressive Daily Burn
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Progressive Daily Burn
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <Label htmlFor="progressive-burn-toggle" className="text-sm font-medium">
            Enable Progressive Daily Burn
          </Label>
          <Switch
            id="progressive-burn-toggle"
            checked={isEnabled || false}
            onCheckedChange={handleToggle}
            disabled={isSaving}
          />
        </div>
      </CardContent>
    </Card>
  );
};