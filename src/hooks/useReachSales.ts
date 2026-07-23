import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ReachSalesReport {
  id: string;
  report_date: string;
  retail_member_name: string;
  file_name: string | null;
  total_items_sold: number | null;
  total_sales_value: number | null;
  uploaded_at: string;
}

export interface UploadReachSalesInput {
  report_date: string;
  retail_member_name: string;
  file_name?: string;
  items: {
    item_id: string;
    qty_sold: number;
    unit_price?: number;
    department?: string;
  }[];
}

export function useReachSalesReports() {
  return useQuery({
    queryKey: ['reach_sales_reports'],
    staleTime: Infinity,
    queryFn: async () => {
      // Table not provisioned in this environment — return empty gracefully.
      return [] as ReachSalesReport[];
    },
  });
}


export function useUploadReachSales() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UploadReachSalesInput) => {
      const totalItems = input.items.reduce((sum, i) => sum + i.qty_sold, 0);
      const totalValue = input.items.reduce((sum, i) => sum + (i.qty_sold * (i.unit_price || 0)), 0);

      // 1. Record report metadata
      const { data: reportData, error: reportError } = await (supabase as any)
        .from('reach_sales_reports')
        .insert({
          report_date: input.report_date,
          retail_member_name: input.retail_member_name,
          file_name: input.file_name || 'Reach_Sales_Upload.csv',
          total_items_sold: totalItems,
          total_sales_value: totalValue,
        })
        .select()
        .single();

      if (reportError) throw reportError;

      // 2. Delete any existing sale transactions for this date & member to allow clean re-upload
      const { error: deleteError } = await (supabase as any)
        .from('inventory_transactions')
        .delete()
        .eq('transaction_date', input.report_date)
        .eq('type', 'sale')
        .contains('metadata', { retail_member: input.retail_member_name });

      if (deleteError) throw deleteError;

      // 3. Create sale transactions in inventory_transactions
      const rows = input.items
        .filter((item) => item.qty_sold > 0)
        .map((item) => ({
          item_id: item.item_id,
          type: 'sale' as const,
          quantity: item.qty_sold,
          transaction_date: input.report_date,
          department: item.department || 'Retail',
          metadata: {
            retail_member: input.retail_member_name,
            unit_price: item.unit_price || 0,
            report_id: reportData.id,
          },
        }));

      if (rows.length > 0) {
        const { error: insertError } = await (supabase as any)
          .from('inventory_transactions')
          .insert(rows);

        if (insertError) throw insertError;
      }

      return reportData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reach_sales_reports'] });
      queryClient.invalidateQueries({ queryKey: ['daily_stock_count'] });
      queryClient.invalidateQueries({ queryKey: ['stock_count'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({ title: 'Success', description: 'Reach sales report uploaded and stock updated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}
