import React, { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export const AdminPersonalLogToggle = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSetting();
  }, []);

  const loadSetting = async () => {
    try {
      setIsLoading(true);
      const { data } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'admin_personal_log_enabled')
        .single();

      setIsEnabled(data?.setting_value === 'true');
    } catch (error) {
      // Default to true if setting doesn't exist
      setIsEnabled(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (enabled: boolean) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('shared_settings')
        .upsert({
          setting_key: 'admin_personal_log_enabled',
          setting_value: enabled.toString()
        });

      if (error) throw error;

      setIsEnabled(enabled);
      toast({
        title: "Setting updated",
        description: `Admin personal log ${enabled ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Error updating admin personal log setting:', error);
      toast({
        title: "Error updating setting",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Admin Personal Log Display
          {(isLoading || isSaving) && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
        </CardTitle>
        <CardDescription>
          Toggle the visibility of admin personal log interface in fasting timelines
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <Switch
            id="admin-personal-log-toggle"
            checked={isEnabled}
            onCheckedChange={handleToggle}
            disabled={isLoading || isSaving}
          />
          <label 
            htmlFor="admin-personal-log-toggle" 
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {isEnabled ? 'Enabled' : 'Disabled'}
          </label>
        </div>
      </CardContent>
    </Card>
  );
};