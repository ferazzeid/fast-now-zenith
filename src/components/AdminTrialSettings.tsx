import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const AdminTrialSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [inputValue, setInputValue] = useState('');

  const { data: trialDays, isLoading } = useQuery({
    queryKey: ['trial-length'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'trial_length_days')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data?.setting_value || '7';
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  const updateTrialMutation = useMutation({
    mutationFn: async (days: string) => {
      const { error } = await supabase
        .from('shared_settings')
        .upsert({
          setting_key: 'trial_length_days',
          setting_value: days
        });
      
      if (error) throw error;
    },
    onSuccess: (_, days) => {
      queryClient.invalidateQueries({ queryKey: ['trial-length'] });
      toast({
        title: 'Trial Length Updated',
        description: `Trial period set to ${days} days`,
      });
      setInputValue('');
    },
    onError: (error) => {
      toast({
        title: 'Error updating trial length',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  React.useEffect(() => {
    if (trialDays && !inputValue) {
      setInputValue(trialDays);
    }
  }, [trialDays]);

  const handleSave = () => {
    const days = parseInt(inputValue);
    if (!days || days < 1 || days > 365) {
      toast({
        title: 'Invalid input',
        description: 'Please enter a number between 1 and 365',
        variant: 'destructive'
      });
      return;
    }
    updateTrialMutation.mutate(inputValue);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg">Trial Length</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3">
          <Input
            type="number"
            min="1"
            max="365"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Days"
            disabled={isLoading || updateTrialMutation.isPending}
            className="w-24"
          />
          <Button 
            onClick={handleSave}
            disabled={isLoading || updateTrialMutation.isPending || !inputValue}
            size="sm"
          >
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};