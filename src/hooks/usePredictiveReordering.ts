import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type PurchaseOrderStatus = 'draft' | 'approved' | 'ordered' | 'received' | 'cancelled';

export interface PurchaseOrder {
  id: string;
  item_id: string;
  suggested_quantity: number;
  ordered_quantity: number | null;
  unit_cost: number;
  status: PurchaseOrderStatus;
  reorder_reason: string | null;
  daily_velocity: number | null;
  days_to_stockout: number | null;
  supplier: string | null;
  department: string | null;
  created_at: string;
  updated_at: string;
  items?: {
    name: string;
    category: string;
    unit_of_measure: string;
  } | null;
}

export function usePredictiveReordering() {
  const queryClient = useQueryClient();

  const purchaseOrdersQuery = useQuery({
    queryKey: ['purchase_orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*, items(name, category, unit_of_measure)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as PurchaseOrder[];
    },
  });

  const runAnalysisMutation = useMutation({
    mutationFn: async (lookbackDays: number = 30) => {
      const { data, error } = await supabase.rpc('calculate_predictive_reorders', {
        p_lookback_days: lookbackDays,
      });
      if (error) throw error;
      return data as Array<{ created_count: number; existing_count: number; analyzed_items_count: number }>;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['purchase_orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      const res = Array.isArray(result) && result[0] ? result[0] : null;
      if (res) {
        toast({
          title: 'Predictive Analysis Complete',
          description: `Analyzed ${res.analyzed_items_count} items. Created ${res.created_count} new draft POs (${res.existing_count} existing active).`,
        });
      } else {
        toast({
          title: 'Analysis Complete',
          description: 'Predictive analysis completed successfully.',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Analysis Failed',
        description: error.message || 'Failed to run predictive reordering analysis.',
        variant: 'destructive',
      });
    },
  });

  const updatePOMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PurchaseOrder> }) => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase_orders'] });
      toast({
        title: 'Purchase Order Updated',
        description: 'Changes saved successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const markAsReceivedMutation = useMutation({
    mutationFn: async (po: PurchaseOrder) => {
      const receiveQty = Number(po.ordered_quantity || po.suggested_quantity);
      const supplierName = po.supplier?.trim() || 'Auto-Reorder Vendor';
      const today = new Date().toISOString().split('T')[0];

      // 1. Post entry to received_ledger
      const { error: ledgerError } = await supabase.from('received_ledger').insert({
        date: today,
        supplier: supplierName,
        item_id: po.item_id,
        quantity: receiveQty,
        invoice_number: `PO-${po.id.slice(0, 8).toUpperCase()}`,
        department: po.department || 'Retail',
      });

      if (ledgerError) throw ledgerError;

      // 2. Update PO status to received
      const { data, error: poError } = await supabase
        .from('purchase_orders')
        .update({
          status: 'received',
          updated_at: new Date().toISOString(),
        })
        .eq('id', po.id)
        .select()
        .single();

      if (poError) throw poError;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase_orders'] });
      queryClient.invalidateQueries({ queryKey: ['received_ledger'] });
      queryClient.invalidateQueries({ queryKey: ['daily_stock_count'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: 'Stock Received & Fulfilled',
        description: 'Purchase Order marked as Received and posted to Received Ledger.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Fulfillment Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    purchaseOrders: purchaseOrdersQuery.data || [],
    isLoading: purchaseOrdersQuery.isLoading,
    refetch: purchaseOrdersQuery.refetch,
    runAnalysis: runAnalysisMutation.mutate,
    isAnalyzing: runAnalysisMutation.isPending,
    updatePO: updatePOMutation.mutate,
    isUpdating: updatePOMutation.isPending,
    markAsReceived: markAsReceivedMutation.mutate,
    isFulfilling: markAsReceivedMutation.isPending,
  };
}
