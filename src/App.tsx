import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Timer from "./pages/Timer";
import Motivators from "./pages/Motivators";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import UpdatePassword from "./pages/UpdatePassword";
import AdminOverview from "./pages/AdminOverview";
import { UserManagement } from "./pages/UserManagement";
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
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Timer />
              </ProtectedRoute>
            } />
            <Route path="/motivators" element={
              <ProtectedRoute>
                <Motivators />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="/walking" element={
              <ProtectedRoute>
                <Walking />
              </ProtectedRoute>
            } />
            <Route path="/food-tracking" element={
              <ProtectedRoute>
                <FoodTracking />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminOverview />
              </ProtectedRoute>  
            } />
            <Route path="/user-management" element={
              <ProtectedRoute>
                <UserManagement />
              </ProtectedRoute>  
            } />
            <Route path="/health" element={<HealthCheck />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Navigation />
        </div>
      </div>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <WalkingStatsProvider>
              <AppContent />
            </WalkingStatsProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
