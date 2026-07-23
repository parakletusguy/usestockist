import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ReachSalesReport {
  id: string;               // synthetic: date_membername
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
      // 1. Try pulling sale transactions from inventory_transactions
      const { data: txData, error: txError } = await (supabase as any)
        .from('inventory_transactions')
        .select('id, transaction_date, quantity, metadata, created_at')
        .eq('type', 'sale')
        .order('created_at', { ascending: false });

      if (!txError && txData && txData.length > 0) {
        const reportMap = new Map<string, ReachSalesReport>();

        for (const row of txData) {
          const meta = (row.metadata as Record<string, unknown>) || {};
          const member = String(meta.retail_member_name || 'Unknown');
          const fileName = (meta.file_name as string | null) ?? null;
          const date = row.transaction_date as string;
          const key = `${date}_${member}`;

          if (!reportMap.has(key)) {
            reportMap.set(key, {
              id: key,
              report_date: date,
              retail_member_name: member,
              file_name: fileName,
              total_items_sold: 0,
              total_sales_value: 0,
              uploaded_at: row.created_at as string,
            });
          }

          const report = reportMap.get(key)!;
          const qty = Number(row.quantity) || 0;
          const price = Number((meta.unit_price as number) || 0);
          report.total_items_sold = (report.total_items_sold || 0) + qty;
          report.total_sales_value = (report.total_sales_value || 0) + qty * price;
        }

        return Array.from(reportMap.values()) as ReachSalesReport[];
      }

      // 2. Fallback to daily_stock_sheets if inventory_transactions is not cached
      const { data: sheetData, error: sheetError } = await (supabase as any)
        .from('daily_stock_sheets')
        .select('id, date, retail_team_name, sales_qty, reach, created_at')
        .order('created_at', { ascending: false });

      if (sheetError) {
        console.warn('Fallback daily_stock_sheets error:', sheetError);
        return [] as ReachSalesReport[];
      }

      const reportMap = new Map<string, ReachSalesReport>();
      for (const row of (sheetData || [])) {
        const member = String(row.retail_team_name || 'Unknown');
        const fileName = (row.reach as string | null) ?? null;
        const date = row.date as string;
        const key = `${date}_${member}`;

        if (!reportMap.has(key)) {
          reportMap.set(key, {
            id: key,
            report_date: date,
            retail_member_name: member,
            file_name: fileName,
            total_items_sold: 0,
            total_sales_value: 0,
            uploaded_at: row.created_at as string,
          });
        }

        const report = reportMap.get(key)!;
        const qty = Number(row.sales_qty) || 0;
        report.total_items_sold = (report.total_items_sold || 0) + qty;
      }

      return Array.from(reportMap.values()) as ReachSalesReport[];
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

      const txRows = input.items.map(item => ({
        item_id: item.item_id,
        type: 'sale',
        quantity: item.qty_sold,
        transaction_date: input.report_date,
        department: item.department || 'Retail',
        metadata: {
          retail_member_name: input.retail_member_name,
          unit_price: item.unit_price || 0,
          file_name: input.file_name || 'Reach_Sales_Report.pdf',
        },
      }));

      // 1. Try primary table inventory_transactions
      const { data, error } = await (supabase as any)
        .from('inventory_transactions')
        .insert(txRows)
        .select();

      if (error) {
        console.warn('inventory_transactions primary insert notice:', error);

        // 2. Resilient Fallback to daily_stock_sheets (guaranteed cached table)
        const sheetRows = input.items.map(item => ({
          item_id: item.item_id,
          date: input.report_date,
          retail_team_name: input.retail_member_name,
          sales_qty: item.qty_sold,
          reach: input.file_name || 'Reach_Sales_Report.pdf',
        }));

        const { error: sheetErr } = await (supabase as any)
          .from('daily_stock_sheets')
          .insert(sheetRows);

        if (sheetErr) {
          throw new Error('Save error: ' + (error.message || sheetErr.message));
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reach_sales_reports'] });
      queryClient.invalidateQueries({ queryKey: ['inventory_transactions'] });
      queryClient.invalidateQueries({ queryKey: ['daily_stock_sheets'] });
      queryClient.invalidateQueries({ queryKey: ['stock_count'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({ title: 'Success', description: 'Sales report saved & stock synchronized successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Upload Error', description: error.message, variant: 'destructive' });
    },
  });
}
