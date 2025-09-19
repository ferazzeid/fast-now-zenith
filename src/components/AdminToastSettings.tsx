import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useBaseQuery } from "@/hooks/useBaseQuery";
import { Loader2, MessageSquare, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const AdminToastSettings = () => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [tempDuration, setTempDuration] = useState<string>("");

  // Fetch current setting
  const { data: currentDuration, isLoading, refetch } = useBaseQuery(
    ['toast-duration-setting'],
    async () => {
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'toast_duration_seconds')
        .maybeSingle();

      if (error) {
        console.warn('Could not fetch toast duration setting:', error);
        return 5; // Default to 5 seconds
      }

      const duration = parseInt(data?.setting_value || '5');
      return isNaN(duration) ? 5 : duration;
    },
    {
      staleTime: 30 * 1000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  React.useEffect(() => {
    if (currentDuration !== undefined && tempDuration === "") {
      setTempDuration(currentDuration.toString());
    }
  }, [currentDuration, tempDuration]);

  const handleSave = async () => {
    const duration = parseInt(tempDuration);
    
    if (isNaN(duration) || duration < 1 || duration > 30) {
      toast({
        title: "Invalid Duration",
        description: "Toast duration must be between 1 and 30 seconds.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('shared_settings')
        .upsert({
          setting_key: 'toast_duration_seconds',
          setting_value: duration.toString()
        });

      if (error) throw error;

      await refetch();
      
      toast({
        title: "Toast Settings Updated",
        description: `Toast messages will now display for ${duration} second${duration === 1 ? '' : 's'}.`,
      });
    } catch (error) {
      console.error('Error updating toast duration setting:', error);
      toast({
        title: "Error",
        description: "Failed to update toast duration. Please try again.",
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
            <MessageSquare className="h-5 w-5" />
            Toast Message Settings
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
          <MessageSquare className="h-5 w-5" />
          Toast Message Settings
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <p>
                Control how long notification messages are displayed to users.
                Shorter durations prevent messages from cluttering the interface.
              </p>
            </TooltipContent>
          </Tooltip>
        </CardTitle>
        <CardDescription>
          Configure the display duration for toast notification messages.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="toast-duration" className="text-sm font-medium">
            Toast Duration (seconds)
          </Label>
          <div className="flex items-center gap-3">
            <Input
              id="toast-duration"
              type="number"
              min="1"
              max="30"
              value={tempDuration}
              onChange={(e) => setTempDuration(e.target.value)}
              className="w-24"
              disabled={isSaving}
            />
            <Button 
              onClick={handleSave}
              disabled={isSaving || tempDuration === currentDuration?.toString()}
              size="sm"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Current setting: {currentDuration} second{currentDuration === 1 ? '' : 's'} 
            (Range: 1-30 seconds)
          </p>
        </div>

        <div className="bg-muted/50 p-3 rounded-lg border border-border/50">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Shorter durations (3-5 seconds) are recommended to prevent 
            messages from staying visible too long and cluttering the interface.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};