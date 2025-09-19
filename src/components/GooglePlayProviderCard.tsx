import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Smartphone, Loader2, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import type { PaymentProvider } from '@/components/PaymentProviderSettings';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface GooglePlayProviderCardProps {
  provider: PaymentProvider;
  saving: string | null;
  updateProvider: (provider: string, updates: Partial<PaymentProvider>) => Promise<void>;
}

export const GooglePlayProviderCard = ({ provider, saving, updateProvider }: GooglePlayProviderCardProps) => {
  const [jsonInput, setJsonInput] = useState('');
  const [isValidJson, setIsValidJson] = useState(false);
  const { toast } = useToast();

  const validateJson = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      const required = ['type', 'project_id', 'private_key', 'client_email'];
      const hasRequired = required.every(field => parsed[field]);
      return hasRequired && parsed.type === 'service_account';
    } catch {
      return false;
    }
  };

  const handleJsonChange = (value: string) => {
    setJsonInput(value);
    setIsValidJson(validateJson(value));
  };

  const uploadServiceAccount = async () => {
    try {
      const parsed = JSON.parse(jsonInput);
      const newConfigData = {
        ...provider.config_data,
        service_account_key: parsed
      };
      await updateProvider(provider.provider, { config_data: newConfigData });
      setJsonInput('');
      toast({
        title: "Success",
        description: "Service account key uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid service account JSON",
        variant: "destructive",
      });
    }
  };

  const hasServiceAccount = provider.config_data.service_account_key;
  const packageName = provider.config_data.package_name;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Smartphone className="w-5 h-5" />
            <div>
              <CardTitle className="text-lg">Google Play Configuration</CardTitle>
              <CardDescription>Android in-app purchases • Google Play Billing</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={provider.is_active ? 'default' : 'secondary'}>
              {provider.is_active ? 'Active' : 'Inactive'}
            </Badge>
            <Switch
              checked={provider.is_active}
              onCheckedChange={(checked) => 
                updateProvider(provider.provider, { is_active: checked })
              }
              disabled={saving === provider.provider}
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Service Account Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Service Account</h4>
            {hasServiceAccount && (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs">Configured</span>
              </div>
            )}
          </div>
          
          {hasServiceAccount ? (
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">Service Account Connected</p>
                  <p className="text-xs text-green-700">
                    Project: {hasServiceAccount.project_id}
                  </p>
                  <p className="text-xs text-green-700">
                    Email: {hasServiceAccount.client_email}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 text-xs"
                    onClick={() => {
                      const newConfigData = { ...provider.config_data };
                      delete newConfigData.service_account_key;
                      updateProvider(provider.provider, { config_data: newConfigData });
                    }}
                  >
                    Replace Service Account
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <Label htmlFor="service_account">Service Account JSON</Label>
                <Textarea
                  id="service_account"
                  value={jsonInput}
                  onChange={(e) => handleJsonChange(e.target.value)}
                  placeholder={`{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n",
  "client_email": "service-account@your-project.iam.gserviceaccount.com",
  ...
}`}
                  className="font-mono text-xs min-h-[120px]"
                  disabled={saving === provider.provider}
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">
                    Paste your Google Play service account JSON key here
                  </p>
                  {jsonInput && (
                    <div className="flex items-center gap-1">
                      {isValidJson ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-xs">
                        {isValidJson ? 'Valid JSON' : 'Invalid JSON'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <Button
                onClick={uploadServiceAccount}
                disabled={!isValidJson || saving === provider.provider}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Service Account
              </Button>
            </div>
          )}
          
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-medium text-blue-900 mb-2">How to get your Service Account JSON:</p>
            <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
              <li>Go to Google Cloud Console → IAM & Admin → Service Accounts</li>
              <li>Select your project or create a new service account</li>
              <li>Click "Keys" tab → "Add Key" → "Create new key"</li>
              <li>Select "JSON" format and download the file</li>
              <li>Copy the contents and paste above</li>
            </ol>
          </div>
        </div>

        {/* Package Configuration */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">App Configuration</h4>
          <div>
            <Label htmlFor="package_name">Package Name</Label>
            <Input
              id="package_name"
              value={packageName || ''}
              onChange={(e) => {
                const newConfigData = {
                  ...provider.config_data,
                  package_name: e.target.value
                };
                updateProvider(provider.provider, { config_data: newConfigData });
              }}
              placeholder="com.yourcompany.yourapp"
              disabled={saving === provider.provider}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Your Android app package name (from build.gradle or Play Console)
            </p>
          </div>
        </div>

        {/* Product IDs Section */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Subscription Products</h4>
          <p className="text-xs text-muted-foreground">
            Configure your Google Play subscription product IDs. These must match your Play Console configuration.
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label>Premium Subscription</Label>
              <Badge variant="default" className="text-xs">Monthly</Badge>
            </div>
            <div className="space-y-2">
              <Input
                value={provider.config_data.product_ids?.premium_subscription_monthly?.type || 'subscription'}
                disabled
                className="bg-muted"
                placeholder="subscription"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={provider.config_data.product_ids?.premium_subscription_monthly?.price || ''}
                  onChange={(e) => {
                    const newConfigData = {
                      ...provider.config_data,
                      product_ids: {
                        ...provider.config_data.product_ids,
                        premium_subscription_monthly: {
                          ...provider.config_data.product_ids?.premium_subscription_monthly,
                          price: parseFloat(e.target.value) || 0
                        }
                      }
                    };
                    updateProvider(provider.provider, { config_data: newConfigData });
                  }}
                  type="number"
                  step="0.01"
                  placeholder="9.99"
                  disabled={saving === provider.provider}
                />
                <Input
                  value={provider.config_data.product_ids?.premium_subscription_monthly?.currency || ''}
                  onChange={(e) => {
                    const newConfigData = {
                      ...provider.config_data,
                      product_ids: {
                        ...provider.config_data.product_ids,
                        premium_subscription_monthly: {
                          ...provider.config_data.product_ids?.premium_subscription_monthly,
                          currency: e.target.value
                        }
                      }
                    };
                    updateProvider(provider.provider, { config_data: newConfigData });
                  }}
                  placeholder="USD"
                  disabled={saving === provider.provider}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Product price and currency (must match Play Console)
              </p>
            </div>
          </div>
        </div>

        {/* Environment Toggle */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Environment</h4>
          <div className="flex items-center gap-3">
            <Switch
              checked={provider.config_data.test_mode || false}
              onCheckedChange={(checked) => {
                const newConfigData = {
                  ...provider.config_data,
                  test_mode: checked
                };
                updateProvider(provider.provider, { config_data: newConfigData });
              }}
              disabled={saving === provider.provider}
            />
            <Label>Test Mode</Label>
            <Badge 
              variant={provider.config_data.test_mode ? 'default' : 'destructive'}
              className={provider.config_data.test_mode ? 'bg-orange-100 text-orange-800 border-orange-200' : ''}
            >
              {provider.config_data.test_mode ? 'Test Mode' : 'Production'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Test mode uses Google Play's testing environment. Switch to Production for live payments.
          </p>
        </div>

        {saving === provider.provider && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving changes...
          </div>
        )}
      </CardContent>
    </Card>
  );
};