import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import ItemManager from "./pages/ItemManager";
import StockCount from "./pages/StockCount";
import ItemSalesReport from "./pages/ItemSalesReport";
import Issuance from "./pages/Issuance";
import Transfers from "./pages/Transfers";
import Received from "./pages/Received";
import DepartmentView from "./pages/DepartmentView";
import AIAssistantPage from "./pages/AIAssistantPage";
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
              
              {/* Ledgers Group */}
              <Route path="/ledgers/received" element={<Received />} />
              <Route path="/ledgers/transfers" element={<Transfers />} />
              <Route path="/ledgers/issuance" element={<Issuance />} />
              <Route path="/ledgers/stock-count" element={<StockCount />} />
              <Route path="/ledgers/item-sales" element={<ItemSalesReport />} />
              <Route path="/ledgers/items" element={<ItemManager />} />
              
              {/* Departments Group */}
              <Route path="/departments/:departmentId" element={<DepartmentView />} />
              
              {/* AI Assistant */}
              <Route path="/ai-assistant" element={<AIAssistantPage />} />

              {/* Backward compatibility redirects */}
              <Route path="/items" element={<Navigate to="/ledgers/items" replace />} />
              <Route path="/received" element={<Navigate to="/ledgers/received" replace />} />
              <Route path="/transfers" element={<Navigate to="/ledgers/transfers" replace />} />
              <Route path="/issuance" element={<Navigate to="/ledgers/issuance" replace />} />
              <Route path="/daily-stock-count" element={<Navigate to="/ledgers/stock-count" replace />} />
              <Route path="/reports" element={<Navigate to="/ledgers/item-sales" replace />} />
              <Route path="/insights" element={<Navigate to="/ai-assistant" replace />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
