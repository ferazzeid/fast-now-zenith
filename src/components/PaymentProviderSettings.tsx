import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CreditCard, Smartphone, Apple } from 'lucide-react';

interface PaymentProvider {
  provider: string;
  config_data: any;
  is_active: boolean;
}

export const PaymentProviderSettings = () => {
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_provider_configs')
        .select('*')
        .order('provider');

      if (error) throw error;
      setProviders(data || []);
    } catch (error) {
      console.error('Error fetching providers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch payment provider settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProvider = async (provider: string, updates: Partial<PaymentProvider>) => {
    try {
      setSaving(provider);
      
      const { error } = await supabase
        .from('payment_provider_configs')
        .update(updates)
        .eq('provider', provider);

      if (error) throw error;

      setProviders(prev => 
        prev.map(p => p.provider === provider ? { ...p, ...updates } : p)
      );

      toast({
        title: "Success",
        description: "Payment provider settings updated",
      });
    } catch (error) {
      console.error('Error updating provider:', error);
      toast({
        title: "Error",
        description: "Failed to update payment provider settings",
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'stripe':
        return <CreditCard className="w-5 h-5" />;
      case 'google_play':
        return <Smartphone className="w-5 h-5" />;
      case 'apple_app_store':
        return <Apple className="w-5 h-5" />;
      default:
        return <CreditCard className="w-5 h-5" />;
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'stripe':
        return 'Stripe';
      case 'google_play':
        return 'Google Play Billing';
      case 'apple_app_store':
        return 'Apple App Store';
      default:
        return provider;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Provider Settings</CardTitle>
          <CardDescription>
            Configure payment providers for different platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">

      {providers.map((provider) => (
        <Card key={provider.provider}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getProviderIcon(provider.provider)}
                <div>
                  <CardTitle className="text-lg">
                    {getProviderName(provider.provider)}
                  </CardTitle>
                  <CardDescription>
                    {provider.provider === 'stripe' && 'Web payments via Stripe'}
                    {provider.provider === 'google_play' && 'Android in-app purchases'}
                    {provider.provider === 'apple_app_store' && 'iOS in-app purchases'}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={provider.is_active ? 'outline' : 'secondary'}>
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
          
          <CardContent className="space-y-4">
            {provider.provider === 'stripe' && (
              <div className="space-y-4">
                <div>
                  <Label>Stripe Configuration</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Stripe settings are configured via the main admin panel and Supabase secrets.
                  </p>
                </div>
              </div>
            )}

            {provider.provider === 'google_play' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="package_name">Package Name</Label>
                  <Input
                    id="package_name"
                    value={provider.config_data.package_name || ''}
                    onChange={(e) => {
                      const newConfigData = {
                        ...provider.config_data,
                        package_name: e.target.value
                      };
                      updateProvider(provider.provider, { config_data: newConfigData });
                    }}
                    placeholder="com.yourapp.package"
                    disabled={saving === provider.provider}
                  />
                </div>
                <div>
                  <Label htmlFor="service_account_key">Service Account Key (JSON)</Label>
                  <Textarea
                    id="service_account_key"
                    value={provider.config_data.service_account_key || ''}
                    onChange={(e) => {
                      const newConfigData = {
                        ...provider.config_data,
                        service_account_key: e.target.value
                      };
                      updateProvider(provider.provider, { config_data: newConfigData });
                    }}
                    placeholder="Paste your Google Cloud Service Account JSON key here"
                    rows={6}
                    disabled={saving === provider.provider}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Download from Google Cloud Console → IAM & Admin → Service Accounts
                  </p>
                </div>
              </div>
            )}

            {provider.provider === 'apple_app_store' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="bundle_id">Bundle ID</Label>
                  <Input
                    id="bundle_id"
                    value={provider.config_data.bundle_id || ''}
                    onChange={(e) => {
                      const newConfigData = {
                        ...provider.config_data,
                        bundle_id: e.target.value
                      };
                      updateProvider(provider.provider, { config_data: newConfigData });
                    }}
                    placeholder="com.yourapp.bundle"
                    disabled={saving === provider.provider}
                  />
                </div>
                <div>
                  <Label htmlFor="shared_secret">App Store Connect Shared Secret</Label>
                  <Input
                    id="shared_secret"
                    type="password"
                    value={provider.config_data.shared_secret || ''}
                    onChange={(e) => {
                      const newConfigData = {
                        ...provider.config_data,
                        shared_secret: e.target.value
                      };
                      updateProvider(provider.provider, { config_data: newConfigData });
                    }}
                    placeholder="Your App Store Connect shared secret"
                    disabled={saving === provider.provider}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Found in App Store Connect → My Apps → App → Features → In-App Purchases
                  </p>
                </div>
              </div>
            )}

            {saving === provider.provider && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving changes...
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};