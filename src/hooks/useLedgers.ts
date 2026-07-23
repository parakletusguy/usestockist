import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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
}

export function useIssuanceLedger() {
  return useQuery({
    queryKey: ['issuance_ledger'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('issuance_ledger')
        .select('*, items(name, unit_of_measure)')
        .order('date', { ascending: false })
        .limit(500);
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
      // 1. Write to issuance_ledger
      const { data, error } = await supabase
        .from('issuance_ledger').insert(input).select().single();
      if (error) throw error;

      // 2. Dual-write to inventory_transactions for dynamic stock count
      try {
        await (supabase as any).from('inventory_transactions').insert({
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
        });
      } catch (err) {
        console.warn('inventory_transactions sync notice:', err);
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
    mutationFn: async ({ id, ...input }: Partial<CreateIssuanceInput> & { id: string }) => {
      const { data, error } = await supabase
        .from('issuance_ledger').update(input).eq('id', id).select().single();
      if (error) throw error;
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
}

export function useTransferLedger() {
  return useQuery({
    queryKey: ['transfer_ledger'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transfer_ledger')
        .select('*, items(name, unit_of_measure)')
        .order('date', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as TransferLedger[];
    },
    ...LIST_OPTS,
  });
}

export function useCreateTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTransferInput) => {
      // 1. Write to transfer_ledger
      const { data, error } = await supabase
        .from('transfer_ledger').insert(input).select().single();
      if (error) throw error;

      // 2. Dual-write to inventory_transactions
      try {
        await (supabase as any).from('inventory_transactions').insert({
          item_id: input.item_id,
          type: 'transfer',
          quantity: input.quantity,
          transaction_date: input.date,
          department: input.department || 'Retail',
          metadata: {
            destination: input.destination,
            reason: input.reason,
            ledger_id: data.id,
          },
        });
      } catch (err) {
        console.warn('inventory_transactions sync notice:', err);
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
    mutationFn: async ({ id, ...input }: Partial<CreateTransferInput> & { id: string }) => {
      const { data, error } = await supabase
        .from('transfer_ledger').update(input).eq('id', id).select().single();
      if (error) throw error;
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
}

export function useReceivedLedger() {
  return useQuery({
    queryKey: ['received_ledger'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('received_ledger')
        .select('*, items(name, unit_of_measure)')
        .order('date', { ascending: false })
        .limit(500);
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
      // 1. Write to received_ledger
      const { data, error } = await supabase
        .from('received_ledger').insert(input).select().single();
      if (error) throw error;

      // 2. Dual-write to inventory_transactions
      try {
        await (supabase as any).from('inventory_transactions').insert({
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
        });
      } catch (err) {
        console.warn('inventory_transactions sync notice:', err);
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
    mutationFn: async ({ id, ...input }: Partial<CreateReceivedInput> & { id: string }) => {
      const { data, error } = await supabase
        .from('received_ledger').update(input).eq('id', id).select().single();
      if (error) throw error;
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
