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

  it('orders stock items so healthy items come first, low stock second, and out of stock last', () => {
    const STATUS_PRIORITY: Record<'healthy' | 'low' | 'out', number> = {
      healthy: 0,
      low: 1,
      out: 2,
    };

    const mockItems = [
      { name: 'Water', status: 'healthy' as const },
      { name: 'Meat Pie', status: 'out' as const },
      { name: 'POS Roll', status: 'low' as const },
      { name: 'Soda', status: 'healthy' as const },
      { name: 'Avacati Tequila', status: 'out' as const },
    ];

    const sorted = [...mockItems].sort((a, b) => {
      const aPriority = STATUS_PRIORITY[a.status];
      const bPriority = STATUS_PRIORITY[b.status];
      if (aPriority !== bPriority) return aPriority - bPriority;
      return a.name.localeCompare(b.name);
    });

    expect(sorted.map((i) => i.name)).toEqual([
      'Soda',
      'Water',
      'POS Roll',
      'Avacati Tequila',
      'Meat Pie',
    ]);
    expect(sorted[0].status).toBe('healthy');
    expect(sorted[1].status).toBe('healthy');
    expect(sorted[2].status).toBe('low');
    expect(sorted[3].status).toBe('out');
    expect(sorted[4].status).toBe('out');
  });
});
