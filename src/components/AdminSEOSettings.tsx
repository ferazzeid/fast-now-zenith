import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Globe, Search } from 'lucide-react';
import { useStandardizedLoading } from '@/hooks/useStandardizedLoading';
import { SmartInlineLoading } from '@/components/SimpleLoadingComponents';

interface SEOSettings {
  indexHomepage: boolean;
  indexOtherPages: boolean;
}

export const AdminSEOSettings = () => {
  const { toast } = useToast();
  const { data: settings, isLoading, execute, setData } = useStandardizedLoading<SEOSettings>({
    indexHomepage: false,
    indexOtherPages: false
  });

  useEffect(() => {
    execute(async () => {
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['seo_index_homepage', 'seo_index_other_pages']);

      if (error) throw error;

      if (data) {
        const settingsMap = data.reduce((acc, item) => {
          acc[item.setting_key] = item.setting_value === 'true';
          return acc;
        }, {} as Record<string, boolean>);

        return {
          indexHomepage: settingsMap.seo_index_homepage || false,
          indexOtherPages: settingsMap.seo_index_other_pages || false
        };
      }
      return { indexHomepage: false, indexOtherPages: false };
    }, {
      onError: (error) => {
        console.error('Failed to fetch SEO settings:', error);
        toast({
          title: "Error",
          description: "Failed to load SEO settings",
          variant: "destructive"
        });
      }
    });
  }, []);

  const updateSetting = async (key: string, value: boolean) => {
    try {
      // First try to get existing record
      const { data: existing, error: fetchError } = await supabase
        .from('shared_settings')
        .select('id')
        .eq('setting_key', key)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      let error;
      if (existing) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('shared_settings')
          .update({ setting_value: value.toString() })
          .eq('setting_key', key);
        error = updateError;
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('shared_settings')
          .insert({ 
            setting_key: key, 
            setting_value: value.toString() 
          });
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "Settings Updated",
        description: "SEO indexing settings have been saved"
      });
    } catch (error) {
      console.error('Failed to update SEO setting:', error);
      toast({
        title: "Error",
        description: "Failed to update SEO settings",
        variant: "destructive"
      });
    }
  };

  const handleHomepageToggle = async (checked: boolean) => {
    setData({ ...settings, indexHomepage: checked });
    await updateSetting('seo_index_homepage', checked);
  };

  const handleOtherPagesToggle = async (checked: boolean) => {
    setData({ ...settings, indexOtherPages: checked });
    await updateSetting('seo_index_other_pages', checked);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">SEO Indexing Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <SmartInlineLoading text="Loading SEO settings" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">SEO Indexing Settings</CardTitle>
        <CardDescription>
          Control search engine indexing for different pages
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <Label htmlFor="homepage-indexing" className="flex items-center gap-2">
            <Globe className="h-4 w-4" /> Homepage Indexing
          </Label>
          <Switch id="homepage-indexing" checked={settings.indexHomepage} onCheckedChange={handleHomepageToggle} />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="other-pages-indexing" className="flex items-center gap-2">
            <Globe className="h-4 w-4" /> Other Pages Indexing
          </Label>
          <Switch id="other-pages-indexing" checked={settings.indexOtherPages} onCheckedChange={handleOtherPagesToggle} />
        </div>
      </CardContent>
    </Card>
  );
};