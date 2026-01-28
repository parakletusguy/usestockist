import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Issuance Ledger
export interface IssuanceLedger {
  id: string;
  date: string;
  recipient_group: string;
  item_id: string;
  quantity: number;
  issued_by: string;
  created_at: string;
  items?: {
    name: string;
    unit_of_measure: string;
  };
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
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CreateIssuanceInput) => {
      const { data, error } = await supabase
        .from('issuance_ledger')
        .insert(input)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issuance_ledger'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({ title: 'Success', description: 'Issuance recorded' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

// Transfer Ledger
export interface TransferLedger {
  id: string;
  date: string;
  destination: string;
  item_id: string;
  quantity: number;
  reason: string | null;
  created_at: string;
  items?: {
    name: string;
    unit_of_measure: string;
  };
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
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CreateTransferInput) => {
      const { data, error } = await supabase
        .from('transfer_ledger')
        .insert(input)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfer_ledger'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({ title: 'Success', description: 'Transfer recorded' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

// Received Ledger
export interface ReceivedLedger {
  id: string;
  date: string;
  supplier: string;
  item_id: string;
  quantity: number;
  invoice_number: string | null;
  created_at: string;
  items?: {
    name: string;
    unit_of_measure: string;
  };
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
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CreateReceivedInput) => {
      const { data, error } = await supabase
        .from('received_ledger')
        .insert(input)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['received_ledger'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({ title: 'Success', description: 'Receipt recorded' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}
