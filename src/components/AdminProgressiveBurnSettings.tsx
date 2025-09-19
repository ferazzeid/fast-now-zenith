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

      await refetch();
      
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <p>
                When enabled, TDEE calories are distributed throughout the day based on time,
                creating a growing deficit instead of a shrinking one. This provides better 
                psychological feedback and more realistic energy expenditure representation.
              </p>
            </TooltipContent>
          </Tooltip>
        </CardTitle>
        <CardDescription>
          Distribute daily calorie burn progressively throughout the day instead of showing the full amount from midnight.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="progressive-burn-toggle" className="text-sm font-medium">
              Enable Progressive Daily Burn
            </Label>
            <p className="text-xs text-muted-foreground">
              {isEnabled 
                ? "TDEE is distributed throughout the day (experimental feature)"
                : "TDEE is shown as full daily amount from midnight (current behavior)"
              }
            </p>
          </div>
          <Switch
            id="progressive-burn-toggle"
            checked={isEnabled || false}
            onCheckedChange={handleToggle}
            disabled={isSaving}
          />
        </div>

        {isEnabled && (
          <div className="bg-muted/50 p-4 rounded-lg border border-border/50">
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-primary mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium">How Progressive Burn Works:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• At 6 AM: 25% of TDEE is "earned"</li>
                  <li>• At 12 PM: 50% of TDEE is "earned"</li>
                  <li>• At 6 PM: 75% of TDEE is "earned"</li>
                  <li>• At midnight: 100% of TDEE is "earned"</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                  This creates a growing deficit throughout the day instead of a shrinking one,
                  providing better psychological feedback for users.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <strong>Note:</strong> This is an experimental feature. Monitor user engagement 
          and feedback before potentially making it available to users as a preference.
        </div>
      </CardContent>
    </Card>
  );
};