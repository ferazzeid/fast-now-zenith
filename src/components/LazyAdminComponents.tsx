// Lazy-loaded admin components to reduce initial bundle size
import { lazy } from 'react';
import { AdminLoadingWrapper } from './AdminLoadingWrapper';

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
const LazyAdminTimelineSettings = lazy(() => import('./AdminTimelineSettings').then(m => ({ default: m.AdminTimelineSettings })));

const AdminComponentWrapper = ({ 
  children, 
  componentName 
}: { 
  children: React.ReactNode; 
  componentName: string;
}) => (
  <AdminLoadingWrapper componentName={componentName}>
    {children}
  </AdminLoadingWrapper>
);

export const SimpleAnalyticsWidget = () => (
  <AdminComponentWrapper componentName="Analytics Widget">
    <LazySimpleAnalyticsWidget />
  </AdminComponentWrapper>
);

export const CancellationTracker = () => (
  <AdminComponentWrapper componentName="Cancellation Tracker">
    <LazyCancellationTracker />
  </AdminComponentWrapper>
);

export const AdminTierStats = () => (
  <AdminComponentWrapper componentName="Tier Statistics">
    <LazyAdminTierStats />
  </AdminComponentWrapper>
);

export const OpenAIApiStats = () => (
  <AdminComponentWrapper componentName="API Statistics">
    <LazyOpenAIApiStats />
  </AdminComponentWrapper>
);

export const UserRequestLimits = () => (
  <AdminComponentWrapper componentName="Request Limits">
    <LazyUserRequestLimits />
  </AdminComponentWrapper>
);

export const AdminSEOSettings = () => (
  <AdminComponentWrapper componentName="SEO Settings">
    <LazyAdminSEOSettings />
  </AdminComponentWrapper>
);

export const BrandAssetsManager = () => (
  <AdminComponentWrapper componentName="Brand Assets">
    <LazyBrandAssetsManager />
  </AdminComponentWrapper>
);

export const ColorManagement = () => (
  <AdminComponentWrapper componentName="Color Management">
    <LazyColorManagement />
  </AdminComponentWrapper>
);

export const PromptManagement = () => (
  <AdminComponentWrapper componentName="Prompt Management">
    <LazyPromptManagement />
  </AdminComponentWrapper>
);

export const PaymentProviderSettings = () => (
  <AdminComponentWrapper componentName="Payment Settings">
    <LazyPaymentProviderSettings />
  </AdminComponentWrapper>
);

export const AdminTimelineSettings = () => (
  <AdminComponentWrapper componentName="Timeline Settings">
    <LazyAdminTimelineSettings />
  </AdminComponentWrapper>
);