import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';

const QUOTE_SETTINGS_QUERY_KEY = ['quote-display-settings'];

export const AdminQuoteDisplayToggle = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch quote settings using React Query
  const { data: settings, isLoading } = useQuery({
    queryKey: QUOTE_SETTINGS_QUERY_KEY,
    queryFn: async () => {
      console.log('🔄 FETCHING quote settings from database...');
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['fasting_quotes_display_enabled', 'walking_quotes_display_enabled']);
      
      if (error) throw error;
      
      console.log('📊 DATABASE SETTINGS:', data);
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get current values
  const fastingQuotesEnabled = settings?.find(s => s.setting_key === 'fasting_quotes_display_enabled')?.setting_value === 'true';
  const walkingQuotesEnabled = settings?.find(s => s.setting_key === 'walking_quotes_display_enabled')?.setting_value === 'true';

  console.log('🎯 CURRENT TOGGLE STATES:', { fastingQuotesEnabled, walkingQuotesEnabled });

  // Mutation for updating settings
  const updateSettingMutation = useMutation({
    mutationFn: async ({ settingKey, value }: { settingKey: string; value: boolean }) => {
      console.log(`🔄 UPDATING ${settingKey} to:`, value);
      
      const { data, error } = await supabase
        .from('shared_settings')
        .upsert({
          setting_key: settingKey,
          setting_value: value.toString()
        })
        .select();

      console.log(`📊 UPDATE RESULT for ${settingKey}:`, { data, error });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      console.log(`✅ SUCCESSFULLY UPDATED ${variables.settingKey}`);
      // Invalidate and refetch the settings
      queryClient.invalidateQueries({ queryKey: QUOTE_SETTINGS_QUERY_KEY });
      
      const settingName = variables.settingKey.includes('fasting') ? 'Fasting' : 'Walking';
      toast({
        title: "Setting updated",
        description: `${settingName} quotes ${variables.value ? 'enabled' : 'disabled'}`,
      });
    },
    onError: (error, variables) => {
      console.error(`❌ FAILED TO UPDATE ${variables.settingKey}:`, error);
      toast({
        title: "Error updating setting",
        description: "Please try again",
        variant: "destructive",
      });
    }
  });

  const handleFastingToggle = (enabled: boolean) => {
    updateSettingMutation.mutate({
      settingKey: 'fasting_quotes_display_enabled',
      value: enabled
    });
  };

  const handleWalkingToggle = (enabled: boolean) => {
    updateSettingMutation.mutate({
      settingKey: 'walking_quotes_display_enabled', 
      value: enabled
    });
  };

  if (isLoading) {
    return <div>Loading settings...</div>;
  }

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
              disabled={updateSettingMutation.isPending}
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
              disabled={updateSettingMutation.isPending}
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
};