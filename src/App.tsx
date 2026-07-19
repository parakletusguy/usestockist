import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import ItemManager from "./pages/ItemManager";
import Reports from "./pages/Reports";
import WeeklyCount from "./pages/WeeklyCount";
import Issuance from "./pages/Issuance";
import Transfers from "./pages/Transfers";
import Received from "./pages/Received";
import Insights from "./pages/Insights";
import NotFound from "./pages/NotFound";
import Install from "./pages/Install";
import OAuthConsent from "./pages/OAuthConsent";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/install" element={<Install />} />
            <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/items" element={<ItemManager />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/weekly-count" element={<WeeklyCount />} />
              <Route path="/issuance" element={<Issuance />} />
              <Route path="/transfers" element={<Transfers />} />
              <Route path="/received" element={<Received />} />
              <Route path="/insights" element={<Insights />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
