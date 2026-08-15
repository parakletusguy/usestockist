import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useItems, useCreateItem, useUpdateItem, useDeleteItem } from '@/hooks/useItems';
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

describe('useItems Hook & Table Endpoints Audit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches items catalog with multi-department assignments', async () => {
    const { result } = renderHook(() => useItems(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.length).toBeGreaterThan(0);
    const item1 = result.current.data?.find((i) => i.id === 'item-1');
    expect(item1?.name).toBe('Medium Popcorn');
    expect(item1?.departments).toContain('Retail');
    expect(item1?.departments).toContain('Kitchen');
  });

  it('filters items correctly by department parameter', async () => {
    const { result } = renderHook(() => useItems('Kitchen'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const items = result.current.data || [];
    items.forEach((item) => {
      expect(item.departments?.includes('Kitchen') || item.department === 'Kitchen').toBe(true);
    });
  });

  it('creates a new item and syncs department mappings', async () => {
    const { result } = renderHook(() => useCreateItem(), { wrapper: createWrapper() });

    const newItemInput = {
      name: 'Caramel Popcorn',
      category: 'Concessions',
      departments: ['Retail', 'VIP'],
      unit_of_measure: 'pack',
      low_stock_threshold: 15,
      unit_cost: 2000,
    };

    await result.current.mutateAsync(newItemInput);

    expect(mockSupabase.from).toHaveBeenCalledWith('items');
  });

  it('updates an existing item details and departments', async () => {
    const { result } = renderHook(() => useUpdateItem(), { wrapper: createWrapper() });

    const updateInput = {
      id: 'item-1',
      name: 'Large Popcorn Premium',
      category: 'Concessions',
      departments: ['Retail', 'Cinema'],
      unit_of_measure: 'bucket',
      low_stock_threshold: 20,
      unit_cost: 3000,
    };

    await result.current.mutateAsync(updateInput);

    expect(mockSupabase.from).toHaveBeenCalledWith('items');
  });

  it('deletes an item by ID', async () => {
    const { result } = renderHook(() => useDeleteItem(), { wrapper: createWrapper() });

    await result.current.mutateAsync('item-1');

    expect(mockSupabase.from).toHaveBeenCalledWith('items');
  });
});
