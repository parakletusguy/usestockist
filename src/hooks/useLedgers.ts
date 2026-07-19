import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// ---------- Issuance ----------
export interface IssuanceLedger {
  id: string;
  date: string;
  recipient_group: string;
  item_id: string;
  quantity: number;
  issued_by: string;
  created_at: string;
  items?: { name: string; unit_of_measure: string };
}

export interface CreateIssuanceInput {
  date: string;
  recipient_group: string;
  item_id: string;
  quantity: number;
  issued_by: string;
}

export function useIssuanceLedger() {
  return useQuery({
    queryKey: ['issuance_ledger'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('issuance_ledger')
        .select('*, items(name, unit_of_measure)')
        .order('date', { ascending: false });
      if (error) throw error;
      return data as IssuanceLedger[];
    },
  });
}

export function useCreateIssuance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateIssuanceInput) => {
      const { data, error } = await supabase.from('issuance_ledger').insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['issuance_ledger'] });
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
      const { data, error } = await supabase.from('issuance_ledger').update(input).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['issuance_ledger'] });
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
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast({ title: 'Success', description: 'Issuance deleted' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

// ---------- Transfer ----------
export interface TransferLedger {
  id: string;
  date: string;
  destination: string;
  item_id: string;
  quantity: number;
  reason: string | null;
  created_at: string;
  items?: { name: string; unit_of_measure: string };
}

export interface CreateTransferInput {
  date: string;
  destination: string;
  item_id: string;
  quantity: number;
  reason?: string;
}

export function useTransferLedger() {
  return useQuery({
    queryKey: ['transfer_ledger'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transfer_ledger')
        .select('*, items(name, unit_of_measure)')
        .order('date', { ascending: false });
      if (error) throw error;
      return data as TransferLedger[];
    },
  });
}

export function useCreateTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTransferInput) => {
      const { data, error } = await supabase.from('transfer_ledger').insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transfer_ledger'] });
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
      const { data, error } = await supabase.from('transfer_ledger').update(input).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transfer_ledger'] });
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
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast({ title: 'Success', description: 'Transfer deleted' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

// ---------- Received ----------
export interface ReceivedLedger {
  id: string;
  date: string;
  supplier: string;
  item_id: string;
  quantity: number;
  invoice_number: string | null;
  created_at: string;
  items?: { name: string; unit_of_measure: string };
}

export interface CreateReceivedInput {
  date: string;
  supplier: string;
  item_id: string;
  quantity: number;
  invoice_number?: string;
}

export function useReceivedLedger() {
  return useQuery({
    queryKey: ['received_ledger'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('received_ledger')
        .select('*, items(name, unit_of_measure)')
        .order('date', { ascending: false });
      if (error) throw error;
      return data as ReceivedLedger[];
    },
  });
}

export function useCreateReceived() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateReceivedInput) => {
      const { data, error } = await supabase.from('received_ledger').insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['received_ledger'] });
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
      const { data, error } = await supabase.from('received_ledger').update(input).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['received_ledger'] });
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
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast({ title: 'Success', description: 'Receipt deleted' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}
