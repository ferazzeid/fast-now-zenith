import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CriticalErrorBoundary, PageErrorBoundary } from "@/components/enhanced/ComprehensiveErrorBoundary";
import { AsyncErrorBoundary } from "@/components/AsyncErrorBoundary";
import Timer from "./pages/Timer";
import Motivators from "./pages/Motivators";
import MotivatorIdeas from "./pages/MotivatorIdeas";


import { ErrorBoundary } from '@/components/ErrorBoundary';
import { GlobalProfileOnboarding } from '@/components/GlobalProfileOnboarding';
import { useProfile } from '@/hooks/useProfile';
import Settings from "./pages/Settings";
import Account from "./pages/Account";

import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import ResetPassword from "./pages/ResetPassword";
import UpdatePassword from "./pages/UpdatePassword";


// import AdminOverview from "./pages/AdminOverview";

import NotFound from "./pages/NotFound";
import Walking from "./pages/Walking";
import FoodTracking from "./pages/FoodTracking";

import MyFoods from "./pages/MyFoods";
import WalkingHistory from "./pages/WalkingHistory";
import FoodHistory from "./pages/FoodHistory";
import FastingHistory from "./pages/FastingHistory";
import IntermittentFastingHistory from "./pages/IntermittentFastingHistory";
import IntermittentFasting from "./pages/IntermittentFasting";
import { HealthCheck } from "./pages/HealthCheck";
import { SmartHomeRedirect } from "./components/SmartHomeRedirect";
import { NavigationGuard } from "./components/NavigationGuard";
import { Navigation } from "./components/Navigation";
import { NavigationPreferencesProvider } from "@/contexts/NavigationPreferencesContext";


import { ThemeProvider } from "./contexts/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import { DailyStatsPanel } from "./components/DailyStatsPanel";
import { SimpleWalkingStatsProvider } from "./contexts/SimplifiedWalkingStats";
import { initializeAnalytics, trackPageView } from "./utils/analytics";
import { performCompleteAuthCacheReset } from "./utils/cacheUtils";
import { SEOManager } from "./components/SEOManager";
import { useLocation } from "react-router-dom";
import { useEffect, useState, lazy, Suspense } from "react";
import { useAuthStore } from '@/stores/authStore';

import { HookConsistencyBoundary } from './components/HookConsistencyBoundary';
import { supabase } from '@/integrations/supabase/client';



// Using optimized query client from @/lib/query-client
const AdminData = lazy(() => import("./pages/admin/Data"));
const AdminOperations = lazy(() => import("./pages/admin/Operations"));
const AdminContent = lazy(() => import("./pages/admin/Content"));
const AdminAI = lazy(() => import("./pages/admin/AI"));
const AdminFunctions = lazy(() => import("./pages/admin/Functions"));
const AdminBranding = lazy(() => import("./pages/admin/Branding"));
const AdminPayments = lazy(() => import("./pages/admin/Payments"));
const AdminAnimations = lazy(() => import("./pages/admin/Animations"));
// Initialize React Query cache persistence immediately - data loading is critical
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


const AppContent = () => {
  // All hooks must be called consistently - no conditional hooks!
  const location = useLocation();
  const user = useAuthStore(state => state.user);
  const loading = useAuthStore(state => state.loading);
  const initialize = useAuthStore(state => state.initialize);
  const { profile, isProfileComplete } = useProfile();
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Apply user's primary color from profile to global CSS variables
  useEffect(() => {
    if (profile?.primary_color) {
      const hexToHsl = (hex: string): string => {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0;
        let s = 0;
        const l = (max + min) / 2;

        if (max !== min) {
          const d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          
          switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
          }
          h /= 6;
        }

        return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
      };

      // Apply the user's primary color globally
      const hslValue = hexToHsl(profile.primary_color);
      document.documentElement.style.setProperty('--primary', hslValue);
      document.documentElement.style.setProperty('--ring', hslValue);
      
      console.log('Applied user primary color:', profile.primary_color, '→', hslValue);
    }
  }, [profile?.primary_color]);
  // Initialize auth system on app startup (critical)
  useEffect(() => {
    initialize();
  }, [initialize]);
  
  // Colors are now static in CSS - no loading needed

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
    
    // Defer analytics initialization even longer to not block app startup
    setTimeout(initAnalytics, 2000);
  }, []);
  
  // Track page views on route changes
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  // Show onboarding if user is authenticated and profile is incomplete (deferred)
  useEffect(() => {
    // Defer onboarding check to not block initial render
    const checkOnboarding = () => {
      if (user && profile !== null) {
        const profileComplete = isProfileComplete();
        setShowOnboarding(!profileComplete);
      } else {
        setShowOnboarding(false);
      }
    };
    
    checkOnboarding();
  }, [user, profile, isProfileComplete]);

  // Track page views on route changes
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  // App is ready to render
  return (
    <div>
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
             <Route path="/auth/callback" element={
               <PageErrorBoundary>
                 <AuthCallback />
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
                   <SmartHomeRedirect />
                 </PageErrorBoundary>
               </ProtectedRoute>
             } />
             <Route path="/timer" element={
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
            <Route path="/account" element={
              <ProtectedRoute>
                <PageErrorBoundary>
                  <Account />
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
             <Route path="/intermittent-fasting" element={
               <ProtectedRoute>
                 <PageErrorBoundary>
                   <IntermittentFasting />
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
            <Route path="/my-foods" element={
              <ProtectedRoute>
                <PageErrorBoundary>
                  <MyFoods />
                </PageErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/walking-history" element={
              <ProtectedRoute>
                <PageErrorBoundary>
                  <WalkingHistory />
                </PageErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/food-history" element={
              <ProtectedRoute>
                <PageErrorBoundary>
                  <FoodHistory />
                </PageErrorBoundary>
              </ProtectedRoute>
            } />
             <Route path="/fasting-history" element={
               <ProtectedRoute>
                 <PageErrorBoundary>
                   <FastingHistory />
                 </PageErrorBoundary>
               </ProtectedRoute>
             } />
             <Route path="/intermittent-fasting-history" element={
               <ProtectedRoute>
                 <PageErrorBoundary>
                   <IntermittentFastingHistory />
                 </PageErrorBoundary>
               </ProtectedRoute>
             } />
            <Route path="/admin" element={<Navigate to="/admin/data" replace />} />
            <Route path="/admin/data" element={
              <ProtectedRoute>
                <AdminProtectedRoute>
                  <PageErrorBoundary>
                    <Suspense fallback={
                      <div className="container mx-auto p-6 space-y-4">
                        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="h-48 rounded-lg bg-muted animate-pulse" />
                          <div className="h-48 rounded-lg bg-muted animate-pulse" />
                        </div>
                      </div>
                    }>
                      <AdminData />
                    </Suspense>
                  </PageErrorBoundary>
                </AdminProtectedRoute>
              </ProtectedRoute>
            } />
            <Route path="/admin/operations" element={
              <ProtectedRoute>
                <AdminProtectedRoute>
                  <PageErrorBoundary>
                    <Suspense fallback={
                      <div className="container mx-auto p-6 space-y-4">
                        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
                        <div className="space-y-6">
                          <div className="h-32 rounded-lg bg-muted animate-pulse" />
                          <div className="h-48 rounded-lg bg-muted animate-pulse" />
                        </div>
                      </div>
                    }>
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
                    <Suspense fallback={
                      <div className="container mx-auto p-6 space-y-4">
                        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
                        <div className="h-64 rounded-lg bg-muted animate-pulse" />
                      </div>
                    }>
                      <AdminContent />
                    </Suspense>
                  </PageErrorBoundary>
                </AdminProtectedRoute>
              </ProtectedRoute>
            } />
            <Route path="/admin/ai" element={
              <ProtectedRoute>
                <AdminProtectedRoute>
                  <PageErrorBoundary>
                    <Suspense fallback={
                      <div className="container mx-auto p-6 space-y-4">
                        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
                        <div className="h-64 rounded-lg bg-muted animate-pulse" />
                      </div>
                    }>
                      <AdminAI />
                    </Suspense>
                  </PageErrorBoundary>
                </AdminProtectedRoute>
              </ProtectedRoute>
            } />
            <Route path="/admin/functions" element={
              <ProtectedRoute>
                <AdminProtectedRoute>
                  <PageErrorBoundary>
                    <Suspense fallback={
                      <div className="container mx-auto p-6 space-y-4">
                        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
                        <div className="h-64 rounded-lg bg-muted animate-pulse" />
                      </div>
                    }>
                      <AdminFunctions />
                    </Suspense>
                  </PageErrorBoundary>
                </AdminProtectedRoute>
              </ProtectedRoute>
            } />
            <Route path="/admin/branding" element={
              <ProtectedRoute>
                <AdminProtectedRoute>
                  <PageErrorBoundary>
                    <Suspense fallback={
                      <div className="container mx-auto p-6 space-y-4">
                        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
                        <div className="h-64 rounded-lg bg-muted animate-pulse" />
                      </div>
                    }>
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
                    <Suspense fallback={
                      <div className="container mx-auto p-6 space-y-4">
                        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
                        <div className="h-64 rounded-lg bg-muted animate-pulse" />
                      </div>
                    }>
                      <AdminPayments />
                    </Suspense>
                  </PageErrorBoundary>
                </AdminProtectedRoute>
              </ProtectedRoute>
            } />
            <Route path="/admin/animations" element={
              <ProtectedRoute>
                <AdminProtectedRoute>
                  <PageErrorBoundary>
                    <Suspense fallback={
                      <div className="container mx-auto p-6 space-y-4">
                        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
                        <div className="h-64 rounded-lg bg-muted animate-pulse" />
                      </div>
                    }>
                      <AdminAnimations />
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
    </div>
  );
};

const App = () => {
  // For TWA deployment, always use BrowserRouter
  const Router = BrowserRouter;
  
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
            
            <ThemeProvider>
              <SimpleWalkingStatsProvider>
                <NavigationPreferencesProvider>
                  <Router>
                    <NavigationGuard>
                      <AsyncErrorBoundary>
                        <AppContent />
                      </AsyncErrorBoundary>
                    </NavigationGuard>
                  </Router>
                </NavigationPreferencesProvider>
              </SimpleWalkingStatsProvider>
            </ThemeProvider>
          </TooltipProvider>
        </HookConsistencyBoundary>
      </QueryClientProvider>
    </CriticalErrorBoundary>
  );
};

export default App;
