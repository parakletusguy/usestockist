import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface DailyStockCountRow {
  item_id: string;
  item_name: string;
  category: string;
  department: string;
  unit_of_measure: string;
  unit_cost: number;
  low_stock_threshold: number;
  opening_stock: number;
  qty_received: number;
  qty_issued: number;
  qty_transferred: number;
  qty_sold: number;
  damages: number;
  phy_count: number | null;
  comment: string;
}

export interface DailyStockEntryInput {
  item_id: string;
  date: string;
  qty_sold?: number;
  damages?: number;
  phy_count?: number | null;
  comment?: string;
  department?: string;
}

export function useDailyStockCount(startDate: string, endDate?: string, department?: string) {
  const deptParam = department && department !== 'all' ? department : undefined;
  return useQuery({
    queryKey: ['stock_count', startDate, endDate || startDate, deptParam || 'all'],
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      // Derive daily stock rows from the real ledger tables.
      const sb = supabase as any;
      const startD = startDate;
      const endD = endDate || startDate;

      const [itemsRes, issuanceRes, receivedRes, transferRes, sheetsRes] = await Promise.all([
        sb.from('items').select('*').order('name'),
        sb.from('issuance_ledger').select('item_id, quantity').gte('date', startD).lte('date', endD),
        sb.from('received_ledger').select('item_id, quantity').gte('date', startD).lte('date', endD),
        sb.from('transfer_ledger').select('item_id, quantity').gte('date', startD).lte('date', endD),
        sb.from('daily_stock_sheets')
          .select('item_id, open_qty, qty_in, close_qty, sales_qty, remark')
          .gte('date', startD).lte('date', endD),
      ]);

      const sum = (rows: any[] | null, id: string) =>
        (rows || []).filter(r => r.item_id === id).reduce((s, r) => s + Number(r.quantity || 0), 0);

      const sheetsByItem = new Map<string, any[]>();
      (sheetsRes.data || []).forEach((s: any) => {
        const arr = sheetsByItem.get(s.item_id) || [];
        arr.push(s);
        sheetsByItem.set(s.item_id, arr);
      });

      return (itemsRes.data || [])
        .map((item: any): DailyStockCountRow => {
          const sheets = sheetsByItem.get(item.id) || [];
          const opening = sheets.reduce((s, r) => s + Number(r.open_qty || 0), 0);
          const qtyIn = sheets.reduce((s, r) => s + Number(r.qty_in || 0), 0);
          const closing = sheets.reduce((s, r) => s + Number(r.close_qty || 0), 0);
          const sold = sheets.reduce((s, r) => s + Number(r.sales_qty || 0), 0);
          const comment = sheets.map(r => r.remark).filter(Boolean).join('; ');
          return {
            item_id: item.id,
            item_name: item.name,
            category: item.category,
            department: 'Retail',
            unit_of_measure: item.unit_of_measure,
            unit_cost: Number(item.unit_cost) || 0,
            low_stock_threshold: Number(item.low_stock_threshold) || 0,
            opening_stock: opening,
            qty_received: sum(receivedRes.data, item.id) + qtyIn,
            qty_issued: sum(issuanceRes.data, item.id),
            qty_transferred: sum(transferRes.data, item.id),
            qty_sold: sold,
            damages: 0,
            phy_count: closing || null,
            comment,
          };
        })
        .sort((a: DailyStockCountRow, b: DailyStockCountRow) =>
          a.category.localeCompare(b.category) || a.item_name.localeCompare(b.item_name));
    },
  });
}


export async function saveDailyStockEntries(_entries: DailyStockEntryInput[]) {
  throw new Error('Saving stock count entries is disabled: use the Daily Stock Sheet page instead.');
}


export function useSaveDailyStockCount(date: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entries: DailyStockEntryInput[]) => saveDailyStockEntries(entries),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock_count'] });
      queryClient.invalidateQueries({ queryKey: ['daily_stock_count'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({ title: 'Success', description: 'Stock count saved successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}
