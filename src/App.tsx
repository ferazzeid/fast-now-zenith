import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary, PageErrorBoundary } from "@/components/ErrorBoundary";
import { AsyncErrorBoundary } from "@/components/AsyncErrorBoundary";
import Timer from "./pages/Timer";
import Motivators from "./pages/Motivators";

import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import UpdatePassword from "./pages/UpdatePassword";
import AdminOverview from "./pages/AdminOverview";

import NotFound from "./pages/NotFound";
import Walking from "./pages/Walking";
import FoodTracking from "./pages/FoodTracking";
import { HealthCheck } from "./pages/HealthCheck";
import { Navigation } from "./components/Navigation";
import { AuthProvider } from "./hooks/useAuth";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useColorTheme } from "./hooks/useColorTheme";
import ProtectedRoute from "./components/ProtectedRoute";
import { DailyStatsPanel } from "./components/DailyStatsPanel";
import { WalkingStatsProvider } from "./contexts/WalkingStatsContext";

const queryClient = new QueryClient();

const AppContent = () => {
  // Load color theme on app startup
  useColorTheme();
  
  return (
    <>
      {/* Desktop frame background */}
      <div className="min-h-screen bg-frame-background">
        {/* Mobile-first centered container with phone-like frame */}
        <div className="mx-auto max-w-md min-h-screen bg-background relative shadow-2xl">
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
            <Route path="/admin" element={
              <ProtectedRoute>
                <PageErrorBoundary>
                  <AdminOverview />
                </PageErrorBoundary>
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
    </>
  );
};

const App = () => (
  <ErrorBoundary 
    level="critical" 
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
                <WalkingStatsProvider>
                  <AppContent />
                </WalkingStatsProvider>
              </AuthProvider>
            </ThemeProvider>
          </AsyncErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
