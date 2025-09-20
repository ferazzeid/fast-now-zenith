import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const AdminImageCaptureSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for multi-image setting (using shared_settings table like AdminMultiImageSettings)
  const { data: multiImageEnabled = false, isLoading } = useQuery({
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

  // Update multi-image setting
  const handleToggleMultiImage = async (enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('shared_settings')
        .upsert({
          setting_key: 'enable_multi_image_capture',
          setting_value: enabled.toString(),
          setting_description: 'Enable multi-image capture for food analysis (allows users to take multiple photos before analysis)'
        });

      if (error) throw error;

      // Update local cache
      queryClient.setQueryData(['admin-settings', 'enable_multi_image_capture'], enabled);
      
      // Also invalidate the hook that components use
      queryClient.invalidateQueries({ queryKey: ['settings', 'enable_multi_image_capture'] });

      toast({
        title: "Settings Updated",
        description: `Image capture mode set to ${enabled ? 'Multi-Image' : 'Single Image'}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not update image capture setting",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Image Capture Mode</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-16 bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Image Capture Mode</CardTitle>
        <CardDescription>
          Control whether users can capture single or multiple images for food analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="flex items-center justify-between space-x-4">
            <div className="flex-1">
              <Label htmlFor="image-capture-mode" className="text-base font-medium">
                Multi-Image Capture
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                {multiImageEnabled 
                  ? "Users can capture multiple images before analysis" 
                  : "Users capture one image at a time (simpler workflow)"
                }
              </p>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Switch
                  id="image-capture-mode"
                  checked={multiImageEnabled}
                  onCheckedChange={handleToggleMultiImage}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {multiImageEnabled 
                    ? "ON: Multi-image workflow - users can take several photos before analysis" 
                    : "OFF: Single image workflow - simpler, one photo at a time"
                  }
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
};