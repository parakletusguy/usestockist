import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface DailyStockCountRow {
  item_id: string;
  item_name: string;
  category: string;
  department: string;
  departments?: string[];
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
  date?: string;
}

interface SheetRow {
  item_id: string;
  open_qty?: number;
  qty_in?: number;
  close_qty?: number;
  sales_qty?: number;
  remark?: string | null;
  date?: string;
}

interface TxRow {
  item_id: string;
  type: string;
  quantity: number;
  transaction_date?: string;
  department?: string | null;
}

export function useDailyStockCount(startDate: string, endDate?: string, department?: string) {
  const deptParam = department && department !== 'all' ? department : undefined;
  return useQuery({
    queryKey: ['stock_count', startDate, endDate || startDate, deptParam || 'all'],
    staleTime: 5_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const startD = startDate;
      const endD = endDate || startDate;

      // 1. Fetch catalog items & department junction table
      const [itemsRes, itemDeptsRes] = await Promise.all([
        supabase.from('items').select('*').order('name'),
        supabase.from('item_departments').select('item_id, department'),
      ]);

      if (itemsRes.error) throw itemsRes.error;

      // Build map of item_id -> departments[]
      const deptMap = new Map<string, string[]>();
      (itemDeptsRes.data || []).forEach((row) => {
        const existing = deptMap.get(row.item_id) || [];
        if (!existing.includes(row.department)) {
          existing.push(row.department);
        }
        deptMap.set(row.item_id, existing);
      });

      // 2. Fetch current period ledgers & transactions (date >= startD AND date <= endD)
      // AND prior period ledgers & transactions (date < startD) for carry-forward Opening Stock
      const [
        issuanceCurrRes, receivedCurrRes, transferCurrRes, sheetsCurrRes, txCurrRes,
        issuancePriorRes, receivedPriorRes, transferPriorRes, txPriorRes
      ] = await Promise.all([
        supabase.from('issuance_ledger').select('item_id, quantity').gte('date', startD).lte('date', endD),
        supabase.from('received_ledger').select('item_id, quantity').gte('date', startD).lte('date', endD),
        supabase.from('transfer_ledger').select('item_id, quantity').gte('date', startD).lte('date', endD),
        supabase.from('daily_stock_sheets')
          .select('item_id, open_qty, qty_in, close_qty, sales_qty, remark, date')
          .gte('date', startD).lte('date', endD),
        supabase.from('inventory_transactions')
          .select('item_id, type, quantity, department')
          .gte('transaction_date', startD)
          .lte('transaction_date', endD),
        // Prior queries for automatic opening stock calculation
        supabase.from('issuance_ledger').select('item_id, quantity').lt('date', startD),
        supabase.from('received_ledger').select('item_id, quantity').lt('date', startD),
        supabase.from('transfer_ledger').select('item_id, quantity').lt('date', startD),
        supabase.from('inventory_transactions').select('item_id, type, quantity').lt('transaction_date', startD),
      ]);

      const sum = (rows: LedgerRow[] | null, id: string) =>
        (rows || []).filter(r => r.item_id === id).reduce((s, r) => s + Number(r.quantity || 0), 0);

      const sumTx = (rows: TxRow[] | null, id: string, type: string) =>
        (rows || [])
          .filter(r => r.item_id === id && r.type === type)
          .reduce((s, r) => s + Number(r.quantity || 0), 0);

      const sheetsByItem = new Map<string, SheetRow[]>();
      ((sheetsCurrRes.data as SheetRow[]) || []).forEach((s) => {
        const arr = sheetsByItem.get(s.item_id) || [];
        arr.push(s);
        sheetsByItem.set(s.item_id, arr);
      });

      const catalogItems = (itemsRes.data as ItemRow[]) || [];

      // Filter catalog items by department if specified
      const filteredCatalogItems = deptParam
        ? catalogItems.filter(item => {
            const depts = deptMap.get(item.id) || [item.department || 'Retail'];
            return depts.includes(deptParam) || item.department === deptParam;
          })
        : catalogItems;

      const txCurrData = (txCurrRes.data as TxRow[]) || [];
      const txPriorData = (txPriorRes.data as TxRow[]) || [];

      return filteredCatalogItems
        .map((item): DailyStockCountRow => {
          const depts = deptMap.get(item.id) || [item.department || 'Retail'];
          const sheets = sheetsByItem.get(item.id) || [];
          const sheetOpening = sheets.reduce((s, r) => s + Number(r.open_qty || 0), 0);
          const qtyIn = sheets.reduce((s, r) => s + Number(r.qty_in || 0), 0);
          const closing = sheets.reduce((s, r) => s + Number(r.close_qty || 0), 0);
          const sheetSold = sheets.reduce((s, r) => s + Number(r.sales_qty || 0), 0);
          const comment = sheets.map(r => r.remark).filter(Boolean).join('; ');

          // Prior period carry-forward opening stock calculation
          const priorRec = Math.max(sumTx(txPriorData, item.id, 'receive'), sum(receivedPriorRes.data as LedgerRow[], item.id));
          const priorIss = Math.max(sumTx(txPriorData, item.id, 'issuance'), sum(issuancePriorRes.data as LedgerRow[], item.id));
          const priorTrans = Math.max(sumTx(txPriorData, item.id, 'transfer'), sum(transferPriorRes.data as LedgerRow[], item.id));
          const priorSold = sumTx(txPriorData, item.id, 'sale');
          const priorDamages = sumTx(txPriorData, item.id, 'damage');

          const calculatedOpening = Math.max(0, priorRec - priorIss - priorTrans - priorSold - priorDamages);
          const finalOpening = sheetOpening > 0 ? sheetOpening : calculatedOpening;

          // Current period movements
          const txReceived = sumTx(txCurrData, item.id, 'receive');
          const txIssued = sumTx(txCurrData, item.id, 'issuance');
          const txTransferred = sumTx(txCurrData, item.id, 'transfer');
          const txSold = sumTx(txCurrData, item.id, 'sale');
          const txDamages = sumTx(txCurrData, item.id, 'damage');

          const ledgerReceived = sum(receivedCurrRes.data as LedgerRow[], item.id);
          const ledgerIssued = sum(issuanceCurrRes.data as LedgerRow[], item.id);
          const ledgerTransferred = sum(transferCurrRes.data as LedgerRow[], item.id);

          const totalSold = txSold + sheetSold;
          const totalReceived = Math.max(txReceived, ledgerReceived) + qtyIn;
          const totalIssued = Math.max(txIssued, ledgerIssued);
          const totalTransferred = Math.max(txTransferred, ledgerTransferred);

          return {
            item_id: item.id,
            item_name: item.name,
            category: item.category,
            department: item.department || 'Retail',
            departments: depts,
            unit_of_measure: item.unit_of_measure,
            unit_cost: Number(item.unit_cost) || 0,
            low_stock_threshold: Number(item.low_stock_threshold) || 0,
            opening_stock: finalOpening,
            qty_received: totalReceived,
            qty_issued: totalIssued,
            qty_transferred: totalTransferred,
            qty_sold: totalSold,
            damages: txDamages,
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

    if (entry.qty_sold && entry.qty_sold > 0) {
      await supabase.from('inventory_transactions').insert({
        item_id: entry.item_id,
        type: 'sale',
        quantity: entry.qty_sold,
        transaction_date: entry.date,
        department: entry.department || 'Retail',
        metadata: { source: 'stock_count_manual_entry' },
      });
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
      queryClient.invalidateQueries({ queryKey: ['inventory_transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({ title: 'Success', description: 'Stock count saved successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}
