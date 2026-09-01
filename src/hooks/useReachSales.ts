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
  branch_id?: string | null;
}

export interface UploadReachSalesInput {
  report_date: string;
  retail_member_name: string;
  file_name?: string;
  total_items_sold?: number;
  total_sales_value?: number;
  branch_id?: string;
  items: {
    item_id?: string;
    item_name?: string;
    qty_sold: number;
    unit_price?: number;
    department?: string;
  }[];
}

export function useReachSalesReports(branchId?: string) {
  return useQuery({
    queryKey: ['reach_sales_reports', branchId],
    queryFn: async () => {
      let query = (supabase as unknown as { from: (table: string) => any })
        .from('reach_sales_reports')
        .select('*');

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query.order('uploaded_at', { ascending: false });

      if (error) {
        console.error('Error fetching reach_sales_reports:', error);
        throw error;
      }

      return (data || []) as unknown as ReachSalesReport[];
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

      const totalItemsSold = input.total_items_sold !== undefined
        ? input.total_items_sold
        : input.items.reduce((sum, item) => sum + item.qty_sold, 0);

      const totalSalesValue = input.total_sales_value !== undefined
        ? input.total_sales_value
        : input.items.reduce((sum, item) => sum + item.qty_sold * (item.unit_price || 0), 0);

      const targetBranchId = input.branch_id || '00000000-0000-0000-0000-000000000001';

      // 1. Insert header row into reach_sales_reports table with full sales values
      const { data: header, error: headerError } = await (supabase as unknown as { from: (table: string) => ReturnType<typeof supabase.from> })
        .from('reach_sales_reports')
        .insert({
          report_date: input.report_date,
          retail_member_name: input.retail_member_name,
          file_name: input.file_name || 'Reach_Sales_Report.pdf',
          total_items_sold: totalItemsSold,
          total_sales_value: totalSalesValue,
          branch_id: targetBranchId,
        })
        .select()
        .single();

      if (headerError) throw headerError;

      // 2. Insert sales transactions into inventory_transactions table ONLY for physical catalog items and cups
      const txRows = input.items
        .filter(item => Boolean(item.item_id))
        .map(item => ({
          item_id: item.item_id!,
          type: 'sale',
          quantity: item.qty_sold,
          transaction_date: input.report_date,
          department: item.department || 'Retail',
          branch_id: targetBranchId,
          metadata: {
            retail_member_name: input.retail_member_name,
            unit_price: item.unit_price || 0,
            report_id: header.id,
            file_name: input.file_name || 'Reach_Sales_Report.pdf',
          },
        }));

      if (txRows.length > 0) {
        const { error: txError } = await supabase
          .from('inventory_transactions')
          .insert(txRows);

        if (txError) throw txError;
      }

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

export interface ReachSalesReportDetailItem {
  id: string;
  item_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  category: string;
}

export function useReachSalesReportDetails(reportId: string | null) {
  return useQuery({
    queryKey: ['reach_sales_report_details', reportId],
    enabled: !!reportId,
    queryFn: async () => {
      if (!reportId) return [];
      
      const { data, error } = await supabase
        .from('inventory_transactions')
        .select(`
          id,
          item_id,
          quantity,
          metadata,
          items (
            name,
            category
          )
        `)
        .eq('type', 'sale')
        .eq('metadata->>report_id', reportId);

      if (error) {
        console.error('Error fetching report details:', error);
        throw error;
      }

      return (data || []).map(tx => {
        const items = tx.items as unknown as { name?: string; category?: string } | null;
        const meta = tx.metadata as Record<string, unknown> | null;
        return {
          id: tx.id,
          item_id: tx.item_id,
          item_name: items?.name || 'Unknown Item',
          category: items?.category || 'General',
          quantity: Number(tx.quantity),
          unit_price: Number(meta?.unit_price || 0)
        } as ReachSalesReportDetailItem;
      });
    }
  });
}

export function useDeleteReachSalesReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reportId: string) => {
      const { error: txError } = await supabase
        .from('inventory_transactions')
        .delete()
        .eq('type', 'sale')
        .eq('metadata->>report_id', reportId);

      if (txError) throw txError;

      const { error: headerError } = await (supabase as unknown as { from: (table: string) => ReturnType<typeof supabase.from> })
        .from('reach_sales_reports')
        .delete()
        .eq('id', reportId);

      if (headerError) throw headerError;

      return reportId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reach_sales_reports'] });
      queryClient.invalidateQueries({ queryKey: ['inventory_transactions'] });
      queryClient.invalidateQueries({ queryKey: ['stock_count'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({ title: 'Success', description: 'Sales report deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Delete Error', description: error.message, variant: 'destructive' });
    }
  });
}
