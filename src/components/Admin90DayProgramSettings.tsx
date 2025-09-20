import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Target, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

export const Admin90DayProgramSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for current setting
  const { data: settings, isLoading } = useQuery({
    queryKey: ['90-day-program-enabled'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', '90_day_program_enabled')
        .maybeSingle();
      
      if (error) throw error;
      return data?.setting_value === 'true';
    },
    staleTime: 10 * 1000,
  });

  // Mutation to update setting
  const updateSetting = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { error } = await supabase
        .from('shared_settings')
        .upsert({
          setting_key: '90_day_program_enabled',
          setting_value: enabled.toString()
        });
      
      if (error) throw error;
      return enabled;
    },
    onSuccess: (enabled) => {
      queryClient.setQueryData(['90-day-program-enabled'], enabled);
      queryClient.setQueryData(['admin-settings', '90_day_program_enabled'], enabled);
      
      queryClient.invalidateQueries({ queryKey: ['90-day-program-enabled'] });
      queryClient.invalidateQueries({ queryKey: ['admin-settings', '90_day_program_enabled'] });
      
      toast({
        title: enabled ? "90-Day Program Enabled" : "90-Day Program Disabled",
        description: enabled 
          ? "Users can now access the 90-Day Program Timeline from their Goals page." 
          : "The 90-Day Program feature is now hidden from users.",
      });
    },
    onError: (error) => {
      console.error('Error updating 90-day program setting:', error);
      toast({
        title: "Error",
        description: "Failed to update 90-day program setting. Please try again.",
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
          <Target className="w-5 h-5" />
          90-Day Program Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="program-enabled">Enable 90-Day Program</Label>
            <p className="text-sm text-muted-foreground">
              Structured 90-day timeline with daily tracking, projections, and milestones
            </p>
          </div>
          <Switch
            id="program-enabled"
            checked={settings || false}
            onCheckedChange={handleToggle}
            disabled={isLoading || updateSetting.isPending}
          />
        </div>
        
        {settings && (
          <>
            <div className="pt-3 border-t border-border/50">
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link to="/90-day-program" className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  View 90-Day Program Timeline
                </Link>
              </Button>
            </div>
            
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-foreground">
                <strong>📈 Program Features:</strong>
              </p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>• 90-day vertical timeline with daily progress nodes</li>
                <li>• Optional 3-day initiation fast and 60-hour extended fast</li>
                <li>• Daily caloric deficit tracking and weight projections</li>
                <li>• Real vs projected outcomes comparison</li>
                <li>• Automatic day closure and progress locking</li>
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};