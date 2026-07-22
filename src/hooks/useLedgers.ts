import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Helper to map inventory_transactions to legacy format
const mapTransactionToLegacy = (row: any, legacyFields: string[]) => {
  const mapped = {
    id: row.id,
    date: row.transaction_date,
    item_id: row.item_id,
    quantity: row.quantity,
    created_at: row.created_at,
    items: row.items,
  };
  
  if (row.metadata) {
    legacyFields.forEach(field => {
      (mapped as any)[field] = row.metadata[field] || '';
    });
  }
  
  return mapped;
};

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
        .from('inventory_transactions')
        .select('*, items(name, unit_of_measure)')
        .eq('type', 'issuance')
        .order('transaction_date', { ascending: false });
      
      if (error) throw error;
      return data.map(row => mapTransactionToLegacy(row, ['recipient_group', 'issued_by'])) as IssuanceLedger[];
    },
  });
}

export function useCreateIssuance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CreateIssuanceInput) => {
      const dbInput = {
        item_id: input.item_id,
        type: 'issuance' as const,
        quantity: input.quantity,
        transaction_date: input.date,
        metadata: { recipient_group: input.recipient_group, issued_by: input.issued_by }
      };
      const { data, error } = await supabase
        .from('inventory_transactions')
        .insert(dbInput)
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

export function useUpdateIssuance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<CreateIssuanceInput> & { id: string }) => {
      const dbInput: any = {};
      if (input.item_id) dbInput.item_id = input.item_id;
      if (input.quantity) dbInput.quantity = input.quantity;
      if (input.date) dbInput.transaction_date = input.date;
      if (input.recipient_group || input.issued_by) {
        dbInput.metadata = {
          recipient_group: input.recipient_group,
          issued_by: input.issued_by
        };
      }

      const { data, error } = await supabase
        .from('inventory_transactions')
        .update(dbInput)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issuance_ledger'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({ title: 'Success', description: 'Issuance updated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteIssuance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('inventory_transactions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issuance_ledger'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({ title: 'Success', description: 'Issuance deleted' });
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
        .from('inventory_transactions')
        .select('*, items(name, unit_of_measure)')
        .eq('type', 'transfer')
        .order('transaction_date', { ascending: false });
      
      if (error) throw error;
      return data.map(row => mapTransactionToLegacy(row, ['destination', 'reason'])) as TransferLedger[];
    },
  });
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CreateTransferInput) => {
      const dbInput = {
        item_id: input.item_id,
        type: 'transfer' as const,
        quantity: input.quantity,
        transaction_date: input.date,
        metadata: { destination: input.destination, reason: input.reason }
      };
      const { data, error } = await supabase
        .from('inventory_transactions')
        .insert(dbInput)
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

export function useUpdateTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<CreateTransferInput> & { id: string }) => {
      const dbInput: any = {};
      if (input.item_id) dbInput.item_id = input.item_id;
      if (input.quantity) dbInput.quantity = input.quantity;
      if (input.date) dbInput.transaction_date = input.date;
      if (input.destination || input.reason) {
        dbInput.metadata = {
          destination: input.destination,
          reason: input.reason
        };
      }
      const { data, error } = await supabase
        .from('inventory_transactions')
        .update(dbInput)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfer_ledger'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({ title: 'Success', description: 'Transfer updated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('inventory_transactions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfer_ledger'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({ title: 'Success', description: 'Transfer deleted' });
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
        .from('inventory_transactions')
        .select('*, items(name, unit_of_measure)')
        .eq('type', 'receive')
        .order('transaction_date', { ascending: false });
      
      if (error) throw error;
      return data.map(row => mapTransactionToLegacy(row, ['supplier', 'invoice_number'])) as ReceivedLedger[];
    },
  });
}

export function useCreateReceived() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CreateReceivedInput) => {
      const dbInput = {
        item_id: input.item_id,
        type: 'receive' as const,
        quantity: input.quantity,
        transaction_date: input.date,
        metadata: { supplier: input.supplier, invoice_number: input.invoice_number }
      };
      const { data, error } = await supabase
        .from('inventory_transactions')
        .insert(dbInput)
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

export function useUpdateReceived() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<CreateReceivedInput> & { id: string }) => {
      const dbInput: any = {};
      if (input.item_id) dbInput.item_id = input.item_id;
      if (input.quantity) dbInput.quantity = input.quantity;
      if (input.date) dbInput.transaction_date = input.date;
      if (input.supplier || input.invoice_number) {
        dbInput.metadata = {
          supplier: input.supplier,
          invoice_number: input.invoice_number
        };
      }
      const { data, error } = await supabase
        .from('inventory_transactions')
        .update(dbInput)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['received_ledger'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({ title: 'Success', description: 'Receipt updated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteReceived() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('inventory_transactions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['received_ledger'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({ title: 'Success', description: 'Receipt deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}
