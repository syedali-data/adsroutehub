import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";
import { BuyerProtectedRoute } from "@/components/BuyerProtectedRoute";
import { DashboardLayout } from "@/components/DashboardLayout";
import { LoadingGuard } from "@/components/LoadingGuard";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import Buyers from "./pages/Buyers";
import Deliveries from "./pages/Deliveries";
import Refunds from "./pages/Refunds";
import Campaigns from "./pages/Campaigns";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import BuyerLogin from "./pages/buyer/Login";
import BuyerDashboard from "./pages/buyer/Dashboard";
import RoutingTest from "./pages/admin/RoutingTest";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      staleTime: 30000, // Consider data fresh for 30 seconds
      gcTime: 5 * 60 * 1000, // Keep unused data in cache for 5 minutes
      // Don't retry forever - stop after 2 attempts
      onError: (error) => {
        console.error('🔍 [QueryClient] Query error:', error);
      }
    }
  }
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          
          {/* Buyer Portal Routes */}
          <Route path="/buyer/login" element={<BuyerLogin />} />
          <Route 
            path="/buyer/dashboard" 
            element={
              <BuyerProtectedRoute>
                <BuyerDashboard />
              </BuyerProtectedRoute>
            } 
          />
          
          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/leads"
            element={
              <AdminProtectedRoute>
                <DashboardLayout>
                  <Leads />
                </DashboardLayout>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/buyers"
            element={
              <AdminProtectedRoute>
                <DashboardLayout>
                  <Buyers />
                </DashboardLayout>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/deliveries"
            element={
              <AdminProtectedRoute>
                <DashboardLayout>
                  <Deliveries />
                </DashboardLayout>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/refunds"
            element={
              <AdminProtectedRoute>
                <DashboardLayout>
                  <Refunds />
                </DashboardLayout>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/campaigns"
            element={
              <AdminProtectedRoute>
                <DashboardLayout>
                  <Campaigns />
                </DashboardLayout>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <AdminProtectedRoute>
                <DashboardLayout>
                  <Settings />
                </DashboardLayout>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/routing-test"
            element={
              <AdminProtectedRoute>
                <RoutingTest />
              </AdminProtectedRoute>
            }
          />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
