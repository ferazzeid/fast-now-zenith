import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CreditCard } from 'lucide-react';

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
        .eq('provider', 'stripe')
        .single();

      if (error) throw error;
      setProviders(data ? [data] : []);
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stripe Payment Settings</CardTitle>
          <CardDescription>
            Configure Stripe payment processing for subscriptions
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
                <CreditCard className="w-5 h-5" />
                <div>
                  <CardTitle className="text-lg">Stripe Configuration</CardTitle>
                  <CardDescription>Web payments via Stripe</CardDescription>
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
          
          <CardContent className="space-y-6">
            {/* API Keys Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">API Keys</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="secret_key">Secret Key</Label>
                  <Input
                    id="secret_key"
                    type="password"
                    value={provider.config_data.secret_key || ''}
                    onChange={(e) => {
                      const newConfigData = {
                        ...provider.config_data,
                        secret_key: e.target.value
                      };
                      updateProvider(provider.provider, { config_data: newConfigData });
                    }}
                    placeholder="sk_test_... or sk_live_..."
                    disabled={saving === provider.provider}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Your Stripe secret key from the dashboard
                  </p>
                </div>
                <div>
                  <Label htmlFor="publishable_key">Publishable Key</Label>
                  <Input
                    id="publishable_key"
                    value={provider.config_data.publishable_key || ''}
                    onChange={(e) => {
                      const newConfigData = {
                        ...provider.config_data,
                        publishable_key: e.target.value
                      };
                      updateProvider(provider.provider, { config_data: newConfigData });
                    }}
                    placeholder="pk_test_... or pk_live_..."
                    disabled={saving === provider.provider}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Your Stripe publishable key (client-side)
                  </p>
                </div>
              </div>
            </div>

            {/* Mode Toggle */}
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
                <Badge variant={provider.config_data.test_mode ? 'secondary' : 'destructive'}>
                  {provider.config_data.test_mode ? 'Test' : 'Live'}
                </Badge>
              </div>
            </div>

            {/* Products Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Subscription Products</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label>Basic Plan</Label>
                  <div className="space-y-2">
                    <Input
                      value={provider.config_data.products?.basic?.price_id || ''}
                      onChange={(e) => {
                        const newConfigData = {
                          ...provider.config_data,
                          products: {
                            ...provider.config_data.products,
                            basic: {
                              ...provider.config_data.products?.basic,
                              price_id: e.target.value
                            }
                          }
                        };
                        updateProvider(provider.provider, { config_data: newConfigData });
                      }}
                      placeholder="price_1..."
                      disabled={saving === provider.provider}
                    />
                    <Input
                      type="number"
                      value={provider.config_data.products?.basic?.amount || 999}
                      onChange={(e) => {
                        const newConfigData = {
                          ...provider.config_data,
                          products: {
                            ...provider.config_data.products,
                            basic: {
                              ...provider.config_data.products?.basic,
                              amount: parseInt(e.target.value)
                            }
                          }
                        };
                        updateProvider(provider.provider, { config_data: newConfigData });
                      }}
                      placeholder="Amount in cents"
                      disabled={saving === provider.provider}
                    />
                    <p className="text-xs text-muted-foreground">
                      Price ID and amount in cents (999 = $9.99)
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>Premium Plan</Label>
                  <div className="space-y-2">
                    <Input
                      value={provider.config_data.products?.premium?.price_id || ''}
                      onChange={(e) => {
                        const newConfigData = {
                          ...provider.config_data,
                          products: {
                            ...provider.config_data.products,
                            premium: {
                              ...provider.config_data.products?.premium,
                              price_id: e.target.value
                            }
                          }
                        };
                        updateProvider(provider.provider, { config_data: newConfigData });
                      }}
                      placeholder="price_1..."
                      disabled={saving === provider.provider}
                    />
                    <Input
                      type="number"
                      value={provider.config_data.products?.premium?.amount || 1999}
                      onChange={(e) => {
                        const newConfigData = {
                          ...provider.config_data,
                          products: {
                            ...provider.config_data.products,
                            premium: {
                              ...provider.config_data.products?.premium,
                              amount: parseInt(e.target.value)
                            }
                          }
                        };
                        updateProvider(provider.provider, { config_data: newConfigData });
                      }}
                      placeholder="Amount in cents"
                      disabled={saving === provider.provider}
                    />
                    <p className="text-xs text-muted-foreground">
                      Price ID and amount in cents (1999 = $19.99)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* URLs Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Redirect URLs</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="success_url">Success URL</Label>
                  <Input
                    id="success_url"
                    value={provider.config_data.success_url || '/subscription-success'}
                    onChange={(e) => {
                      const newConfigData = {
                        ...provider.config_data,
                        success_url: e.target.value
                      };
                      updateProvider(provider.provider, { config_data: newConfigData });
                    }}
                    placeholder="/subscription-success"
                    disabled={saving === provider.provider}
                  />
                </div>
                <div>
                  <Label htmlFor="cancel_url">Cancel URL</Label>
                  <Input
                    id="cancel_url"
                    value={provider.config_data.cancel_url || '/subscription-cancelled'}
                    onChange={(e) => {
                      const newConfigData = {
                        ...provider.config_data,
                        cancel_url: e.target.value
                      };
                      updateProvider(provider.provider, { config_data: newConfigData });
                    }}
                    placeholder="/subscription-cancelled"
                    disabled={saving === provider.provider}
                  />
                </div>
              </div>
            </div>

            {/* Webhook Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Webhooks</h4>
              <div>
                <Label htmlFor="webhook_url">Webhook Endpoint URL</Label>
                <Input
                  id="webhook_url"
                  value={provider.config_data.webhook_url || ''}
                  onChange={(e) => {
                    const newConfigData = {
                      ...provider.config_data,
                      webhook_url: e.target.value
                    };
                    updateProvider(provider.provider, { config_data: newConfigData });
                  }}
                  placeholder="https://yourapp.com/webhooks/stripe"
                  disabled={saving === provider.provider}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Configure this URL in your Stripe dashboard for webhook events
                </p>
              </div>
            </div>

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