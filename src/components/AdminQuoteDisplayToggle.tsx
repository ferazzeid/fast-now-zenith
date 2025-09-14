import React, { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const AdminQuoteDisplayToggle = () => {
  const [fastingQuotesEnabled, setFastingQuotesEnabled] = useState(false);
  const [walkingQuotesEnabled, setWalkingQuotesEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      
      // Load both settings
      const [fastingResult, walkingResult] = await Promise.all([
        supabase
          .from('shared_settings')
          .select('setting_value')
          .eq('setting_key', 'fasting_quotes_display_enabled')
          .single(),
        supabase
          .from('shared_settings')
          .select('setting_value')
          .eq('setting_key', 'walking_quotes_display_enabled')
          .single()
      ]);

      setFastingQuotesEnabled(fastingResult.data?.setting_value === 'true');
      setWalkingQuotesEnabled(walkingResult.data?.setting_value === 'true');
    } catch (error) {
      // Default both to true if settings don't exist
      setFastingQuotesEnabled(true);
      setWalkingQuotesEnabled(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFastingToggle = async (enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('shared_settings')
        .upsert({
          setting_key: 'fasting_quotes_display_enabled',
          setting_value: enabled.toString()
        });

      if (error) throw error;

      setFastingQuotesEnabled(enabled);
      toast({
        title: "Setting updated",
        description: `Fasting quotes ${enabled ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Error updating fasting quotes setting:', error);
      toast({
        title: "Error updating setting",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleWalkingToggle = async (enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('shared_settings')
        .upsert({
          setting_key: 'walking_quotes_display_enabled',
          setting_value: enabled.toString()
        });

      if (error) throw error;

      setWalkingQuotesEnabled(enabled);
      toast({
        title: "Setting updated",
        description: `Walking quotes ${enabled ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Error updating walking quotes setting:', error);
      toast({
        title: "Error updating setting",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  if (isLoading) return null;

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="fasting-quotes-display" className="text-sm font-medium">
              Fasting Quotes Display
            </Label>
            <Switch
              id="fasting-quotes-display"
              checked={fastingQuotesEnabled}
              onCheckedChange={handleFastingToggle}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="walking-quotes-display" className="text-sm font-medium">
              Walking Quotes Display
            </Label>
            <Switch
              id="walking-quotes-display"
              checked={walkingQuotesEnabled}
              onCheckedChange={handleWalkingToggle}
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
};