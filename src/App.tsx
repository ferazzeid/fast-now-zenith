import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CriticalErrorBoundary, PageErrorBoundary } from "@/components/enhanced/ComprehensiveErrorBoundary";
import { AsyncErrorBoundary } from "@/components/AsyncErrorBoundary";
import Timer from "./pages/Timer";
import Motivators from "./pages/Motivators";

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
import { AuthProvider } from "./providers/AuthProvider";
import { EnhancedConnectionStatus } from "./components/enhanced/ConnectionRecovery";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useColorTheme } from "./hooks/useColorTheme";
import { useDynamicFavicon } from "./hooks/useDynamicFavicon";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import { DailyStatsPanel } from "./components/DailyStatsPanel";
import { SimpleWalkingStatsProvider } from "./contexts/SimplifiedWalkingStats";
import { initializeAnalytics, trackPageView } from "./utils/analytics";
import { SEOManager } from "./components/SEOManager";
import { useLocation } from "react-router-dom";
import { useEffect, useState, lazy, Suspense } from "react";
import { useAuthStore } from '@/stores/authStore';

// Using optimized query client from @/lib/query-client
const AdminOverview = lazy(() => import("./pages/AdminOverview"));
const AdminOperations = lazy(() => import("./pages/admin/Operations"));
const AdminContent = lazy(() => import("./pages/admin/Content"));
const AdminBranding = lazy(() => import("./pages/admin/Branding"));
const AdminPayments = lazy(() => import("./pages/admin/Payments"));
const AppContent = () => {
  // Load color theme on app startup
  useColorTheme();
  // Load dynamic favicon from admin settings
  useDynamicFavicon();
  const location = useLocation();
  const user = useAuthStore(state => state.user);
  const { profile, isProfileComplete } = useProfile();
  const [showOnboarding, setShowOnboarding] = useState(false);
  
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
    if (user && profile !== undefined) {
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
    }
  }, [user, profile, isProfileComplete]);
  
  return (
    <>
      {/* Desktop frame background */}
      <div className="min-h-screen bg-frame-background overflow-x-hidden">
        {/* Mobile-first centered container with phone-like frame */}
        <div className="mx-auto max-w-md min-h-screen bg-background relative shadow-2xl px-4 overflow-x-hidden">
          <SEOManager />
          <EnhancedConnectionStatus />
          <DailyStatsPanel />
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
          <Navigation />
        </div>
      </div>
      
      {/* Global Profile Onboarding */}
      
      <GlobalProfileOnboarding
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />
    </>
  );
};

const App = () => (
  <CriticalErrorBoundary 
    onError={(error, errorInfo) => {
      console.error('App-level error:', error, errorInfo);
      // Could send to error tracking service here
    }}
  >
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AsyncErrorBoundary>
            <ThemeProvider>
              <AuthProvider>
                <SimpleWalkingStatsProvider>
                  <AppContent />
                </SimpleWalkingStatsProvider>
              </AuthProvider>
            </ThemeProvider>
          </AsyncErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </CriticalErrorBoundary>
);

export default App;
