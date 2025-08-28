import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const GoogleAnalyticsSettings = () => {
  const [trackingId, setTrackingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_key, setting_value')
        .eq('setting_key', 'ga_tracking_id');

      if (error) throw error;
      const trackingIdSetting = data?.[0];
      setTrackingId(trackingIdSetting?.setting_value || '');
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
        .upsert({ setting_key: 'ga_tracking_id', setting_value: trackingId.trim() });

      if (error) throw error;
      toast({ title: 'Saved', description: 'Google Analytics tracking ID updated' });
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
          <Label htmlFor="trackingId" className="sr-only">Tracking ID</Label>
          <Input
            id="trackingId"
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            placeholder="GA4 Tracking ID (e.g., G-XXXXXXXXXX)"
            disabled={loading}
            className="h-9"
          />
          <Button onClick={saveSettings} disabled={saving || loading || !trackingId.trim()} className="h-9 px-4">
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
