import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const GoogleAnalyticsSettings = () => {
  const [propertyId, setPropertyId] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_key, setting_value')
        .eq('setting_key', 'google_analytics_property_id');

      if (error) throw error;
      const propertyIdSetting = data?.[0];
      setPropertyId(propertyIdSetting?.setting_value || '');
    } catch (error) {
      console.error('Error loading Google Analytics settings:', error);
      toast({ title: 'Error', description: 'Failed to load settings', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('shared_settings')
        .upsert({ setting_key: 'google_analytics_property_id', setting_value: propertyId.trim() });

      if (error) throw error;
      toast({ title: 'Saved', description: 'Google Analytics property ID updated' });
    } catch (error) {
      console.error('Error saving Google Analytics settings:', error);
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Google Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Label htmlFor="propertyId" className="sr-only">Property ID</Label>
          <Input
            id="propertyId"
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            placeholder="GA4 Property ID"
            disabled={loading}
            className="h-9"
          />
          <Button onClick={saveSettings} disabled={saving || loading || !propertyId.trim()} className="h-9 px-4">
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
