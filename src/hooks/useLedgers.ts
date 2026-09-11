import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { TablesInsert } from '@/integrations/supabase/types';

const LIST_OPTS = {
  staleTime: 1000 * 30, // 30s cache
};

// ---------------- Issuance ----------------
export interface IssuanceLedger {
  id: string;
  date: string;
  recipient_group: string;
  item_id: string;
  quantity: number;
  issued_by: string;
  department?: string;
  branch_id?: string;
  created_at: string;
  items?: { name: string; unit_of_measure: string };
}

export interface CreateIssuanceInput {
  date: string;
  recipient_group: string;
  item_id: string;
  quantity: number;
  issued_by: string;
  department?: string;
  branchId?: string;
}

export function useIssuanceLedger(branchId?: string) {
  return useQuery({
    queryKey: ['issuance_ledger', branchId || 'all'],
    queryFn: async () => {
      let query = supabase
        .from('issuance_ledger')
        .select('*, items(name, unit_of_measure)')
        .order('date', { ascending: false })
        .limit(500);

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as IssuanceLedger[];
    },
    ...LIST_OPTS,
  });
}

export function useCreateIssuance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateIssuanceInput) => {
      const payload: Record<string, any> = {
        date: input.date,
        recipient_group: input.recipient_group,
        item_id: input.item_id,
        quantity: input.quantity,
        issued_by: input.issued_by,
      };
      if (input.branchId) payload.branch_id = input.branchId;

      // 1. Write to issuance_ledger
      const { data, error } = await supabase
        .from('issuance_ledger')
        .insert(payload as any)
        .select()
        .single();

      if (error) throw error;

      // 2. Dual-write to inventory_transactions for unified stock tracking
      const txRow: Record<string, any> = {
        item_id: input.item_id,
        type: 'issuance',
        quantity: input.quantity,
        transaction_date: input.date,
        department: input.department || 'Retail',
        metadata: {
          recipient_group: input.recipient_group,
          issued_by: input.issued_by,
          ledger_id: data.id,
        },
      };
      if (input.branchId) txRow.branch_id = input.branchId;

      const { error: txError } = await supabase
        .from('inventory_transactions')
        .insert(txRow as any);

      if (txError) {
        console.warn('inventory_transactions sync notice:', txError);
      }

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['issuance_ledger'] });
      qc.invalidateQueries({ queryKey: ['inventory_transactions'] });
      qc.invalidateQueries({ queryKey: ['stock_count'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast({ title: 'Success', description: 'Issuance recorded' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useUpdateIssuance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, branchId, ...input }: Partial<CreateIssuanceInput> & { id: string }) => {
      const payload: Record<string, any> = { ...input };
      if (branchId) payload.branch_id = branchId;

      const { data, error } = await supabase
        .from('issuance_ledger')
        .update(payload as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Synchronize update to inventory_transactions
      const txUpdates: Record<string, any> = {};
      if (input.quantity !== undefined) txUpdates.quantity = input.quantity;
      if (input.date !== undefined) txUpdates.transaction_date = input.date;
      if (input.item_id !== undefined) txUpdates.item_id = input.item_id;
      if (branchId) txUpdates.branch_id = branchId;

      if (Object.keys(txUpdates).length > 0) {
        await supabase
          .from('inventory_transactions')
          .update(txUpdates)
          .contains('metadata', { ledger_id: id });
      }

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['issuance_ledger'] });
      qc.invalidateQueries({ queryKey: ['inventory_transactions'] });
      qc.invalidateQueries({ queryKey: ['stock_count'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast({ title: 'Success', description: 'Issuance updated' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useDeleteIssuance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('issuance_ledger').delete().eq('id', id);
      if (error) throw error;

      // Synchronize deletion to inventory_transactions
      await supabase
        .from('inventory_transactions')
        .delete()
        .contains('metadata', { ledger_id: id });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['issuance_ledger'] });
      qc.invalidateQueries({ queryKey: ['inventory_transactions'] });
      qc.invalidateQueries({ queryKey: ['stock_count'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast({ title: 'Success', description: 'Issuance deleted' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

// ---------------- Transfer ----------------
export interface TransferLedger {
  id: string;
  date: string;
  destination: string;
  item_id: string;
  quantity: number;
  reason: string | null;
  department?: string;
  branch_id?: string;
  destination_branch_id?: string | null;
  status?: string;
  confirmed_at?: string | null;
  confirmed_by?: string | null;
  created_at: string;
  items?: { name: string; unit_of_measure: string };
}

export interface CreateTransferInput {
  date: string;
  destination: string;
  item_id: string;
  quantity: number;
  reason?: string;
  department?: string;
  branchId?: string;
  destinationBranchId?: string;
  status?: string;
}

export function useTransferLedger(branchId?: string) {
  return useQuery({
    queryKey: ['transfer_ledger', branchId || 'all'],
    queryFn: async () => {
      let query = supabase
        .from('transfer_ledger')
        .select('*, items(name, unit_of_measure)')
        .order('date', { ascending: false })
        .limit(500);

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as TransferLedger[];
    },
    ...LIST_OPTS,
  });
}

export function useCubeIncomingTransfers(branchId?: string) {
  return useQuery({
    queryKey: ['cube_incoming_transfers', branchId || 'all'],
    queryFn: async () => {
      let query = supabase
        .from('transfer_ledger')
        .select('*, items(name, unit_of_measure)')
        .eq('destination', 'Cube')
        .order('date', { ascending: false })
        .limit(500);

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as TransferLedger[];
    },
    ...LIST_OPTS,
  });
}

export function useConfirmTransferReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, confirmedBy }: { id: string; confirmedBy: string }) => {
      const { data, error } = await supabase
        .from('transfer_ledger')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          confirmed_by: confirmedBy,
        } as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transfer_ledger'] });
      qc.invalidateQueries({ queryKey: ['cube_incoming_transfers'] });
      qc.invalidateQueries({ queryKey: ['received_ledger'] });
      qc.invalidateQueries({ queryKey: ['stock_count'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast({ title: 'Receipt Confirmed', description: 'Stock has been confirmed into Cube inventory.' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useCreateTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTransferInput) => {
      const payload: Record<string, any> = {
        date: input.date,
        destination: input.destination,
        item_id: input.item_id,
        quantity: input.quantity,
        reason: input.reason,
        status: input.status || (input.destination === 'Cube' ? 'pending' : 'confirmed'),
      };
      if (input.branchId) payload.branch_id = input.branchId;
      if (input.destinationBranchId) payload.destination_branch_id = input.destinationBranchId;

      // 1. Write to transfer_ledger
      const { data, error } = await supabase
        .from('transfer_ledger')
        .insert(payload as any)
        .select()
        .single();

      if (error) throw error;

      // 2. Dual-write to inventory_transactions
      const txRow: Record<string, any> = {
        item_id: input.item_id,
        type: 'transfer',
        quantity: input.quantity,
        transaction_date: input.date,
        department: input.department || 'Retail',
        metadata: {
          destination: input.destination,
          reason: input.reason,
          destination_branch_id: input.destinationBranchId || null,
          ledger_id: data.id,
        },
      };
      if (input.branchId) txRow.branch_id = input.branchId;

      const { error: txError } = await supabase
        .from('inventory_transactions')
        .insert(txRow as any);

      if (txError) {
        console.warn('inventory_transactions sync notice:', txError);
      }

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transfer_ledger'] });
      qc.invalidateQueries({ queryKey: ['inventory_transactions'] });
      qc.invalidateQueries({ queryKey: ['stock_count'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast({ title: 'Success', description: 'Transfer recorded' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useUpdateTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, branchId, destinationBranchId, ...input }: Partial<CreateTransferInput> & { id: string }) => {
      const payload: Record<string, any> = { ...input };
      if (branchId) payload.branch_id = branchId;
      if (destinationBranchId !== undefined) payload.destination_branch_id = destinationBranchId;

      const { data, error } = await supabase
        .from('transfer_ledger')
        .update(payload as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Synchronize update to inventory_transactions
      const txUpdates: Record<string, any> = {};
      if (input.quantity !== undefined) txUpdates.quantity = input.quantity;
      if (input.date !== undefined) txUpdates.transaction_date = input.date;
      if (input.item_id !== undefined) txUpdates.item_id = input.item_id;
      if (branchId) txUpdates.branch_id = branchId;

      if (Object.keys(txUpdates).length > 0) {
        await supabase
          .from('inventory_transactions')
          .update(txUpdates)
          .contains('metadata', { ledger_id: id });
      }

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transfer_ledger'] });
      qc.invalidateQueries({ queryKey: ['inventory_transactions'] });
      qc.invalidateQueries({ queryKey: ['stock_count'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast({ title: 'Success', description: 'Transfer updated' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useDeleteTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transfer_ledger').delete().eq('id', id);
      if (error) throw error;

      // Synchronize deletion to inventory_transactions
      await supabase
        .from('inventory_transactions')
        .delete()
        .contains('metadata', { ledger_id: id });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transfer_ledger'] });
      qc.invalidateQueries({ queryKey: ['inventory_transactions'] });
      qc.invalidateQueries({ queryKey: ['stock_count'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast({ title: 'Success', description: 'Transfer deleted' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

// ---------------- Received ----------------
export interface ReceivedLedger {
  id: string;
  date: string;
  supplier: string;
  item_id: string;
  quantity: number;
  invoice_number: string | null;
  department?: string;
  branch_id?: string;
  created_at: string;
  items?: { name: string; unit_of_measure: string };
}

export interface CreateReceivedInput {
  date: string;
  supplier: string;
  item_id: string;
  quantity: number;
  invoice_number?: string;
  department?: string;
  branchId?: string;
}

export function useReceivedLedger(branchId?: string) {
  return useQuery({
    queryKey: ['received_ledger', branchId || 'all'],
    queryFn: async () => {
      let query = supabase
        .from('received_ledger')
        .select('*, items(name, unit_of_measure)')
        .order('date', { ascending: false })
        .limit(500);

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as ReceivedLedger[];
    },
    ...LIST_OPTS,
  });
}

export function useCreateReceived() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateReceivedInput) => {
      const payload: Record<string, any> = {
        date: input.date,
        supplier: input.supplier,
        item_id: input.item_id,
        quantity: input.quantity,
        invoice_number: input.invoice_number,
      };
      if (input.branchId) payload.branch_id = input.branchId;

      // 1. Write to received_ledger
      const { data, error } = await supabase
        .from('received_ledger')
        .insert(payload as any)
        .select()
        .single();

      if (error) throw error;

      // 2. Dual-write to inventory_transactions
      const txRow: Record<string, any> = {
        item_id: input.item_id,
        type: 'receive',
        quantity: input.quantity,
        transaction_date: input.date,
        department: input.department || 'Retail',
        metadata: {
          supplier: input.supplier,
          invoice_number: input.invoice_number,
          ledger_id: data.id,
        },
      };
      if (input.branchId) txRow.branch_id = input.branchId;

      const { error: txError } = await supabase
        .from('inventory_transactions')
        .insert(txRow as any);

      if (txError) {
        console.warn('inventory_transactions sync notice:', txError);
      }

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['received_ledger'] });
      qc.invalidateQueries({ queryKey: ['inventory_transactions'] });
      qc.invalidateQueries({ queryKey: ['stock_count'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast({ title: 'Success', description: 'Receipt recorded' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useUpdateReceived() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, branchId, ...input }: Partial<CreateReceivedInput> & { id: string }) => {
      const payload: Record<string, any> = { ...input };
      if (branchId) payload.branch_id = branchId;

      const { data, error } = await supabase
        .from('received_ledger')
        .update(payload as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Synchronize update to inventory_transactions
      const txUpdates: Record<string, any> = {};
      if (input.quantity !== undefined) txUpdates.quantity = input.quantity;
      if (input.date !== undefined) txUpdates.transaction_date = input.date;
      if (input.item_id !== undefined) txUpdates.item_id = input.item_id;
      if (branchId) txUpdates.branch_id = branchId;

      if (Object.keys(txUpdates).length > 0) {
        await supabase
          .from('inventory_transactions')
          .update(txUpdates)
          .contains('metadata', { ledger_id: id });
      }

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['received_ledger'] });
      qc.invalidateQueries({ queryKey: ['inventory_transactions'] });
      qc.invalidateQueries({ queryKey: ['stock_count'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast({ title: 'Success', description: 'Receipt updated' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useDeleteReceived() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('received_ledger').delete().eq('id', id);
      if (error) throw error;

      // Synchronize deletion to inventory_transactions
      await supabase
        .from('inventory_transactions')
        .delete()
        .contains('metadata', { ledger_id: id });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['received_ledger'] });
      qc.invalidateQueries({ queryKey: ['inventory_transactions'] });
      qc.invalidateQueries({ queryKey: ['stock_count'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast({ title: 'Success', description: 'Receipt deleted' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}
