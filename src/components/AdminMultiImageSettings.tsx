import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { HelpCircle } from 'lucide-react';

export const AdminMultiImageSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: setting, isLoading } = useQuery({
    queryKey: ['admin-settings', 'enable_multi_image_capture'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'enable_multi_image_capture')
        .maybeSingle();
      
      if (error) throw error;
      return data?.setting_value === 'true';
    },
  });

  const updateSettingMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { error } = await supabase
        .from('shared_settings')
        .upsert({
          setting_key: 'enable_multi_image_capture',
          setting_value: enabled.toString(),
          setting_description: 'Enable multi-image capture for food analysis (allows users to take 2 photos before analysis)'
        });
      
      if (error) throw error;
    },
    onSuccess: (_, enabled) => {
      queryClient.setQueryData(['admin-settings', 'enable_multi_image_capture'], enabled);
      toast({
        title: "Settings updated",
        description: `Multi-image capture ${enabled ? 'enabled' : 'disabled'}`,
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Could not update multi-image capture setting",
        variant: "destructive",
      });
    },
  });

  const handleToggle = (checked: boolean) => {
    updateSettingMutation.mutate(checked);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-muted animate-pulse rounded" />
          <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
        </CardHeader>
        <CardContent>
          <div className="h-10 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Multi-Image Food Analysis
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  When enabled, users can capture up to 2 photos before analysis. 
                  This is especially useful for packaged foods where users can 
                  photograph both the front (product name) and back (nutrition label).
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription>
          Allow users to capture multiple images for better food recognition accuracy
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <Switch
            id="multi-image-capture"
            checked={setting || false}
            onCheckedChange={handleToggle}
            disabled={updateSettingMutation.isPending}
          />
          <Label htmlFor="multi-image-capture" className="text-sm">
            Enable multi-image capture workflow
          </Label>
        </div>
        
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>How it works:</strong> Instead of analyzing immediately after taking one photo, 
            users will see an intermediate screen where they can optionally take a second photo 
            before triggering the AI analysis. Both images are sent together for more comprehensive analysis.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};