import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Camera, CheckCircle } from 'lucide-react';
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
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Photo Analysis Workflow
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
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Photo Analysis Workflow
        </CardTitle>
        <CardDescription>
          Configure how food photo analysis works - either immediate adding or confirmation step
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between space-x-4">
          <div className="flex-1">
            <Label htmlFor="confirmation-workflow" className="text-base font-medium">
              Confirmation Workflow
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              {useConfirmation 
                ? "Users can review and edit food details before adding (like voice input)"
                : "Foods are added immediately after AI analysis (faster workflow)"
              }
            </p>
          </div>
          <Switch
            id="confirmation-workflow"
            checked={useConfirmation}
            onCheckedChange={handleToggleConfirmation}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`p-4 border rounded-lg ${useConfirmation ? 'border-primary bg-primary/5' : 'border-muted'}`}>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">Confirmation Mode</span>
              {useConfirmation && <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">ACTIVE</span>}
            </div>
            <p className="text-sm text-muted-foreground">
              Shows confirmation dialog with food details that users can edit before adding
            </p>
          </div>
          
          <div className={`p-4 border rounded-lg ${!useConfirmation ? 'border-primary bg-primary/5' : 'border-muted'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Camera className="w-4 h-4" />
              <span className="font-medium">Quick Mode</span>
              {!useConfirmation && <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">ACTIVE</span>}
            </div>
            <p className="text-sm text-muted-foreground">
              Immediately adds analyzed food to the list (users can edit afterwards)
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};