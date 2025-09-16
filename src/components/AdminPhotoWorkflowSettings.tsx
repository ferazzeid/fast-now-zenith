import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';

const STORAGE_KEY = 'admin_photo_workflow_confirmation';

export const AdminPhotoWorkflowSettings = () => {
  const { toast } = useToast();
  const [useConfirmation, setUseConfirmation] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Load setting from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setUseConfirmation(stored === 'true');
    }
    setIsLoading(false);
  }, []);

  const handleToggleConfirmation = (checked: boolean) => {
    setUseConfirmation(checked);
    localStorage.setItem(STORAGE_KEY, checked.toString());
    toast({
      title: "Settings Updated",
      description: `Photo analysis workflow set to ${checked ? 'Confirmation Mode' : 'Quick Mode'}.`,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            Photo AI Workflow
          </CardTitle>
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
        <CardTitle>
          Photo AI Workflow
        </CardTitle>
        <CardDescription>
          Configure how food photo analysis works - either immediate adding or confirmation step
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="flex items-center justify-between space-x-4">
            <div className="flex-1">
              <Label htmlFor="photo-ai-workflow" className="text-base font-medium">
                Photo AI Workflow
              </Label>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Switch
                  id="photo-ai-workflow"
                  checked={useConfirmation}
                  onCheckedChange={handleToggleConfirmation}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {useConfirmation 
                    ? "ON: Shows confirmation dialog for review/edit before adding" 
                    : "OFF: Immediately adds analyzed food (quick mode)"
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