import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Upload, Save } from 'lucide-react';

export const GoogleAnalyticsSettings = () => {
  const [propertyId, setPropertyId] = useState('');
  const [serviceAccount, setServiceAccount] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['google_analytics_property_id', 'google_analytics_service_account']);

      if (error) throw error;

      const propertyIdSetting = data.find(s => s.setting_key === 'google_analytics_property_id');
      const serviceAccountSetting = data.find(s => s.setting_key === 'google_analytics_service_account');

      setPropertyId(propertyIdSetting?.setting_value || '');
      setServiceAccount(serviceAccountSetting?.setting_value && serviceAccountSetting.setting_value !== '{}' 
        ? JSON.stringify(JSON.parse(serviceAccountSetting.setting_value), null, 2) 
        : '');

    } catch (error) {
      console.error('Error loading Google Analytics settings:', error);
      toast({
        title: "Error",
        description: "Failed to load Google Analytics settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Validate service account JSON
      let parsedServiceAccount = {};
      if (serviceAccount.trim()) {
        try {
          parsedServiceAccount = JSON.parse(serviceAccount);
          
          // Basic validation for required fields
          const requiredFields = ['type', 'project_id', 'private_key', 'client_email'];
          for (const field of requiredFields) {
            if (!parsedServiceAccount[field]) {
              throw new Error(`Missing required field: ${field}`);
            }
          }
        } catch (parseError) {
          toast({
            title: "Invalid Service Account JSON",
            description: "Please check your service account JSON format",
            variant: "destructive"
          });
          return;
        }
      }

      // Save property ID
      const { error: propertyError } = await supabase
        .from('shared_settings')
        .upsert({
          setting_key: 'google_analytics_property_id',
          setting_value: propertyId.trim()
        });

      if (propertyError) throw propertyError;

      // Save service account
      const { error: serviceAccountError } = await supabase
        .from('shared_settings')
        .upsert({
          setting_key: 'google_analytics_service_account',
          setting_value: serviceAccount.trim() ? JSON.stringify(parsedServiceAccount) : '{}'
        });

      if (serviceAccountError) throw serviceAccountError;

      toast({
        title: "Settings Saved",
        description: "Google Analytics settings have been updated successfully",
      });

    } catch (error) {
      console.error('Error saving Google Analytics settings:', error);
      toast({
        title: "Error",
        description: "Failed to save Google Analytics settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        // Validate JSON
        JSON.parse(content);
        setServiceAccount(content);
        toast({
          title: "File Loaded",
          description: "Service account JSON file loaded successfully",
        });
      } catch (error) {
        toast({
          title: "Invalid File",
          description: "Please upload a valid JSON file",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Google Analytics Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="propertyId">Property ID</Label>
            <Input
              id="propertyId"
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              placeholder="e.g., 123456789"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Your Google Analytics 4 Property ID (found in GA4 Admin → Property Settings)
            </p>
          </div>

          <div>
            <Label htmlFor="serviceAccount">Service Account JSON</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('serviceAccountFile')?.click()}
                  disabled={loading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload JSON File
                </Button>
                <input
                  id="serviceAccountFile"
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
              <Textarea
                id="serviceAccount"
                value={serviceAccount}
                onChange={(e) => setServiceAccount(e.target.value)}
                placeholder="Paste your service account JSON here or upload a file..."
                rows={8}
                disabled={loading}
                className="font-mono text-xs"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Download from Google Cloud Console → IAM & Admin → Service Accounts → Create Key (JSON format)
            </p>
          </div>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Setup Instructions:</h4>
          <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
            <li>Enable Google Analytics Data API in Google Cloud Console</li>
            <li>Create a service account with Analytics Viewer permissions</li>
            <li>Download the service account JSON key</li>
            <li>Add the service account email to your GA4 property as a Viewer</li>
            <li>Find your Property ID in GA4 Admin → Property Settings</li>
          </ol>
        </div>

      </CardContent>
      <CardFooter className="justify-end">
        <Button
          onClick={saveSettings}
          disabled={saving || loading || !propertyId.trim()}
          className="w-full sm:w-auto"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </CardFooter>
    </Card>
  );
};