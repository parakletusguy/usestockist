import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { isCubeItem, getCubeBaselineStock, CUBE_BASELINE_DATE } from '@/lib/cubeItems';

const CUBE_DEPARTMENT = 'Cube';
const GUEST_GROUP = 'Guest';


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
  branchId?: string;
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
  branch_id?: string;
}

interface SheetRow {
  item_id: string;
  open_qty?: number;
  qty_in?: number;
  close_qty?: number;
  sales_qty?: number;
  remark?: string | null;
  date?: string;
  branch_id?: string;
}

interface TxRow {
  item_id: string;
  type: string;
  quantity: number;
  transaction_date?: string;
  department?: string | null;
  branch_id?: string;
}

export function useDailyStockCount(startDate: string, endDate?: string, department?: string, branchId?: string, options?: { enabled?: boolean }) {
  const deptParam = department && department !== 'all' ? department : undefined;
  return useQuery({
    queryKey: ['stock_count', startDate, endDate || startDate, deptParam || 'all', branchId || 'all'],
    staleTime: 5_000,
    refetchOnWindowFocus: true,
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      // If department is Cube, ALWAYS run the isolated Cube calculation (never mix with general warehouse receipts)
      if (deptParam === CUBE_DEPARTMENT) {
        return fetchCubeStockCount(startDate, endDate, branchId);
      }

      const startD = startDate;
      const endD = endDate || startDate;
      const startTxD = startD.includes('T') ? startD : `${startD}T00:00:00`;
      const endTxD = endD.includes('T') ? endD : `${endD}T23:59:59.999Z`;

      // Helper to append branch_id filter if provided
      const withBranch = <T>(query: T): T => {
        if (branchId && typeof (query as any).eq === 'function') {
          return (query as any).eq('branch_id', branchId);
        }
        return query;
      };

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
        issuancePriorRes, receivedPriorRes, transferPriorRes, txPriorRes, sheetsPriorRes, txPriorDatedRes
      ] = await Promise.all([
        withBranch(supabase.from('issuance_ledger').select('item_id, quantity').gte('date', startD).lte('date', endD)),
        withBranch(supabase.from('received_ledger').select('item_id, quantity').gte('date', startD).lte('date', endD)),
        withBranch(supabase.from('transfer_ledger').select('item_id, quantity').gte('date', startD).lte('date', endD)),
        withBranch(supabase.from('daily_stock_sheets')
          .select('item_id, open_qty, qty_in, close_qty, sales_qty, remark, date')
          .gte('date', startD).lte('date', endD)),
        withBranch(supabase.from('inventory_transactions')
          .select('item_id, type, quantity, department')
          .gte('transaction_date', startTxD)
          .lte('transaction_date', endTxD)),
        // Prior queries for automatic opening stock calculation
        withBranch(supabase.from('issuance_ledger').select('item_id, quantity').lt('date', startD)),
        withBranch(supabase.from('received_ledger').select('item_id, quantity').lt('date', startD)),
        withBranch(supabase.from('transfer_ledger').select('item_id, quantity').lt('date', startD)),
        withBranch(supabase.from('inventory_transactions').select('item_id, type, quantity').lt('transaction_date', startTxD)),
        withBranch(supabase.from('daily_stock_sheets')
          .select('item_id, close_qty, date')
          .lt('date', startD)
          .order('date', { ascending: false })),
        // Transactions WITH their dates for gap-filling between last sheet and today
        withBranch(supabase.from('inventory_transactions')
          .select('item_id, type, quantity, transaction_date')
          .lt('transaction_date', startTxD)),
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

      // Build map of most recent prior closing count AND date by item_id
      const priorCloseByItem = new Map<string, number>();
      const priorCloseDateByItem = new Map<string, string>(); // item_id -> last sheet date
      ((sheetsPriorRes.data as SheetRow[]) || []).forEach((s) => {
        if (!priorCloseByItem.has(s.item_id) && s.close_qty !== null && s.close_qty !== undefined) {
          priorCloseByItem.set(s.item_id, Number(s.close_qty));
          priorCloseDateByItem.set(s.item_id, s.date || '');
        }
      });

      // Build dated prior transactions for gap-filling
      interface DatedTxRow { item_id: string; type: string; quantity: number; transaction_date: string; }
      const txPriorDated = (txPriorDatedRes.data as DatedTxRow[]) || [];

      // Sum transactions that occurred AFTER the last sheet date and BEFORE startDate
      const sumGapTx = (itemId: string, type: string): number => {
        const lastSheetDate = priorCloseDateByItem.get(itemId);
        if (!lastSheetDate) return 0;
        return txPriorDated
          .filter(r => r.item_id === itemId && r.type === type && r.transaction_date > `${lastSheetDate}T23:59:59`)
          .reduce((s, r) => s + Number(r.quantity || 0), 0);
      };

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
          const priorClose = priorCloseByItem.get(item.id);

          // Gap-fill: apply any transactions that happened AFTER the last sheet date
          // so that days without a submitted stock count still carry forward correctly
          let finalOpening: number;
          if (sheetOpening > 0) {
            finalOpening = sheetOpening;
          } else if (priorClose !== undefined) {
            const gapRec   = sumGapTx(item.id, 'receive');
            const gapSold  = sumGapTx(item.id, 'sale');
            const gapIss   = sumGapTx(item.id, 'issuance');
            const gapTrans = sumGapTx(item.id, 'transfer');
            const gapDmg   = sumGapTx(item.id, 'damage');
            finalOpening = Math.max(0, priorClose + gapRec - gapSold - gapIss - gapTrans - gapDmg);
          } else {
            finalOpening = calculatedOpening;
          }

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
    enabled: options?.enabled ?? true,
  });
}

/**
 * Cube-only stock view.
 * On-hand = what Retail transferred/issued INTO Cube, minus what Cube gave out to guests
 * (issuance to "Guest") and minus sales/damages recorded on Cube stock sheets.
 * It never reflects company-wide quantities.
 */
/**
 * Shared fetcher for Cube stock.
 * Calculates stock strictly from transfers/issuances into Cube minus guest issuances and sales sheets.
 */
export async function fetchCubeStockCount(
  startDate: string,
  endDate?: string,
  branchId?: string
): Promise<DailyStockCountRow[]> {
  const startD = startDate;
  const endD = endDate || startDate;

  const withBranch = <T>(query: T): T => {
    if (branchId && typeof (query as any).eq === 'function') {
      return (query as any).eq('branch_id', branchId);
    }
    return query;
  };

  const [
    itemsRes,
    transferInCurr, issuanceInCurr, issuanceOutCurr, sheetsCurr,
    transferInPrior, issuanceInPrior, issuanceOutPrior, sheetsPrior,
  ] = await Promise.all([
    supabase.from('items').select('*').order('name'),
    withBranch(supabase.from('transfer_ledger').select('item_id, quantity').eq('destination', CUBE_DEPARTMENT).gte('date', startD).lte('date', endD)),
    withBranch(supabase.from('issuance_ledger').select('item_id, quantity').eq('recipient_group', CUBE_DEPARTMENT).gte('date', startD).lte('date', endD)),
    withBranch(supabase.from('issuance_ledger').select('item_id, quantity').eq('recipient_group', GUEST_GROUP).gte('date', startD).lte('date', endD)),
    withBranch(supabase.from('daily_stock_sheets').select('item_id, sales_qty, close_qty, remark').eq('retail_team_name', CUBE_DEPARTMENT).gte('date', startD).lte('date', endD)),
    withBranch(supabase.from('transfer_ledger').select('item_id, quantity').eq('destination', CUBE_DEPARTMENT).gte('date', CUBE_BASELINE_DATE).lt('date', startD)),
    withBranch(supabase.from('issuance_ledger').select('item_id, quantity').eq('recipient_group', CUBE_DEPARTMENT).gte('date', CUBE_BASELINE_DATE).lt('date', startD)),
    withBranch(supabase.from('issuance_ledger').select('item_id, quantity').eq('recipient_group', GUEST_GROUP).gte('date', CUBE_BASELINE_DATE).lt('date', startD)),
    withBranch(supabase.from('daily_stock_sheets').select('item_id, sales_qty').eq('retail_team_name', CUBE_DEPARTMENT).gte('date', CUBE_BASELINE_DATE).lt('date', startD)),
  ]);

  if (itemsRes.error) throw itemsRes.error;

  const sum = (rows: any[] | null, id: string, field = 'quantity') =>
    (rows || []).filter((r) => r.item_id === id).reduce((s, r) => s + Number(r[field] || 0), 0);

  const cubeItems = ((itemsRes.data as ItemRow[]) || []).filter((i) => isCubeItem(i.name));

  return cubeItems
    .map((item): DailyStockCountRow => {
      const priorIn =
        sum(transferInPrior.data as any[], item.id) + sum(issuanceInPrior.data as any[], item.id);
      const priorOut =
        sum(issuanceOutPrior.data as any[], item.id) +
        sum(sheetsPrior.data as any[], item.id, 'sales_qty');

      const currIn =
        sum(transferInCurr.data as any[], item.id) + sum(issuanceInCurr.data as any[], item.id);
      const currOut = sum(issuanceOutCurr.data as any[], item.id);
      const currSheets = ((sheetsCurr.data as any[]) || []).filter((r) => r.item_id === item.id);
      const sold = currSheets.reduce((s, r) => s + Number(r.sales_qty || 0), 0);
      const closing = currSheets.reduce((s, r) => s + Number(r.close_qty || 0), 0);
      const comment = currSheets.map((r) => r.remark).filter(Boolean).join('; ');

      return {
        item_id: item.id,
        item_name: item.name,
        category: item.category,
        department: CUBE_DEPARTMENT,
        departments: [CUBE_DEPARTMENT],
        unit_of_measure: item.unit_of_measure,
        unit_cost: Number(item.unit_cost) || 0,
        low_stock_threshold: Number(item.low_stock_threshold) || 0,
        opening_stock: Math.max(0, getCubeBaselineStock(item.name) + priorIn - priorOut),
        qty_received: currIn,
        qty_issued: currOut,
        qty_transferred: 0,
        qty_sold: sold,
        damages: 0,
        phy_count: closing || null,
        comment,
      };
    })
    .sort((a, b) => a.category.localeCompare(b.category) || a.item_name.localeCompare(b.item_name));
}

/**
 * Cube-only stock view.
 * On-hand = what Retail transferred/issued INTO Cube, minus what Cube gave out to guests
 * (issuance to "Guest") and minus sales/damages recorded on Cube stock sheets.
 * It never reflects company-wide quantities.
 */
export function useCubeStockCount(
  startDate: string,
  endDate?: string,
  branchId?: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ['stock_count', 'cube', startDate, endDate || startDate, branchId || 'all'],
    staleTime: 5_000,
    refetchOnWindowFocus: true,
    enabled: options?.enabled ?? true,
    queryFn: () => fetchCubeStockCount(startDate, endDate, branchId),
  });
}


export async function saveDailyStockEntries(entries: DailyStockEntryInput[]) {
  if (!entries || entries.length === 0) return;
  for (const entry of entries) {
    let existingQuery = supabase
      .from('daily_stock_sheets')
      .select('id')
      .eq('item_id', entry.item_id)
      .eq('date', entry.date);

    if (entry.branchId) {
      existingQuery = existingQuery.eq('branch_id', entry.branchId);
    }

    const { data: existing } = await existingQuery.maybeSingle();

    const payload: Record<string, any> = {
      item_id: entry.item_id,
      date: entry.date,
      sales_qty: entry.qty_sold ?? 0,
      close_qty: entry.phy_count ?? 0,
      remark: entry.comment || null,
      retail_team_name: entry.department || 'Retail',
    };

    if (entry.branchId) {
      payload.branch_id = entry.branchId;
    }

    if (existing?.id) {
      const { error } = await supabase
        .from('daily_stock_sheets')
        .update(payload)
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('daily_stock_sheets')
        .insert(payload as any);
      if (error) throw error;
    }

    if (entry.qty_sold && entry.qty_sold > 0) {
      const txPayload: Record<string, any> = {
        item_id: entry.item_id,
        type: 'sale',
        quantity: entry.qty_sold,
        transaction_date: entry.date,
        department: entry.department || 'Retail',
        metadata: { source: 'stock_count_manual_entry' },
      };
      if (entry.branchId) {
        txPayload.branch_id = entry.branchId;
      }
      await supabase.from('inventory_transactions').insert(txPayload as any);
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

