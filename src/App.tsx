import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { BrowserRouter, MemoryRouter, Routes, Route, Navigate } from "react-router-dom";
import { CriticalErrorBoundary, PageErrorBoundary } from "@/components/enhanced/ComprehensiveErrorBoundary";
import { AsyncErrorBoundary } from "@/components/AsyncErrorBoundary";
import Timer from "./pages/Timer";
import Motivators from "./pages/Motivators";
import MotivatorIdeas from "./pages/MotivatorIdeas";

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { GlobalProfileOnboarding } from '@/components/GlobalProfileOnboarding';
import { useProfile } from '@/hooks/useProfile';
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import UpdatePassword from "./pages/UpdatePassword";
// import AdminOverview from "./pages/AdminOverview";

import NotFound from "./pages/NotFound";
import Walking from "./pages/Walking";
import FoodTracking from "./pages/FoodTracking";
import { HealthCheck } from "./pages/HealthCheck";
import { Navigation } from "./components/Navigation";


import { ThemeProvider } from "./contexts/ThemeContext";
import { SimplifiedStartup } from "./components/SimplifiedStartup";
import { useSimplifiedStartup } from "./hooks/useSimplifiedStartup";
import { useDeferredAssets } from "./hooks/useDeferredAssets";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import { DailyStatsPanel } from "./components/DailyStatsPanel";
import { SimpleWalkingStatsProvider } from "./contexts/SimplifiedWalkingStats";
import { initializeAnalytics, trackPageView } from "./utils/analytics";
import { SEOManager } from "./components/SEOManager";
import { useLocation } from "react-router-dom";
import { useEffect, useState, lazy, Suspense } from "react";
import { AuthContextProvider, useAuthContext } from '@/contexts/AuthContext';
import { useConnectionStore } from '@/stores/connectionStore';
import { useNativeApp } from './hooks/useNativeApp';
import { useSupabaseOAuthDeepLink } from './hooks/useSupabaseOAuthDeepLink';
import { HookConsistencyBoundary } from './components/HookConsistencyBoundary';



// Using optimized query client from @/lib/query-client
const AdminOverview = lazy(() => import("./pages/AdminOverview"));
const AdminOperations = lazy(() => import("./pages/admin/Operations"));
const AdminContent = lazy(() => import("./pages/admin/Content"));
const AdminBranding = lazy(() => import("./pages/admin/Branding"));
const AdminPayments = lazy(() => import("./pages/admin/Payments"));
const AdminDev = lazy(() => import("./pages/admin/Dev"));
// Persist React Query cache to storage for offline reads
if (typeof window !== 'undefined') {
  const persister = createSyncStoragePersister({
    storage: window.localStorage,
    throttleTime: 1000,
  });
  persistQueryClient({
    queryClient,
    persister,
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
  });
}

interface AppContentProps {
  isNativeApp: boolean;
  platform: string;
}

const AppContent = ({ isNativeApp, platform }: AppContentProps) => {
  // All hooks must be called consistently - no conditional hooks!
  const location = useLocation();
  const { user } = useAuthContext();
  const { profile, isProfileComplete } = useProfile();
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Set up OAuth deep link handling for native app (crash-proof)
  useSupabaseOAuthDeepLink();
  
  // Simplified startup with clear states
  const { state, error, isOnline, retry, forceRefresh } = useSimplifiedStartup(isNativeApp);
  
  // Load dynamic assets AFTER startup is complete (deferred, non-blocking)
  useDeferredAssets(isNativeApp);

  // Native app setup
  useEffect(() => {
    // Hide browser UI for native apps
    if (isNativeApp) {
      // Hide address bar and browser chrome
      const metaViewport = document.querySelector('meta[name="viewport"]');
      if (metaViewport) {
        metaViewport.setAttribute('content', 
          'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
        );
      }
      
      // Add native app class to body
      document.body.classList.add('native-app', `platform-${platform}`);
      
      // Remove any browser-specific styling
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }
  }, [isNativeApp, platform]);

  // Hide navigation on auth routes
  const isAuthRoute = location.pathname === '/auth' || location.pathname === '/reset-password' || location.pathname === '/update-password';
  
  // Initialize analytics on app startup (non-blocking)
  useEffect(() => {
    const initAnalytics = async () => {
      try {
        await initializeAnalytics();
      } catch (error) {
        console.warn('Analytics initialization failed (non-critical):', error);
      }
    };
    
    // Defer analytics initialization to not block app startup
    setTimeout(initAnalytics, 1000);
  }, []);
  
  // Track page views on route changes
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  // Show onboarding if user is authenticated and profile is incomplete
  useEffect(() => {
    // Only check onboarding for authenticated users with loaded profile data
    if (user && profile !== null) {
      const profileComplete = isProfileComplete();
      console.log('Profile onboarding check:', {
        user: !!user,
        // profile omitted for security
        profileComplete,
        weight: profile?.weight,
        height: profile?.height,
        age: profile?.age
      });
      setShowOnboarding(!profileComplete);
    } else {
      // User not authenticated or profile not loaded yet - don't show onboarding
      setShowOnboarding(false);
    }
  }, [user, profile, isProfileComplete]);

  // Handle browser back/forward navigation when offline
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // When offline, ensure we stay within the SPA
      if (!isOnline) {
        // Let React Router handle the navigation naturally
        // The service worker will serve the cached index.html
        console.log('Offline navigation detected, using cached app shell');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isOnline]);
  
  // Wrap everything in SimplifiedStartup
  return (
    <SimplifiedStartup 
      state={state} 
      error={error}
      isOnline={isOnline}
      onRetry={retry}
      onForceRefresh={forceRefresh}
    >
      {/* Desktop frame background */}
      <div className="min-h-screen bg-frame-background overflow-x-hidden">
        {/* Mobile-first centered container with phone-like frame */}
        <div className={`mx-auto max-w-md min-h-screen bg-background relative shadow-2xl overflow-x-hidden ${isAuthRoute ? '' : 'px-4'}`}>
          <SEOManager />
          {!isAuthRoute && <DailyStatsPanel />}
          <Routes>
            <Route path="/auth" element={
              <PageErrorBoundary>
                <Auth />
              </PageErrorBoundary>
            } />
            <Route path="/reset-password" element={
              <PageErrorBoundary>
                <ResetPassword />
              </PageErrorBoundary>
            } />
            <Route path="/update-password" element={
              <PageErrorBoundary>
                <UpdatePassword />
              </PageErrorBoundary>
            } />
            <Route path="/" element={
              <ProtectedRoute>
                <PageErrorBoundary>
                  <Timer />
                </PageErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/motivators" element={
              <ProtectedRoute>
                <PageErrorBoundary>
                  <Motivators />
                </PageErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/motivator-ideas" element={
              <ProtectedRoute>
                <PageErrorBoundary>
                  <MotivatorIdeas />
                </PageErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <PageErrorBoundary>
                  <Settings />
                </PageErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/walking" element={
              <ProtectedRoute>
                <PageErrorBoundary>
                  <Walking />
                </PageErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/food-tracking" element={
              <ProtectedRoute>
                <PageErrorBoundary>
                  <FoodTracking />
                </PageErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/admin" element={<Navigate to="/admin/operations" replace />} />
            <Route path="/admin/operations" element={
              <ProtectedRoute>
                <AdminProtectedRoute>
                  <PageErrorBoundary>
                    <Suspense fallback={<div className="p-6"><div className="h-6 w-32 rounded bg-muted animate-pulse" /></div>}>
                      <AdminOperations />
                    </Suspense>
                  </PageErrorBoundary>
                </AdminProtectedRoute>
              </ProtectedRoute>
            } />
            <Route path="/admin/content" element={
              <ProtectedRoute>
                <AdminProtectedRoute>
                  <PageErrorBoundary>
                    <Suspense fallback={<div className="p-6"><div className="h-6 w-32 rounded bg-muted animate-pulse" /></div>}>
                      <AdminContent />
                    </Suspense>
                  </PageErrorBoundary>
                </AdminProtectedRoute>
              </ProtectedRoute>
            } />
            <Route path="/admin/branding" element={
              <ProtectedRoute>
                <AdminProtectedRoute>
                  <PageErrorBoundary>
                    <Suspense fallback={<div className="p-6"><div className="h-6 w-32 rounded bg-muted animate-pulse" /></div>}>
                      <AdminBranding />
                    </Suspense>
                  </PageErrorBoundary>
                </AdminProtectedRoute>
              </ProtectedRoute>
            } />
            <Route path="/admin/payments" element={
              <ProtectedRoute>
                <AdminProtectedRoute>
                  <PageErrorBoundary>
                    <Suspense fallback={<div className="p-6"><div className="h-6 w-32 rounded bg-muted animate-pulse" /></div>}>
                      <AdminPayments />
                    </Suspense>
                  </PageErrorBoundary>
                </AdminProtectedRoute>
              </ProtectedRoute>
            } />
            <Route path="/admin/dev" element={
              <ProtectedRoute>
                <AdminProtectedRoute>
                  <PageErrorBoundary>
                    <Suspense fallback={<div className="p-6"><div className="h-6 w-32 rounded bg-muted animate-pulse" /></div>}>
                      <AdminDev />
                    </Suspense>
                  </PageErrorBoundary>
                </AdminProtectedRoute>
              </ProtectedRoute>
            } />
            <Route path="/health" element={
              <PageErrorBoundary>
                <HealthCheck />
              </PageErrorBoundary>
            } />
            <Route path="*" element={
              <PageErrorBoundary>
                <NotFound />
              </PageErrorBoundary>
            } />
          </Routes>
          {!isAuthRoute && <Navigation />}
        </div>
      </div>
      
      {/* Global Profile Onboarding */}
      <GlobalProfileOnboarding
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />
    </SimplifiedStartup>
  );
};

const App = () => {
  const { isNativeApp, platform } = useNativeApp();
  const Router = isNativeApp ? MemoryRouter : BrowserRouter;
  
  // For native apps, apply minimal styling immediately
  useEffect(() => {
    if (isNativeApp && typeof window !== 'undefined') {
      document.body.classList.add('native-app', `platform-${platform}`);
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }
  }, [isNativeApp, platform]);
  
  return (
    <CriticalErrorBoundary 
      onError={(error, errorInfo) => {
        console.error('App-level error:', error, errorInfo);
        // Could send to error tracking service here
      }}
    >
      <QueryClientProvider client={queryClient}>
        <HookConsistencyBoundary>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            
            <Router>
              <AsyncErrorBoundary>
                <ThemeProvider>
                  <AuthContextProvider>
                    <SimpleWalkingStatsProvider>
                      <AppContent isNativeApp={isNativeApp} platform={platform} />
                    </SimpleWalkingStatsProvider>
                  </AuthContextProvider>
                </ThemeProvider>
              </AsyncErrorBoundary>
            </Router>
          </TooltipProvider>
        </HookConsistencyBoundary>
      </QueryClientProvider>
    </CriticalErrorBoundary>
  );
};

export default App;
