import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const AdminAuthorTooltipToggle = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSetting();
  }, []);

  const loadSetting = async () => {
    try {
      const { data } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'author_tooltips_enabled')
        .single();

      setIsEnabled(data?.setting_value === 'true');
    } catch (error) {
      console.error('Error loading author tooltip setting:', error);
      setIsEnabled(false);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (checked: boolean) => {
    try {
      const { error } = await supabase
        .from('shared_settings')
        .upsert({
          setting_key: 'author_tooltips_enabled',
          setting_value: checked.toString()
        });

      if (error) throw error;

      setIsEnabled(checked);
      toast({
        title: "Setting updated",
        description: `Author tooltips ${checked ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Error updating setting:', error);
      toast({
        title: "Error",
        description: "Failed to update setting",
        variant: "destructive"
      });
    }
  };

  if (loading) return null;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <Label htmlFor="author-tooltips" className="text-sm font-medium">
            Author Tooltips
          </Label>
          <Switch
            id="author-tooltips"
            checked={isEnabled}
            onCheckedChange={handleToggle}
          />
        </div>
      </CardContent>
    </Card>
  );
};