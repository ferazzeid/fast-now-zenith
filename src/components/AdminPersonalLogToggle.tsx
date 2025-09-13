import React, { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const AdminPersonalLogToggle = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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
        description: `Personal log display ${enabled ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Error updating personal log setting:', error);
      toast({
        title: "Error updating setting",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  if (isLoading) return null;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <Label htmlFor="personal-log-display" className="text-sm font-medium">
            Personal Log Display
          </Label>
          <Switch
            id="personal-log-display"
            checked={isEnabled}
            onCheckedChange={handleToggle}
          />
        </div>
      </CardContent>
    </Card>
  );
};