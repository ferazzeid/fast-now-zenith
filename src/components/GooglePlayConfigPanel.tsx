import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Key, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export const GooglePlayConfigPanel: React.FC = () => {
  const [serviceAccountJson, setServiceAccountJson] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const { toast } = useToast();

  const validateServiceAccountJson = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      
      const requiredFields = [
        'type', 'project_id', 'private_key_id', 'private_key',
        'client_email', 'client_id', 'auth_uri', 'token_uri'
      ];
      
      for (const field of requiredFields) {
        if (!parsed[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }
      
      if (parsed.type !== 'service_account') {
        throw new Error('JSON must be for a service account');
      }
      
      return true;
    } catch (error) {
      throw new Error(`Invalid JSON format: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleUploadServiceAccount = async () => {
    if (!serviceAccountJson.trim()) {
      toast({
        title: "Error",
        description: "Please paste your service account JSON",
        variant: "destructive"
      });
      return;
    }

    try {
      // Validate JSON format
      validateServiceAccountJson(serviceAccountJson);
      
      setIsUploading(true);
      
      // Configure the service account via database function
      const { error } = await supabase.rpc('configure_google_play_service_account', {
        service_account_json: serviceAccountJson
      });

      if (error) throw error;

      setIsConfigured(true);
      setServiceAccountJson(''); // Clear for security
      
      toast({
        title: "Success",
        description: "Google Play service account configured successfully",
      });
      
    } catch (error: any) {
      console.error('Service account upload error:', error);
      toast({
        title: "Configuration Failed",
        description: error.message || "Failed to configure service account",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleTestConfiguration = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_provider_configs')
        .select('config_data, is_active')
        .eq('provider', 'google_play')
        .single();

      if (error) throw error;

      const configData = data?.config_data as any;
      if (data?.is_active && configData?.service_account_key) {
        setIsConfigured(true);
        toast({
          title: "Configuration Valid",
          description: "Google Play integration is properly configured",
        });
      } else {
        toast({
          title: "Configuration Incomplete",
          description: "Service account key not found or inactive",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Test Failed",
        description: error.message || "Unable to test configuration",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="w-5 h-5" />
          Google Play Service Account
        </CardTitle>
        <CardDescription>
          Configure Google Play Developer API access for subscription validation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Configuration Status</span>
          <Badge variant={isConfigured ? "default" : "secondary"} className="flex items-center gap-1">
            {isConfigured ? (
              <>
                <CheckCircle className="w-3 h-3" />
                Configured
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3" />
                Not Configured
              </>
            )}
          </Badge>
        </div>

        <div className="space-y-3">
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="text-sm font-medium mb-2">Setup Instructions:</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Go to Google Cloud Console</li>
              <li>Enable Google Play Developer API</li>
              <li>Create a service account</li>
              <li>Download the JSON key file</li>
              <li>Add service account email to Google Play Console</li>
              <li>Paste the JSON content below</li>
            </ol>
            <Button
              variant="link"
              className="p-0 h-auto text-xs"
              onClick={() => window.open('https://developers.google.com/android-publisher/getting_started', '_blank')}
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              View Full Documentation
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Service Account JSON</label>
            <Textarea
              placeholder="Paste your Google service account JSON key here..."
              value={serviceAccountJson}
              onChange={(e) => setServiceAccountJson(e.target.value)}
              rows={8}
              className="font-mono text-xs"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleUploadServiceAccount}
              disabled={isUploading || !serviceAccountJson.trim()}
              className="flex-1"
            >
              {isUploading ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-spin" />
                  Configuring...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Configure Service Account
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleTestConfiguration}
            >
              Test Config
            </Button>
          </div>
        </div>

        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Security Note:</strong> Service account keys are encrypted and stored securely. 
            Never share these keys or commit them to version control.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};