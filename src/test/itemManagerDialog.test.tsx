import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import ItemManager from '@/pages/ItemManager';
import { mockSupabase } from './setup';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/contexts/AuthContext';
import { BranchProvider } from '@/contexts/BranchContext';
import { MemoryRouter } from 'react-router-dom';

function renderWithProviders(initialRoute: string, element: React.ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });

  return (
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

describe('ItemManager Dialog QA', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens dialog, toggles departments without crashing or blanking', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'user-1',
            email: 'manager@example.com',
            app_metadata: { role: 'manager' },
            user_metadata: { role: 'manager' },
          },
          access_token: 'fake-jwt',
        },
      },
      error: null,
    });

    const { render } = await import('@testing-library/react');
    render(
      renderWithProviders(
        '/ledgers/items',
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/ledgers/items" element={<ItemManager />} />
          </Route>
        </Routes>
      )
    );

    // Wait for Items Manager heading after query resolves
    await waitFor(() => {
      expect(screen.getByText('Items Manager')).toBeInTheDocument();
    });

    // Wait for "Add Item" button
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add item/i })).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /add item/i });
    fireEvent.click(addButton);

    // Dialog title should appear
    await waitFor(() => {
      expect(screen.getByText('Add New Item')).toBeInTheDocument();
    });

    // Find and click department buttons
    const depts = ['Retail', 'Cube', 'Bar', 'Kitchen', 'Housekeeping', 'PPK', 'Nox'];
    for (const dept of depts) {
      const deptButton = screen.getByRole('button', { name: new RegExp(dept, 'i') });
      expect(deptButton).toBeInTheDocument();

      // Click to toggle department
      fireEvent.click(deptButton);
    }

    // Verify dialog is still rendered and healthy
    expect(screen.getByText('Add New Item')).toBeInTheDocument();

    // Test Select All and Reset buttons
    const selectAllBtn = screen.getByRole('button', { name: /select all/i });
    fireEvent.click(selectAllBtn);

    const resetBtn = screen.getByRole('button', { name: /reset/i });
    fireEvent.click(resetBtn);

    expect(screen.getByText('Add New Item')).toBeInTheDocument();
  }, 20000);
});
