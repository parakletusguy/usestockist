import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePredictiveReordering } from '@/hooks/usePredictiveReordering';
import { mockSupabase } from './setup';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  );
}

describe('usePredictiveReordering Hook & RPC Endpoints Audit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches purchase order reorder recommendations', async () => {
    const { result } = renderHook(() => usePredictiveReordering(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.purchaseOrders).toBeDefined();
    expect(result.current.purchaseOrders.length).toBeGreaterThan(0);
    expect(result.current.purchaseOrders[0].status).toBe('pending');
  });

  it('invokes calculate_predictive_reorders RPC procedure via runAnalysis', async () => {
    const { result } = renderHook(() => usePredictiveReordering(), { wrapper: createWrapper() });

    result.current.runAnalysis(14);

    await waitFor(() => {
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'calculate_predictive_reorders',
        expect.objectContaining({ p_lookback_days: 14 })
      );
    });
  });

  it('clears purchase orders via branch-scoped direct delete via clearList', async () => {
    const { result } = renderHook(() => usePredictiveReordering(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.clearList();
    });

    // clearList now uses supabase.from('purchase_orders').delete() directly (no RPC)
    expect(mockSupabase.from).toHaveBeenCalledWith('purchase_orders');
  });
});
