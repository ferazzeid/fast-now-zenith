// Lazy-loaded admin components to reduce initial bundle size
import { lazy, Suspense } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

// Lazy load admin-only components
const LazySimpleAnalyticsWidget = lazy(() => import('./SimpleAnalyticsWidget').then(m => ({ default: m.SimpleAnalyticsWidget })));
const LazyCancellationTracker = lazy(() => import('./CancellationTracker').then(m => ({ default: m.CancellationTracker })));
const LazyAdminTierStats = lazy(() => import('./AdminTierStats').then(m => ({ default: m.AdminTierStats })));
const LazyOpenAIApiStats = lazy(() => import('./OpenAIApiStats').then(m => ({ default: m.OpenAIApiStats })));
const LazyUserRequestLimits = lazy(() => import('./UserRequestLimits').then(m => ({ default: m.UserRequestLimits })));
const LazyAdminSEOSettings = lazy(() => import('./AdminSEOSettings').then(m => ({ default: m.AdminSEOSettings })));
const LazyBrandAssetsManager = lazy(() => import('./BrandAssetsManager'));
const LazyColorManagement = lazy(() => import('./ColorManagement').then(m => ({ default: m.ColorManagement })));
const LazyPromptManagement = lazy(() => import('./PromptManagement').then(m => ({ default: m.PromptManagement })));
const LazyPaymentProviderSettings = lazy(() => import('./PaymentProviderSettings').then(m => ({ default: m.PaymentProviderSettings })));

const AdminComponentWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={
    <div className="flex items-center justify-center p-6">
      <LoadingSpinner />
    </div>
  }>
    {children}
  </Suspense>
);

export const SimpleAnalyticsWidget = () => (
  <AdminComponentWrapper>
    <LazySimpleAnalyticsWidget />
  </AdminComponentWrapper>
);

export const CancellationTracker = () => (
  <AdminComponentWrapper>
    <LazyCancellationTracker />
  </AdminComponentWrapper>
);

export const AdminTierStats = () => (
  <AdminComponentWrapper>
    <LazyAdminTierStats />
  </AdminComponentWrapper>
);

export const OpenAIApiStats = () => (
  <AdminComponentWrapper>
    <LazyOpenAIApiStats />
  </AdminComponentWrapper>
);

export const UserRequestLimits = () => (
  <AdminComponentWrapper>
    <LazyUserRequestLimits />
  </AdminComponentWrapper>
);

export const AdminSEOSettings = () => (
  <AdminComponentWrapper>
    <LazyAdminSEOSettings />
  </AdminComponentWrapper>
);

export const BrandAssetsManager = () => (
  <AdminComponentWrapper>
    <LazyBrandAssetsManager />
  </AdminComponentWrapper>
);

export const ColorManagement = () => (
  <AdminComponentWrapper>
    <LazyColorManagement />
  </AdminComponentWrapper>
);

export const PromptManagement = () => (
  <AdminComponentWrapper>
    <LazyPromptManagement />
  </AdminComponentWrapper>
);

export const PaymentProviderSettings = () => (
  <AdminComponentWrapper>
    <LazyPaymentProviderSettings />
  </AdminComponentWrapper>
);