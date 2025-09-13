import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Settings, Zap, Clock, Shield, Sparkles } from 'lucide-react';

interface AppModeOption {
  value: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
}

const appModeOptions: AppModeOption[] = [
  {
    value: 'trial_premium',
    label: 'Trial + Premium System',
    description: '7-day trial, then free (limited) or $9/month premium',
    icon: <Clock className="w-4 h-4" />,
    features: ['7-day free trial', 'Premium subscription required', 'Limited free tier']
  },
  {
    value: 'free_full',
    label: 'Completely Free',
    description: 'Everything free including AI and full food tracking',
    icon: <Sparkles className="w-4 h-4" />,
    features: ['All features free', 'Full AI access', 'Complete food tracking', 'No limitations']
  },
  {
    value: 'free_food_only',
    label: 'Free Food Tracking (No AI)',
    description: 'Food tracking free, AI features locked behind premium',
    icon: <Zap className="w-4 h-4" />,
    features: ['Free food tracking', 'Premium AI features', 'Partial functionality']
  }
];

export const AdminAppModeSwitcher = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg">App Access Mode</CardTitle>
        <CardDescription>
          Control how your app handles user access and premium features globally
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <label htmlFor="app-mode-select" className="text-sm font-medium">
            Current Mode:
          </label>
          
          <Select 
            value={currentMode || 'trial_premium'} 
            onValueChange={handleModeChange}
            disabled={isLoading || updateModeMutation.isPending}
          >
            <SelectTrigger id="app-mode-select" className="w-full">
              <SelectValue placeholder="Select app mode..." />
            </SelectTrigger>
            <SelectContent className="z-50 bg-background border">
              {appModeOptions.map((mode) => (
                <SelectItem key={mode.value} value={mode.value}>
                  <div>
                    <div className="font-medium">{mode.label}</div>
                    <div className="text-xs text-muted-foreground">{mode.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Note:</strong> Changing the app mode affects all users immediately. 
            Admin users always have full access regardless of the selected mode.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};