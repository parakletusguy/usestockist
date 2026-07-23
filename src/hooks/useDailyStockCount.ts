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

interface ItemRow {
  id: string;
  name: string;
  category: string;
  department?: string;
  unit_of_measure: string;
  unit_cost?: number;
  low_stock_threshold?: number;
}

interface LedgerRow {
  item_id: string;
  quantity?: number;
}

interface SheetRow {
  item_id: string;
  open_qty?: number;
  qty_in?: number;
  close_qty?: number;
  sales_qty?: number;
  remark?: string | null;
}

export function useDailyStockCount(startDate: string, endDate?: string, department?: string) {
  const deptParam = department && department !== 'all' ? department : undefined;
  return useQuery({
    queryKey: ['stock_count', startDate, endDate || startDate, deptParam || 'all'],
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const startD = startDate;
      const endD = endDate || startDate;

      let itemsQuery = supabase.from('items').select('*').order('name');
      if (deptParam) {
        itemsQuery = itemsQuery.eq('department', deptParam);
      }

      const [itemsRes, issuanceRes, receivedRes, transferRes, sheetsRes] = await Promise.all([
        itemsQuery,
        supabase.from('issuance_ledger').select('item_id, quantity').gte('date', startD).lte('date', endD),
        supabase.from('received_ledger').select('item_id, quantity').gte('date', startD).lte('date', endD),
        supabase.from('transfer_ledger').select('item_id, quantity').gte('date', startD).lte('date', endD),
        supabase.from('daily_stock_sheets')
          .select('item_id, open_qty, qty_in, close_qty, sales_qty, remark')
          .gte('date', startD).lte('date', endD),
      ]);

      if (itemsRes.error) throw itemsRes.error;

      const sum = (rows: LedgerRow[] | null, id: string) =>
        (rows || []).filter(r => r.item_id === id).reduce((s, r) => s + Number(r.quantity || 0), 0);

      const sheetsByItem = new Map<string, SheetRow[]>();
      ((sheetsRes.data as SheetRow[]) || []).forEach((s) => {
        const arr = sheetsByItem.get(s.item_id) || [];
        arr.push(s);
        sheetsByItem.set(s.item_id, arr);
      });

      const catalogItems = (itemsRes.data as ItemRow[]) || [];

      return catalogItems
        .map((item): DailyStockCountRow => {
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
            department: item.department || 'Retail',
            unit_of_measure: item.unit_of_measure,
            unit_cost: Number(item.unit_cost) || 0,
            low_stock_threshold: Number(item.low_stock_threshold) || 0,
            opening_stock: opening,
            qty_received: sum(receivedRes.data as LedgerRow[], item.id) + qtyIn,
            qty_issued: sum(issuanceRes.data as LedgerRow[], item.id),
            qty_transferred: sum(transferRes.data as LedgerRow[], item.id),
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

export async function saveDailyStockEntries(entries: DailyStockEntryInput[]) {
  if (!entries || entries.length === 0) return;
  for (const entry of entries) {
    const { data: existing } = await supabase
      .from('daily_stock_sheets')
      .select('id')
      .eq('item_id', entry.item_id)
      .eq('date', entry.date)
      .maybeSingle();

    const payload = {
      item_id: entry.item_id,
      date: entry.date,
      sales_qty: entry.qty_sold ?? 0,
      close_qty: entry.phy_count ?? 0,
      remark: entry.comment || null,
      retail_team_name: entry.department || 'Retail',
    };

    if (existing?.id) {
      const { error } = await supabase
        .from('daily_stock_sheets')
        .update(payload)
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('daily_stock_sheets')
        .insert(payload);
      if (error) throw error;
    }
  }
}

export function useSaveDailyStockCount(_date: string) {
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
