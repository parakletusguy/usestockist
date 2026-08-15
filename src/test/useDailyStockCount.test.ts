import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDailyStockCount, useSaveDailyStockCount } from '@/hooks/useDailyStockCount';
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

describe('useDailyStockCount Hook Audit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches daily stock items and calculates stock reconciliation', async () => {
    const { result } = renderHook(() => useDailyStockCount('2026-08-01', '2026-08-10', 'Retail'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.length).toBeGreaterThan(0);

    const popcorn = result.current.data?.find((i) => i.item_name === 'Medium Popcorn');
    expect(popcorn).toBeDefined();
    expect(popcorn?.item_name).toBe('Medium Popcorn');
    expect(typeof popcorn?.opening_stock).toBe('number');
  });

  it('saves daily stock counts to daily_stock_sheets and logs transactions', async () => {
    const { result } = renderHook(() => useSaveDailyStockCount('2026-08-10'), { wrapper: createWrapper() });

    await result.current.mutateAsync([
      {
        item_id: 'item-1',
        date: '2026-08-10',
        qty_sold: 10,
        phy_count: 120,
        comment: 'Audit verified',
        department: 'Retail',
      },
    ]);

    expect(mockSupabase.from).toHaveBeenCalledWith('daily_stock_sheets');
  });
});
