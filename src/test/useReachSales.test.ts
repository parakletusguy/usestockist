import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useReachSalesReports,
  useUploadReachSales,
  useReachSalesReportDetails,
  useDeleteReachSalesReport,
} from '@/hooks/useReachSales';
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

describe('useReachSales Hooks & Endpoints Audit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches reach sales reports list', async () => {
    const { result } = renderHook(() => useReachSalesReports(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeDefined();
  });

  it('uploads a new reach sales report and creates inventory transactions', async () => {
    const { result } = renderHook(() => useUploadReachSales(), { wrapper: createWrapper() });

    await result.current.mutateAsync({
      report_date: '2026-08-10',
      retail_member_name: 'Joy Cashier',
      file_name: 'Reach_Sales_Aug10.pdf',
      items: [
        { item_id: 'item-1', qty_sold: 15, unit_price: 4500, department: 'Retail' },
        { item_id: 'item-2', qty_sold: 20, unit_price: 1200, department: 'Retail' },
      ],
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('reach_sales_reports');
    expect(mockSupabase.from).toHaveBeenCalledWith('inventory_transactions');
  });

  it('fetches report details for a given report ID', async () => {
    const { result } = renderHook(() => useReachSalesReportDetails('report-101'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeDefined();
  });

  it('records prepared drinks in sales header totals without raw transaction rows', async () => {
    const { result } = renderHook(() => useUploadReachSales(), { wrapper: createWrapper() });

    await result.current.mutateAsync({
      report_date: '2026-08-16',
      retail_member_name: 'Choice Harrison',
      file_name: 'Reach_Sales_Aug16.pdf',
      total_items_sold: 10,
      total_sales_value: 45000,
      items: [
        { item_name: 'Baileys Milkshake', qty_sold: 1, unit_price: 7000, department: 'Bar' },
        { item_name: 'Sex Boaster', qty_sold: 1, unit_price: 6000, department: 'Bar' },
        { item_id: 'cup-item-id', item_name: 'Cups', qty_sold: 2, unit_price: 100, department: 'Bar' },
      ],
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('reach_sales_reports');
    expect(mockSupabase.from).toHaveBeenCalledWith('inventory_transactions');
  });
});
