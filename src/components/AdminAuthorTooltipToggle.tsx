import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useStandardizedLoading } from '@/hooks/useStandardizedLoading';
import { SmartInlineLoading } from '@/components/SimpleLoadingComponents';

export const AdminAuthorTooltipToggle = () => {
  const { toast } = useToast();
  const { data: isEnabled, isLoading, execute, setData } = useStandardizedLoading(false);

  useEffect(() => {
    execute(async () => {
      const { data } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'author_tooltips_enabled')
        .single();

      return data?.setting_value === 'true';
    }, {
      onError: (error) => {
        console.error('Error loading author tooltip setting:', error);
        setData(false);
      }
    });
  }, []);

  const handleToggle = async (checked: boolean) => {
    execute(async () => {
      const { error } = await supabase
        .from('shared_settings')
        .upsert({
          setting_key: 'author_tooltips_enabled',
          setting_value: checked.toString()
        });

      if (error) throw error;
      return checked;
    }, {
      onSuccess: (newValue) => {
        setData(newValue);
        toast({
          title: "Setting updated",
          description: `Author tooltips ${newValue ? 'enabled' : 'disabled'}`,
        });
      },
      onError: (error) => {
        console.error('Error updating setting:', error);
        toast({
          title: "Error",
          description: "Failed to update setting",
          variant: "destructive"
        });
      }
    });
  };

  if (isLoading) return <SmartInlineLoading text="Loading setting" />;

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
            disabled={isLoading}
          />
        </div>
      </CardContent>
    </Card>
  );
};