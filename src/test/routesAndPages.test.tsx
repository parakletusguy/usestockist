import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/contexts/AuthContext';
import { BranchProvider } from '@/contexts/BranchContext';
import { AppLayout } from '@/components/layout/AppLayout';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Install from '@/pages/Install';
import Dashboard from '@/pages/Dashboard';
import Received from '@/pages/Received';
import Transfers from '@/pages/Transfers';
import Issuance from '@/pages/Issuance';
import StockCount from '@/pages/StockCount';
import ItemSalesReport from '@/pages/ItemSalesReport';
import ItemManager from '@/pages/ItemManager';
import PurchaseOrders from '@/pages/PurchaseOrders';
import DepartmentView from '@/pages/DepartmentView';
import AIAssistantPage from '@/pages/AIAssistantPage';
import Settings from '@/pages/Settings';
import BranchManager from '@/pages/BranchManager';
import NotFound from '@/pages/NotFound';
import { mockSupabase } from './setup';

function renderWithProviders(initialRoute: string, element: React.ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <BranchProvider>
            <MemoryRouter initialEntries={[initialRoute]}>
              {element}
            </MemoryRouter>
          </BranchProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

describe('UI Routes & Page Endpoints Audit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders /login page without crashing', async () => {
    mockSupabase.auth.getSession.mockResolvedValueOnce({ data: { session: null }, error: null });
    renderWithProviders('/login', <Login />);
    await waitFor(() => {
      expect(screen.getAllByText(/sign in|login|welcome/i)[0]).toBeInTheDocument();
    });
  });

  it('renders /signup page without crashing', async () => {
    mockSupabase.auth.getSession.mockResolvedValueOnce({ data: { session: null }, error: null });
    renderWithProviders('/signup', <Signup />);
    await waitFor(() => {
      expect(screen.getAllByText(/sign up|register|create/i)[0]).toBeInTheDocument();
    });
  });


  it('renders /install PWA page without crashing', async () => {
    renderWithProviders('/install', <Install />);
    await waitFor(() => {
      expect(screen.getAllByText(/install|app/i)[0]).toBeInTheDocument();
    });
  });


  it('renders Dashboard page (/) inside AppLayout', async () => {
    renderWithProviders(
      '/',
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
        </Route>
      </Routes>
    );
    await waitFor(() => {
      expect(screen.getAllByText(/dashboard|inventory|stock/i)[0]).toBeInTheDocument();
    });
  });

  it('renders /ledgers/received page inside AppLayout', async () => {
    renderWithProviders(
      '/ledgers/received',
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/ledgers/received" element={<Received />} />
        </Route>
      </Routes>
    );
    await waitFor(() => {
      expect(screen.getAllByText(/received|supplier|stock in/i)[0]).toBeInTheDocument();
    });
  });

  it('renders /ledgers/transfers page inside AppLayout', async () => {
    renderWithProviders(
      '/ledgers/transfers',
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/ledgers/transfers" element={<Transfers />} />
        </Route>
      </Routes>
    );
    await waitFor(() => {
      expect(screen.getAllByText(/transfer|destination/i)[0]).toBeInTheDocument();
    });
  });

  it('renders /ledgers/issuance page inside AppLayout', async () => {
    renderWithProviders(
      '/ledgers/issuance',
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/ledgers/issuance" element={<Issuance />} />
        </Route>
      </Routes>
    );
    await waitFor(() => {
      expect(screen.getAllByText(/issuance|issued/i)[0]).toBeInTheDocument();
    });
  });

  it('renders /ledgers/stock-count page inside AppLayout', async () => {
    renderWithProviders(
      '/ledgers/stock-count',
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/ledgers/stock-count" element={<StockCount />} />
        </Route>
      </Routes>
    );
    await waitFor(() => {
      expect(screen.getAllByText(/daily stock|stock count|sheet/i)[0]).toBeInTheDocument();
    });
  });

  it('renders /ledgers/item-sales page inside AppLayout', async () => {
    renderWithProviders(
      '/ledgers/item-sales',
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/ledgers/item-sales" element={<ItemSalesReport />} />
        </Route>
      </Routes>
    );
    await waitFor(() => {
      expect(screen.getAllByText(/reach|sales|report/i)[0]).toBeInTheDocument();
    });
  });

  it('renders /ledgers/items page inside AppLayout', async () => {
    renderWithProviders(
      '/ledgers/items',
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/ledgers/items" element={<ItemManager />} />
        </Route>
      </Routes>
    );
    await waitFor(() => {
      expect(screen.getAllByText(/item|catalog|inventory/i)[0]).toBeInTheDocument();
    });
  });

  it('renders /ledgers/purchase-orders page inside AppLayout', async () => {
    renderWithProviders(
      '/ledgers/purchase-orders',
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/ledgers/purchase-orders" element={<PurchaseOrders />} />
        </Route>
      </Routes>
    );
    await waitFor(() => {
      expect(screen.getAllByText(/purchase orders|predictive|reorder/i)[0]).toBeInTheDocument();
    });
  });

  it('renders /departments/Retail page inside AppLayout', async () => {
    renderWithProviders(
      '/departments/Retail',
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/departments/:departmentId" element={<DepartmentView />} />
        </Route>
      </Routes>
    );
    await waitFor(() => {
      expect(screen.getAllByText(/retail|department/i)[0]).toBeInTheDocument();
    });
  });

  it('renders /ai-assistant page inside AppLayout', async () => {
    renderWithProviders(
      '/ai-assistant',
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/ai-assistant" element={<AIAssistantPage />} />
        </Route>
      </Routes>
    );
    await waitFor(() => {
      expect(screen.getAllByText(/ai|assistant|insights/i)[0]).toBeInTheDocument();
    });
  });

  it('renders /settings page', async () => {
    renderWithProviders('/settings', <Settings />);
    await waitFor(() => {
      expect(screen.getAllByText(/settings|profile|password/i)[0]).toBeInTheDocument();
    });
  });

  it('renders 404 NotFound page for unknown route', async () => {
    renderWithProviders('/unknown-route-123', <NotFound />);
    expect(screen.getAllByText(/404|not found/i)[0]).toBeInTheDocument();
  });
});
