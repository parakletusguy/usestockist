import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { TablesInsert } from '@/integrations/supabase/types';

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
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reach_sales_reports')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (error) {
        console.error('Error fetching reach_sales_reports:', error);
        throw error;
      }

      return (data || []) as ReachSalesReport[];
    },
  });
}

export function useUploadReachSales() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UploadReachSalesInput) => {
      if (!input.items || input.items.length === 0) {
        throw new Error('No items to upload');
      }

      const totalItemsSold = input.items.reduce((sum, item) => sum + item.qty_sold, 0);
      const totalSalesValue = input.items.reduce(
        (sum, item) => sum + item.qty_sold * (item.unit_price || 0),
        0
      );

      // 1. Insert header row into reach_sales_reports table
      const { data: header, error: headerError } = await supabase
        .from('reach_sales_reports')
        .insert({
          report_date: input.report_date,
          retail_member_name: input.retail_member_name,
          file_name: input.file_name || 'Reach_Sales_Report.pdf',
          total_items_sold: totalItemsSold,
          total_sales_value: totalSalesValue,
        })
        .select()
        .single();

      if (headerError) throw headerError;

      // 2. Insert sales transactions into inventory_transactions table
      const txRows: TablesInsert<'inventory_transactions'>[] = input.items.map(item => ({
        item_id: item.item_id,
        type: 'sale',
        quantity: item.qty_sold,
        transaction_date: input.report_date,
        department: item.department || 'Retail',
        metadata: {
          retail_member_name: input.retail_member_name,
          unit_price: item.unit_price || 0,
          report_id: header.id,
          file_name: input.file_name || 'Reach_Sales_Report.pdf',
        },
      }));

      const { error: txError } = await supabase
        .from('inventory_transactions')
        .insert(txRows);

      if (txError) throw txError;

      return header;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reach_sales_reports'] });
      queryClient.invalidateQueries({ queryKey: ['inventory_transactions'] });
      queryClient.invalidateQueries({ queryKey: ['stock_count'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({ title: 'Success', description: 'Sales report saved & stock synchronized successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Upload Error', description: error.message, variant: 'destructive' });
    },
  });
}
