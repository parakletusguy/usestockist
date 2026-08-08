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

  // Fetch all non-received purchase orders (the persisted requisition list)
  const purchaseOrdersQuery = useQuery({
    queryKey: ['purchase_orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*, items(name, category, unit_of_measure)')
        .not('status', 'eq', 'received')
        .order('days_to_stockout', { ascending: true });

      if (error) throw error;
      return (data || []) as PurchaseOrder[];
    },
  });

  // Run the predictive analysis to populate/refresh draft POs
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
          title: 'Analysis Complete',
          description: `Analysed ${res.analyzed_items_count} items. Found ${res.created_count + res.existing_count} items needing attention.`,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Analysis Failed',
        description: error.message || 'Failed to run stock analysis.',
        variant: 'destructive',
      });
    },
  });

  // Clear the list — deletes all draft/approved/ordered/cancelled POs
  const clearListMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('clear_purchase_orders' as never);
      if (error) throw error;
      return data as { deleted_count: number };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['purchase_orders'] });
      const count = (result as { deleted_count: number })?.deleted_count ?? 0;
      toast({
        title: 'List Cleared',
        description: `Removed ${count} item${count !== 1 ? 's' : ''} from the requisition list. Run analysis to regenerate.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Clear Failed',
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
    clearList: clearListMutation.mutate,
    isClearing: clearListMutation.isPending,
  };
}
