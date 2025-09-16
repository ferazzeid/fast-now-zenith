import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export const AdminGoogleLoginSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  
  const { data: googleLoginEnabled } = useQuery({
    queryKey: ['google-login-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'google_login_enabled')
        .maybeSingle();
      
      if (error) throw error;
      return data?.setting_value === 'true';
    },
  });

  const handleGoogleLoginToggle = async (enabled: boolean) => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('shared_settings')
        .upsert({
          setting_key: 'google_login_enabled',
          setting_value: enabled ? 'true' : 'false'
        });
      
      if (error) throw error;
      
      // Invalidate cache to refetch the data
      queryClient.invalidateQueries({ queryKey: ['google-login-settings'] });
      
      toast({
        title: "Google Login Settings Updated",
        description: `Google login has been ${enabled ? 'enabled' : 'disabled'}.`,
      });
    } catch (error) {
      console.error('Error updating Google login settings:', error);
      toast({
        title: "Error",
        description: "Failed to update Google login settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Google Login</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <Label htmlFor="google-login-toggle">
            Enable Google Authentication
          </Label>
          <Switch
            id="google-login-toggle"
            checked={googleLoginEnabled ?? true}
            disabled={isLoading}
            onCheckedChange={handleGoogleLoginToggle}
          />
        </div>
      </CardContent>
    </Card>
  );
};