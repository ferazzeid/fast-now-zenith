import React, { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useStandardizedLoading } from '@/hooks/useStandardizedLoading';
import { useQueryClient } from '@tanstack/react-query';

export const AdminQuoteDisplayToggle = () => {
  const [fastingQuotesEnabled, setFastingQuotesEnabled] = useState(false);
  const [walkingQuotesEnabled, setWalkingQuotesEnabled] = useState(false);
  const { isLoading, execute } = useStandardizedLoading();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    await execute(async () => {
      // Load both settings
      const [fastingResult, walkingResult] = await Promise.all([
        supabase
          .from('shared_settings')
          .select('setting_value')
          .eq('setting_key', 'fasting_quotes_display_enabled')
          .maybeSingle(),
        supabase
          .from('shared_settings')
          .select('setting_value')
          .eq('setting_key', 'walking_quotes_display_enabled')
          .maybeSingle()
      ]);

      setFastingQuotesEnabled(fastingResult.data?.setting_value === 'true');
      setWalkingQuotesEnabled(walkingResult.data?.setting_value === 'true');
    }, {
      onError: () => {
        // Default both to true if settings don't exist
        setFastingQuotesEnabled(true);
        setWalkingQuotesEnabled(true);
      }
    });
  };

  const handleFastingToggle = async (enabled: boolean) => {
    try {
      console.log('Updating fasting quotes setting to:', enabled);
      const { data, error } = await supabase
        .from('shared_settings')
        .upsert({
          setting_key: 'fasting_quotes_display_enabled',
          setting_value: enabled.toString()
        })
        .select();

      console.log('Upsert result:', { data, error });

      if (error) throw error;

      setFastingQuotesEnabled(enabled);
      
      // Force refresh of quote display settings across the app
      queryClient.invalidateQueries({ queryKey: ['quote-display-settings'] });
      
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
      console.log('Updating walking quotes setting to:', enabled);
      const { data, error } = await supabase
        .from('shared_settings')
        .upsert({
          setting_key: 'walking_quotes_display_enabled',
          setting_value: enabled.toString()
        })
        .select();

      console.log('Upsert result:', { data, error });

      if (error) throw error;

      setWalkingQuotesEnabled(enabled);
      
      // Force refresh of quote display settings across the app
      queryClient.invalidateQueries({ queryKey: ['quote-display-settings'] });
      
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