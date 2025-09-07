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
// Content page removed - URLs no longer needed

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
import AddFood from "./pages/AddFood";
import MyFoods from "./pages/MyFoods";
import WalkingHistory from "./pages/WalkingHistory";
import FoodHistory from "./pages/FoodHistory";
import FastingHistory from "./pages/FastingHistory";
import { HealthCheck } from "./pages/HealthCheck";
import { Navigation } from "./components/Navigation";


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
import { useColorTheme } from '@/hooks/useColorTheme';



// Using optimized query client from @/lib/query-client
const AdminOverview = lazy(() => import("./pages/AdminOverview"));
const AdminOperations = lazy(() => import("./pages/admin/Operations"));
const AdminContent = lazy(() => import("./pages/admin/Content"));
const AdminAI = lazy(() => import("./pages/admin/AI"));
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


const AppContent = () => {
  // All hooks must be called consistently - no conditional hooks!
  const location = useLocation();
  const user = useAuthStore(state => state.user);
  const loading = useAuthStore(state => state.loading);
  const initialize = useAuthStore(state => state.initialize);
  const { profile, isProfileComplete } = useProfile();
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Initialize auth system on app startup
  useEffect(() => {
    initialize();
  }, [initialize]);
  
  // Load colors immediately without authentication dependency
  const { loading: colorLoading } = useColorTheme(true);


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

  // Show onboarding if user is authenticated and profile is incomplete (non-blocking)
  useEffect(() => {
    if (user && profile !== null) {
      const profileComplete = isProfileComplete();
      setShowOnboarding(!profileComplete);
    } else {
      setShowOnboarding(false);
    }
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
            {/* Content route removed - URLs no longer needed */}
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
            <Route path="/food-tracking" element={
              <ProtectedRoute>
                <PageErrorBoundary>
                  <FoodTracking />
                </PageErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/add-food" element={
              <ProtectedRoute>
                <PageErrorBoundary>
                  <AddFood />
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
            <Route path="/admin/ai" element={
              <ProtectedRoute>
                <AdminProtectedRoute>
                  <PageErrorBoundary>
                    <Suspense fallback={<div className="p-6"><div className="h-6 w-32 rounded bg-muted animate-pulse" /></div>}>
                      <AdminAI />
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
                <Router>
                  <AsyncErrorBoundary>
                    <AppContent />
                  </AsyncErrorBoundary>
                </Router>
              </SimpleWalkingStatsProvider>
            </ThemeProvider>
          </TooltipProvider>
        </HookConsistencyBoundary>
      </QueryClientProvider>
    </CriticalErrorBoundary>
  );
};

export default App;
