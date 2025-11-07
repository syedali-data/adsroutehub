import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/DashboardLayout";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/leads"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Leads />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyers"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Buyers />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/deliveries"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Deliveries />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/refunds"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Refunds />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/campaigns"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Campaigns />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Settings />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          
          {/* Buyer Portal Routes */}
          <Route path="/buyer/login" element={<BuyerLogin />} />
          <Route path="/buyer/dashboard" element={<BuyerDashboard />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
