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
    queryFn: async () => {
      // Use RPC to bypass PostgREST table schema cache limitations
      const { data, error } = await (supabase as any).rpc('get_reach_sales_reports');

      if (error) {
        console.warn('Error fetching reach_sales_reports via RPC:', error);
        return [] as ReachSalesReport[];
      }

      return (data || []) as ReachSalesReport[];
    },
  });
}

export function useUploadReachSales() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UploadReachSalesInput) => {
      const totalItemsSold = input.items.reduce((sum, item) => sum + item.qty_sold, 0);
      const totalSalesValue = input.items.reduce(
        (sum, item) => sum + item.qty_sold * (item.unit_price || 0),
        0
      );

      // Use RPC function — bypasses PostgREST table schema cache entirely
      const { data, error } = await (supabase as any).rpc('upload_reach_sales_report', {
        p_report_date: input.report_date,
        p_retail_member: input.retail_member_name,
        p_file_name: input.file_name || 'Reach_Sales_Report.pdf',
        p_total_items_sold: totalItemsSold,
        p_total_sales_value: totalSalesValue,
        p_items: input.items.map(item => ({
          item_id: item.item_id,
          qty_sold: item.qty_sold,
          unit_price: item.unit_price || 0,
          department: item.department || 'Retail',
        })),
      });

      if (error) throw error;
      if (data && data.success === false) {
        throw new Error(data.error || 'Upload failed');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reach_sales_reports'] });
      queryClient.invalidateQueries({ queryKey: ['inventory_transactions'] });
      queryClient.invalidateQueries({ queryKey: ['stock_count'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({ title: 'Success', description: 'Sales report uploaded & stock updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Upload Error', description: error.message, variant: 'destructive' });
    },
  });
}
