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
  const startIso = `${startDate}T00:00:00Z`;
  const endIso = `${endDate || startDate}T23:59:59.999Z`;
  const deptParam = department && department !== 'all' ? department : undefined;

  return useQuery({
    queryKey: ['stock_count', startDate, endDate || startDate, deptParam || 'all'],
    queryFn: async () => {
      const [{ data: reportData, error: reportError }, { data: txData, error: txError }] = await Promise.all([
        supabase.rpc('get_daily_inventory_report', {
          p_start_date: startIso,
          p_end_date: endIso,
          p_include_zero_activity: true,
          p_department: deptParam,
        }),
        supabase
          .from('inventory_transactions')
          .select('item_id, type, quantity, metadata')
          .in('type', ['sale', 'damage', 'adjustment'])
          .gte('transaction_date', startIso)
          .lte('transaction_date', endIso),
      ]);

      if (reportError) throw reportError;
      if (txError) throw txError;

      const byItem = new Map<string, { qty_sold: number; damages: number; phy_count: number | null; comment: string }>();
      (txData || []).forEach((t) => {
        const entry = byItem.get(t.item_id) || { qty_sold: 0, damages: 0, phy_count: null, comment: '' };
        const metadata = (t.metadata || {}) as Record<string, unknown>;
        if (t.type === 'sale') entry.qty_sold += Number(t.quantity);
        if (t.type === 'damage') entry.damages += Number(t.quantity);
        if (t.type === 'adjustment') {
          entry.phy_count = metadata.physical_count === null || metadata.physical_count === undefined
            ? null
            : Number(metadata.physical_count);
          entry.comment = (metadata.comment as string) || '';
        }
        byItem.set(t.item_id, entry);
      });

      return (reportData || [])
        .map((row): DailyStockCountRow => {
          const extra = byItem.get(row.item_id);
          return {
            item_id: row.item_id,
            item_name: row.item_name,
            category: row.category,
            department: row.department || 'Retail',
            unit_of_measure: row.unit_of_measure,
            unit_cost: Number(row.unit_cost) || 0,
            low_stock_threshold: Number(row.low_stock_threshold) || 0,
            opening_stock: Number(row.opening_stock) || 0,
            qty_received: Number(row.qty_received) || 0,
            qty_issued: Number(row.qty_issued) || 0,
            qty_transferred: Number(row.qty_transferred) || 0,
            qty_sold: Number(row.qty_sold) || (extra?.qty_sold ?? 0),
            damages: Number(row.damages) || (extra?.damages ?? 0),
            phy_count: extra?.phy_count ?? null,
            comment: extra?.comment ?? '',
          };
        })
        .sort((a, b) => a.category.localeCompare(b.category) || a.item_name.localeCompare(b.item_name));
    },
  });
}

export async function saveDailyStockEntries(entries: DailyStockEntryInput[]) {
  if (entries.length === 0) return;

  const byDate = new Map<string, DailyStockEntryInput[]>();
  entries.forEach((entry) => {
    const list = byDate.get(entry.date) || [];
    list.push(entry);
    byDate.set(entry.date, list);
  });

  for (const [date, dayEntries] of byDate) {
    const startIso = `${date}T00:00:00Z`;
    const endIso = `${date}T23:59:59.999Z`;
    const itemIds = dayEntries.map((e) => e.item_id);

    const { error: deleteError } = await supabase
      .from('inventory_transactions')
      .delete()
      .in('item_id', itemIds)
      .in('type', ['damage', 'adjustment'])
      .gte('transaction_date', startIso)
      .lte('transaction_date', endIso);

    if (deleteError) throw deleteError;

    const { data: reportData, error: reportError } = await supabase.rpc('get_daily_inventory_report', {
      p_start_date: startIso,
      p_end_date: endIso,
      p_include_zero_activity: true,
    });
    if (reportError) throw reportError;
    const reportByItem = new Map((reportData || []).map((r) => [r.item_id, r]));

    const rows: {
      item_id: string;
      type: 'damage' | 'adjustment';
      quantity: number;
      transaction_date: string;
      department?: string;
      metadata?: { physical_count: number | null; comment: string };
    }[] = [];

    dayEntries.forEach((entry) => {
      const report = reportByItem.get(entry.item_id);
      const opening = Number(report?.opening_stock) || 0;
      const received = Number(report?.qty_received) || 0;
      const issued = Number(report?.qty_issued) || 0;
      const transferred = Number(report?.qty_transferred) || 0;
      const sold = Number(report?.qty_sold) || 0;
      const damaged = entry.damages || 0;

      if (damaged > 0) {
        rows.push({ 
          item_id: entry.item_id, 
          type: 'damage', 
          quantity: damaged, 
          transaction_date: date,
          department: entry.department || 'Retail',
        });
      }

      const hasCount = entry.phy_count !== null && entry.phy_count !== undefined;
      const comment = entry.comment?.trim() || '';
      if (hasCount || comment) {
        const balance = opening + received - issued - transferred - sold - damaged;
        const delta = hasCount ? (entry.phy_count as number) - balance : 0;
        rows.push({
          item_id: entry.item_id,
          type: 'adjustment',
          quantity: delta,
          transaction_date: date,
          department: entry.department || 'Retail',
          metadata: { physical_count: hasCount ? (entry.phy_count as number) : null, comment },
        });
      }
    });

    if (rows.length > 0) {
      const { error: insertError } = await supabase.from('inventory_transactions').insert(rows);
      if (insertError) throw insertError;
    }
  }
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
