import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useReceivedLedger,
  useCreateReceived,
  useDeleteReceived,
  useTransferLedger,
  useCreateTransfer,
  useDeleteTransfer,
  useIssuanceLedger,
  useCreateIssuance,
  useDeleteIssuance,
} from '@/hooks/useLedgers';
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

describe('useLedgers Hooks & Table Endpoints Audit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Received Ledger (received_ledger)', () => {
    it('fetches received ledger entries', async () => {
      const { result } = renderHook(() => useReceivedLedger(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.length).toBeGreaterThan(0);
      expect(result.current.data?.[0].supplier).toBe('Cinema Supplies Ltd');
    });

    it('creates a new received stock entry', async () => {
      const { result } = renderHook(() => useCreateReceived(), { wrapper: createWrapper() });

      await result.current.mutateAsync({
        date: '2026-08-10',
        item_id: 'item-1',
        quantity: 100,
        supplier: 'Global Trade Ltd',
        invoice_number: 'INV-2026',
        department: 'Retail',
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('received_ledger');
    });

    it('deletes a received ledger entry by ID', async () => {
      const { result } = renderHook(() => useDeleteReceived(), { wrapper: createWrapper() });

      await result.current.mutateAsync('rec-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('received_ledger');
    });
  });

  describe('Transfer Ledger (transfer_ledger)', () => {
    it('fetches transfer ledger entries', async () => {
      const { result } = renderHook(() => useTransferLedger(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.length).toBeGreaterThan(0);
      expect(result.current.data?.[0].destination).toBe('VIP Lounge');
    });

    it('creates a new stock transfer entry', async () => {
      const { result } = renderHook(() => useCreateTransfer(), { wrapper: createWrapper() });

      await result.current.mutateAsync({
        date: '2026-08-10',
        item_id: 'item-1',
        quantity: 15,
        destination: 'Concession Stand B',
        reason: 'Restocking',
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('transfer_ledger');
    });

    it('deletes a transfer ledger entry by ID', async () => {
      const { result } = renderHook(() => useDeleteTransfer(), { wrapper: createWrapper() });

      await result.current.mutateAsync('trans-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('transfer_ledger');
    });
  });

  describe('Issuance Ledger (issuance_ledger)', () => {
    it('fetches issuance ledger entries', async () => {
      const { result } = renderHook(() => useIssuanceLedger(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.length).toBeGreaterThan(0);
      expect(result.current.data?.[0].issued_by).toBe('Manager Alice');
    });

    it('creates a new stock issuance entry', async () => {
      const { result } = renderHook(() => useCreateIssuance(), { wrapper: createWrapper() });

      await result.current.mutateAsync({
        date: '2026-08-10',
        item_id: 'item-2',
        quantity: 12,
        issued_by: 'Supervisor Bob',
        recipient_group: 'Kitchen Staff',
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('issuance_ledger');
    });

    it('deletes an issuance ledger entry by ID', async () => {
      const { result } = renderHook(() => useDeleteIssuance(), { wrapper: createWrapper() });

      await result.current.mutateAsync('iss-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('issuance_ledger');
    });
  });
});
