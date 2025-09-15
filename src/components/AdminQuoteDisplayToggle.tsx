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
    staleTime: 0, // Always refetch for immediate updates
  });

  // Get current values
  const fastingQuotesEnabled = settings?.find(s => s.setting_key === 'fasting_quotes_display_enabled')?.setting_value === 'true';
  const walkingQuotesEnabled = settings?.find(s => s.setting_key === 'walking_quotes_display_enabled')?.setting_value === 'true';

  console.log('🎯 CURRENT TOGGLE STATES:', { fastingQuotesEnabled, walkingQuotesEnabled });

  // Separate mutations for each setting to avoid conflicts
  const fastingMutation = useMutation({
    mutationFn: async (value: boolean) => {
      const { data, error } = await supabase
        .from('shared_settings')
        .upsert({
          setting_key: 'fasting_quotes_display_enabled',
          setting_value: value.toString()
        })
        .select();

      if (error) throw error;
      return data;
    },
    onMutate: async (value: boolean) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUOTE_SETTINGS_QUERY_KEY });
      
      // Snapshot the previous value
      const previousData = queryClient.getQueryData(QUOTE_SETTINGS_QUERY_KEY);
      
      // Optimistically update to the new value
      queryClient.setQueryData(QUOTE_SETTINGS_QUERY_KEY, (old: any) => {
        if (!old) return old;
        return old.map((setting: any) => 
          setting.setting_key === 'fasting_quotes_display_enabled'
            ? { ...setting, setting_value: value.toString() }
            : setting
        );
      });
      
      return { previousData };
    },
    onSuccess: (data, value) => {
      toast({
        title: "Setting updated",
        description: `Fasting quotes ${value ? 'enabled' : 'disabled'}`,
      });
    },
    onError: (error, value, context) => {
      // Revert to previous data on error
      if (context?.previousData) {
        queryClient.setQueryData(QUOTE_SETTINGS_QUERY_KEY, context.previousData);
      }
      toast({
        title: "Error updating setting",
        description: "Please try again",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: QUOTE_SETTINGS_QUERY_KEY });
    }
  });

  const walkingMutation = useMutation({
    mutationFn: async (value: boolean) => {
      const { data, error } = await supabase
        .from('shared_settings')
        .upsert({
          setting_key: 'walking_quotes_display_enabled',
          setting_value: value.toString()
        })
        .select();

      if (error) throw error;
      return data;
    },
    onMutate: async (value: boolean) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUOTE_SETTINGS_QUERY_KEY });
      
      // Snapshot the previous value
      const previousData = queryClient.getQueryData(QUOTE_SETTINGS_QUERY_KEY);
      
      // Optimistically update to the new value
      queryClient.setQueryData(QUOTE_SETTINGS_QUERY_KEY, (old: any) => {
        if (!old) return old;
        return old.map((setting: any) => 
          setting.setting_key === 'walking_quotes_display_enabled'
            ? { ...setting, setting_value: value.toString() }
            : setting
        );
      });
      
      return { previousData };
    },
    onSuccess: (data, value) => {
      toast({
        title: "Setting updated",
        description: `Walking quotes ${value ? 'enabled' : 'disabled'}`,
      });
    },
    onError: (error, value, context) => {
      // Revert to previous data on error
      if (context?.previousData) {
        queryClient.setQueryData(QUOTE_SETTINGS_QUERY_KEY, context.previousData);
      }
      toast({
        title: "Error updating setting",
        description: "Please try again",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: QUOTE_SETTINGS_QUERY_KEY });
    }
  });

  const handleFastingToggle = (enabled: boolean) => {
    fastingMutation.mutate(enabled);
  };

  const handleWalkingToggle = (enabled: boolean) => {
    walkingMutation.mutate(enabled);
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
              disabled={fastingMutation.isPending}
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
              disabled={walkingMutation.isPending}
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
};