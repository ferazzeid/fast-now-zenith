import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Smartphone, Apple } from 'lucide-react';
import { useStandardizedLoading } from '@/hooks/useStandardizedLoading';
import { SmartInlineLoading } from '@/components/SimpleLoadingComponents';
import { PaymentProviderOverview } from '@/components/PaymentProviderOverview';
import { StripeProviderCard } from '@/components/StripeProviderCard';
import { GooglePlayProviderCard } from '@/components/GooglePlayProviderCard';

export interface PaymentProvider {
  id: string;
  provider: string;
  config_data: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const PROVIDER_ICONS = {
  stripe: CreditCard,
  google_play: Smartphone,
  apple_app_store: Apple,
};

const PROVIDER_INFO = {
  stripe: {
    name: 'Stripe',
    description: 'Web payments via credit cards',
    platforms: ['Web'],
  },
  google_play: {
    name: 'Google Play',
    description: 'Android in-app purchases',
    platforms: ['Android'],
  },
  apple_app_store: {
    name: 'Apple App Store',
    description: 'iOS in-app purchases',
    platforms: ['iOS'],
  },
};

export const PaymentProviderSettings = () => {
  const [saving, setSaving] = useState<string | null>(null);
  const { toast } = useToast();
  const { data: providers, isLoading, execute, setData } = useStandardizedLoading<PaymentProvider[]>([]);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = () => {
    execute(async () => {
      const { data, error } = await supabase
        .from('payment_provider_configs')
        .select('*')
        .order('provider');

      if (error) throw error;
      return data || [];
    }, {
      onError: (error) => {
        console.error('Error fetching providers:', error);
        toast({
          title: "Error",
          description: "Failed to fetch payment provider settings",
          variant: "destructive",
        });
      }
    });
  };

  const updateProvider = async (provider: string, updates: Partial<PaymentProvider>) => {
    try {
      setSaving(provider);
      
      const { error } = await supabase
        .from('payment_provider_configs')
        .update(updates)
        .eq('provider', provider);

      if (error) throw error;

      setData(providers.map(p => p.provider === provider ? { ...p, ...updates } : p));

      toast({
        title: "Success",
        description: `${PROVIDER_INFO[provider as keyof typeof PROVIDER_INFO]?.name || provider} settings updated`,
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Provider Settings</CardTitle>
          <CardDescription>
            Configure payment processing for different platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SmartInlineLoading text="Loading payment providers" />
        </CardContent>
      </Card>
    );
  }

  const activeProviders = providers.filter(p => p.is_active);
  const inactiveProviders = providers.filter(p => !p.is_active);

  return (
    <div className="space-y-6">
      {/* Provider Overview */}
      <PaymentProviderOverview providers={providers} />

      {/* Active Providers */}
      {activeProviders.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Active Providers</h3>
          {activeProviders.map((provider) => (
            <div key={provider.provider}>
              {provider.provider === 'stripe' && (
                <StripeProviderCard
                  provider={provider}
                  saving={saving}
                  updateProvider={updateProvider}
                />
              )}
              {provider.provider === 'google_play' && (
                <GooglePlayProviderCard
                  provider={provider}
                  saving={saving}
                  updateProvider={updateProvider}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Inactive Providers */}
      {inactiveProviders.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Inactive Providers</h3>
          {inactiveProviders.map((provider) => {
            const Icon = PROVIDER_ICONS[provider.provider as keyof typeof PROVIDER_ICONS] || CreditCard;
            const info = PROVIDER_INFO[provider.provider as keyof typeof PROVIDER_INFO];
            
            return (
              <Card key={provider.provider} className="opacity-75">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <CardTitle className="text-base text-muted-foreground">
                          {info?.name || provider.provider}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {info?.description} • {info?.platforms?.join(', ')}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Inactive</Badge>
                      <button
                        onClick={() => updateProvider(provider.provider, { is_active: true })}
                        disabled={saving === provider.provider}
                        className="px-3 py-1 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-md disabled:opacity-50"
                      >
                        Activate
                      </button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      )}

      {providers.length === 0 && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No payment providers configured</p>
              <p className="text-sm">Set up payment providers to enable subscriptions</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};