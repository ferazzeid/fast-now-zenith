import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Smartphone, Apple, CheckCircle, XCircle } from 'lucide-react';
import type { PaymentProvider } from '@/components/PaymentProviderSettings';

interface PaymentProviderOverviewProps {
  providers: PaymentProvider[];
}

const PROVIDER_INFO = {
  stripe: {
    name: 'Stripe',
    platforms: ['Web'],
    icon: CreditCard,
    requiredFields: ['secret_key', 'publishable_key'],
  },
  google_play: {
    name: 'Google Play',
    platforms: ['Android'],
    icon: Smartphone,
    requiredFields: ['service_account_key', 'package_name'],
  },
  apple_app_store: {
    name: 'Apple App Store',
    platforms: ['iOS'],
    icon: Apple,
    requiredFields: ['app_store_connect_key'],
  },
};

export const PaymentProviderOverview = ({ providers }: PaymentProviderOverviewProps) => {
  const getConfigurationStatus = (provider: PaymentProvider) => {
    const info = PROVIDER_INFO[provider.provider as keyof typeof PROVIDER_INFO];
    if (!info) return false;

    return info.requiredFields.every(field => {
      const value = provider.config_data[field];
      return value && value.toString().trim().length > 0;
    });
  };

  const activeCount = providers.filter(p => p.is_active).length;
  const configuredCount = providers.filter(p => getConfigurationStatus(p)).length;
  const totalPlatforms = providers.reduce((acc, p) => {
    const info = PROVIDER_INFO[p.provider as keyof typeof PROVIDER_INFO];
    return acc + (info?.platforms?.length || 0);
  }, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Payment Providers Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{activeCount}</div>
            <div className="text-sm text-muted-foreground">Active Providers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{configuredCount}</div>
            <div className="text-sm text-muted-foreground">Configured</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totalPlatforms}</div>
            <div className="text-sm text-muted-foreground">Platforms Covered</div>
          </div>
        </div>

        <div className="space-y-3">
          {Object.entries(PROVIDER_INFO).map(([key, info]) => {
            const provider = providers.find(p => p.provider === key);
            const Icon = info.icon;
            const isConfigured = provider && getConfigurationStatus(provider);
            const isActive = provider?.is_active || false;

            return (
              <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{info.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {info.platforms.join(', ')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isConfigured ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <Badge variant={isActive ? 'default' : 'secondary'}>
                    {isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};