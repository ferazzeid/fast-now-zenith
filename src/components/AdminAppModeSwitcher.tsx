import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTrialLength } from '@/hooks/useTrialLength';
import { Settings, Zap, Clock, Shield, Sparkles } from 'lucide-react';

interface AppModeOption {
  value: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
}

export const AdminAppModeSwitcher = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { trialDays } = useTrialLength();

  // Dynamic app mode options based on current trial length setting
  const appModeOptions: AppModeOption[] = [
    {
      value: 'trial_premium',
      label: 'Trial + Premium System',
      description: `${trialDays}-day trial, then premium subscription required. Free users have no access to food tracking or AI features.`,
      icon: <Clock className="w-4 h-4" />,
      features: [`${trialDays}-day free trial`, 'Premium subscription required', 'Free users: no food/AI access']
    }
  ];

  const { data: currentMode, isLoading } = useQuery({
    queryKey: ['app-mode'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_mode_settings')
        .select('setting_value')
        .eq('setting_key', 'global_access_mode')
        .single();
      
      if (error) throw error;
      return data.setting_value;
    }
  });

  const updateModeMutation = useMutation({
    mutationFn: async (newMode: string) => {
      const { error } = await supabase
        .from('app_mode_settings')
        .update({ setting_value: newMode })
        .eq('setting_key', 'global_access_mode');
      
      if (error) throw error;
    },
    onSuccess: (_, newMode) => {
      queryClient.invalidateQueries({ queryKey: ['app-mode'] });
      queryClient.invalidateQueries({ queryKey: ['access'] }); // Refresh user access
      toast({
        title: 'App Mode Updated',
        description: `App is now running in ${appModeOptions.find(m => m.value === newMode)?.label} mode`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error updating app mode',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleModeChange = (newMode: string) => {
    updateModeMutation.mutate(newMode);
  };

  const currentModeOption = appModeOptions.find(mode => mode.value === currentMode);

  return (
    <Card className="bg-card border-normal">
      <CardHeader>
        <CardTitle className="text-lg">App Access Mode</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <Select 
            value={currentMode || 'trial_premium'} 
            onValueChange={handleModeChange}
            disabled={isLoading || updateModeMutation.isPending}
          >
            <SelectTrigger id="app-mode-select" className="w-full">
              <SelectValue placeholder="Select app mode..." />
            </SelectTrigger>
            <SelectContent className="z-50 bg-background border-normal">
              {appModeOptions.map((mode) => (
                <SelectItem key={mode.value} value={mode.value}>
                  <div>
                    <div className="font-medium">{mode.label}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};