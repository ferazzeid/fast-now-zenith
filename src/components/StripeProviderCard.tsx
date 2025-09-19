import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Loader2 } from 'lucide-react';
import type { PaymentProvider } from '@/components/PaymentProviderSettings';

interface StripeProviderCardProps {
  provider: PaymentProvider;
  saving: string | null;
  updateProvider: (provider: string, updates: Partial<PaymentProvider>) => Promise<void>;
}

export const StripeProviderCard = ({ provider, saving, updateProvider }: StripeProviderCardProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5" />
            <div>
              <CardTitle className="text-lg">Stripe Configuration</CardTitle>
              <CardDescription>Web payments via Stripe • Credit Cards, Digital Wallets</CardDescription>
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
            <Badge 
              variant={provider.config_data.test_mode ? 'default' : 'destructive'}
              className={provider.config_data.test_mode ? 'bg-orange-100 text-orange-800 border-orange-200' : ''}
            >
              {provider.config_data.test_mode ? 'Test Mode' : 'Live Mode'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Test mode uses Stripe's test environment. Switch to Live mode for production payments.
          </p>
        </div>

        {/* Products Section */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Subscription Products</h4>
          <p className="text-xs text-muted-foreground">
            Configure your Stripe subscription products. Get Price IDs from your Stripe dashboard.
          </p>
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label>Premium Plan</Label>
                <Badge variant="default" className="text-xs">Active</Badge>
              </div>
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
                  placeholder="price_1ABC123... (from Stripe dashboard)"
                  disabled={saving === provider.provider}
                />
                <Input
                  type="number"
                  value={provider.config_data.products?.premium?.amount || 900}
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
                  Price ID from Stripe and amount in cents (900 = $9.00/month)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* URLs Section */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Redirect URLs</h4>
          <p className="text-xs text-muted-foreground">
            Where users go after successful payment or cancellation. These paths will be automatically prefixed with your domain.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="success_url">Success URL</Label>
              <Input
                id="success_url"
                value={provider.config_data.success_url || '/settings?success=true'}
                onChange={(e) => {
                  const newConfigData = {
                    ...provider.config_data,
                    success_url: e.target.value
                  };
                  updateProvider(provider.provider, { config_data: newConfigData });
                }}
                placeholder="/settings?success=true"
                disabled={saving === provider.provider}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Where users land after successful payment
              </p>
            </div>
            <div>
              <Label htmlFor="cancel_url">Cancel URL</Label>
              <Input
                id="cancel_url"
                value={provider.config_data.cancel_url || '/settings?cancelled=true'}
                onChange={(e) => {
                  const newConfigData = {
                    ...provider.config_data,
                    cancel_url: e.target.value
                  };
                  updateProvider(provider.provider, { config_data: newConfigData });
                }}
                placeholder="/settings?cancelled=true"
                disabled={saving === provider.provider}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Where users go if they cancel payment
              </p>
            </div>
          </div>
        </div>

        {/* Webhook Section */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Webhooks</h4>
          <p className="text-xs text-muted-foreground">
            Webhooks automatically update user subscriptions when events happen in Stripe (payments, cancellations, etc.)
          </p>
          <div className="space-y-3">
            <div>
              <Label htmlFor="webhook_secret">Webhook Signing Secret</Label>
              <Input
                id="webhook_secret"
                type="password"
                value={provider.config_data.webhook_secret || ''}
                onChange={(e) => {
                  const newConfigData = {
                    ...provider.config_data,
                    webhook_secret: e.target.value
                  };
                  updateProvider(provider.provider, { config_data: newConfigData });
                }}
                placeholder="whsec_..."
                disabled={saving === provider.provider}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Webhook signing secret from your Stripe dashboard (starts with whsec_)
              </p>
            </div>
            <div className="p-3 bg-info/5 rounded-lg border border-info/20">
              <p className="text-xs font-medium text-info-foreground mb-2">Important: Webhook URL is different from your app domain</p>
              <p className="text-xs text-info-foreground mb-3">Your app runs on go.fastnow.app, but webhooks must point to your Supabase edge function.</p>
              <p className="text-sm font-medium text-info-foreground mb-2">Setup Instructions:</p>
              <ol className="text-xs text-info-foreground space-y-1 list-decimal list-inside">
                <li>Go to your Stripe Dashboard → Webhooks</li>
                <li>Add endpoint: <code className="bg-info/10 px-1 rounded text-xs">https://texnkijwcygodtywgedm.supabase.co/functions/v1/stripe-webhook</code></li>
                <li>Select events: customer.subscription.created, customer.subscription.updated, customer.subscription.deleted, invoice.payment_succeeded</li>
                <li>Copy the signing secret (whsec_...) and paste it above</li>
                <li>Test the webhook to ensure it's working properly</li>
              </ol>
            </div>
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
  );
};