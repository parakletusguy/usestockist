import { Fragment, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { useDailyStockCount, useSaveDailyStockCount, DailyStockCountRow, DailyStockEntryInput } from '@/hooks/useDailyStockCount';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { exportToCSV } from '@/lib/export';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  CalendarIcon, Download, Save, Search, Wifi, WifiOff, CloudOff, PackageX, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type StatusFilter = 'all' | 'flagged' | 'out' | 'low' | 'healthy';
type Status = 'out' | 'low' | 'healthy';

interface RowEdit {
  qty_sold: string;
  damages: string;
  phy_count: string;
  comment: string;
}

function toEdit(row: DailyStockCountRow): RowEdit {
  return {
    qty_sold: row.qty_sold ? String(row.qty_sold) : '',
    damages: row.damages ? String(row.damages) : '',
    phy_count: row.phy_count === null ? '' : String(row.phy_count),
    comment: row.comment || '',
  };
}

function getStatus(balance: number, threshold: number): Status {
  if (balance <= 0) return 'out';
  if (balance <= threshold) return 'low';
  return 'healthy';
}

const statusStyles: Record<Status, string> = {
  out: 'border-l-4 border-l-destructive bg-destructive/5',
  low: 'border-l-4 border-l-amber-500 bg-amber-500/5',
  healthy: 'border-l-4 border-l-transparent',
};

const statusBadge: Record<Status, string> = {
  out: 'text-destructive font-semibold',
  low: 'text-amber-600 dark:text-amber-500 font-semibold',
  healthy: 'text-muted-foreground',
};

const DailyStockCount = () => {
  const [searchParams] = useSearchParams();
  const [date, setDate] = useState<Date>(new Date());
  const dateStr = format(date, 'yyyy-MM-dd');

  const [edits, setEdits] = useState<Record<string, RowEdit>>({});
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    searchParams.get('filter') === 'flagged' ? 'flagged' : 'all'
  );

  const { data: rows, isLoading } = useDailyStockCount(dateStr);
  const saveDailyStockCount = useSaveDailyStockCount(dateStr);
  const { isOnline, isSyncing, pendingCount, addToQueue } = useOfflineSync();

  useEffect(() => {
    if (!rows) return;
    const next: Record<string, RowEdit> = {};
    rows.forEach((row) => { next[row.item_id] = toEdit(row); });
    setEdits(next);
    setDirty(new Set());
  }, [rows]);

  const updateField = (itemId: string, field: keyof RowEdit, value: string) => {
    setEdits((prev) => ({ ...prev, [itemId]: { ...prev[itemId], [field]: value } }));
    setDirty((prev) => new Set(prev).add(itemId));
  };

  const computed = useMemo(() => {
    if (!rows) return [];
    return rows.map((row) => {
      const edit = edits[row.item_id] || toEdit(row);
      const sold = Number(edit.qty_sold) || 0;
      const damages = Number(edit.damages) || 0;
      const balance = row.opening_stock + row.qty_received - row.qty_issued - row.qty_transferred - sold - damages;
      const hasCount = edit.phy_count !== '';
      const phyCount = hasCount ? Number(edit.phy_count) : null;
      const variance = hasCount ? (phyCount as number) - balance : null;
      const varianceValue = variance !== null ? variance * row.unit_cost : null;
      const status = getStatus(balance, row.low_stock_threshold);
      return { row, edit, sold, damages, balance, phyCount, variance, varianceValue, status };
    });
  }, [rows, edits]);

  const categories = useMemo(
    () => Array.from(new Set((rows || []).map((r) => r.category))).sort(),
    [rows]
  );

  const filtered = computed.filter(({ row, status }) => {
    const matchesSearch = row.item_name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || row.category === categoryFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'flagged' && status !== 'healthy') ||
      status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const grouped = useMemo(() => {
    const groups = new Map<string, typeof filtered>();
    filtered.forEach((entry) => {
      const list = groups.get(entry.row.category) || [];
      list.push(entry);
      groups.set(entry.row.category, list);
    });
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const summary = useMemo(() => {
    const counts = { out: 0, low: 0, healthy: 0 };
    computed.forEach(({ status }) => { counts[status]++; });
    return counts;
  }, [computed]);

  const handleSave = async () => {
    const entries: DailyStockEntryInput[] = Array.from(dirty).map((itemId) => {
      const edit = edits[itemId];
      return {
        item_id: itemId,
        date: dateStr,
        qty_sold: Number(edit.qty_sold) || 0,
        damages: Number(edit.damages) || 0,
        phy_count: edit.phy_count === '' ? null : Number(edit.phy_count),
        comment: edit.comment,
      };
    });
    if (entries.length === 0) return;

    if (!isOnline) {
      entries.forEach((entry) => addToQueue(entry));
      setDirty(new Set());
    } else {
      await saveDailyStockCount.mutateAsync(entries);
    }
  };

  const handleExport = () => {
    if (computed.length === 0) return;
    exportToCSV(
      computed.map(({ row, sold, damages, balance, phyCount, variance, varianceValue }) => ({
        category: row.category,
        item: row.item_name,
        unit: row.unit_of_measure,
        qty_received: row.qty_received,
        opening_stock: row.opening_stock,
        issuance: row.qty_issued,
        transfer: row.qty_transferred,
        qty_sold: sold,
        damages,
        stock_balance: balance,
        phy_count: phyCount ?? '',
        variance: variance ?? '',
        unit_cost: row.unit_cost,
        variance_value: varianceValue ?? '',
        comment: row.comment,
      })),
      `daily_stock_count_${dateStr}`,
      [
        { key: 'category', header: 'Category' },
        { key: 'item', header: 'Item' },
        { key: 'unit', header: 'Unit' },
        { key: 'qty_received', header: 'Qty Received' },
        { key: 'opening_stock', header: 'Opening Stock' },
        { key: 'issuance', header: 'Issuance' },
        { key: 'transfer', header: 'Transfer' },
        { key: 'qty_sold', header: 'Qty Sold' },
        { key: 'damages', header: 'Damages' },
        { key: 'stock_balance', header: 'Stock Balance' },
        { key: 'phy_count', header: 'Phy. Count' },
        { key: 'variance', header: 'Variance' },
        { key: 'unit_cost', header: 'Unit Cost' },
        { key: 'variance_value', header: 'Variance Value' },
        { key: 'comment', header: 'Comment' },
      ]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Daily Stock Count</h1>
          <p className="text-muted-foreground">Full-catalog daily reconciliation with automated low-stock flags</p>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <CloudOff className="h-4 w-4" /><span>{pendingCount} pending</span>
            </div>
          )}
          {isOnline ? (
            <div className="flex items-center gap-1 text-sm text-green-600">
              <Wifi className="h-4 w-4" /><span className="hidden sm:inline">Online</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-sm text-destructive">
              <WifiOff className="h-4 w-4" /><span className="hidden sm:inline">Offline</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />{format(date, 'PPP')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus className="pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'out' ? 'all' : 'out')}
          className={cn(
            'rounded-lg border p-3 text-left transition-colors',
            statusFilter === 'out' ? 'border-destructive bg-destructive/10' : 'hover:bg-muted/50'
          )}
        >
          <div className="flex items-center gap-2 text-destructive">
            <PackageX className="h-4 w-4" />
            <span className="text-sm font-medium">Out of Stock</span>
          </div>
          <div className="text-2xl font-bold mt-1">{summary.out}</div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'low' ? 'all' : 'low')}
          className={cn(
            'rounded-lg border p-3 text-left transition-colors',
            statusFilter === 'low' ? 'border-amber-500 bg-amber-500/10' : 'hover:bg-muted/50'
          )}
        >
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Low Stock</span>
          </div>
          <div className="text-2xl font-bold mt-1">{summary.low}</div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'healthy' ? 'all' : 'healthy')}
          className={cn(
            'rounded-lg border p-3 text-left transition-colors',
            statusFilter === 'healthy' ? 'border-green-600 bg-green-600/10' : 'hover:bg-muted/50'
          )}
        >
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-medium">Healthy</span>
          </div>
          <div className="text-2xl font-bold mt-1">{summary.healthy}</div>
        </button>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>{format(date, 'PPP')}</CardTitle>
            <CardDescription>Enter Qty Sold, Damages and Phy. Count — everything else is computed</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 w-[180px]"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="flagged">Flagged Only</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="healthy">Healthy</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={computed.length === 0}>
              <Download className="mr-2 h-4 w-4" />Export
            </Button>
            <Button size="sm" onClick={handleSave} disabled={dirty.size === 0 || saveDailyStockCount.isPending}>
              <Save className="mr-2 h-4 w-4" />Save Day{dirty.size > 0 ? ` (${dirty.size})` : ''}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">Item</TableHead>
                  <TableHead className="text-right">Qty Received</TableHead>
                  <TableHead className="text-right">Opening Stock</TableHead>
                  <TableHead className="text-right">Issuance</TableHead>
                  <TableHead className="text-right">Transfer</TableHead>
                  <TableHead className="text-right min-w-[90px]">Qty Sold</TableHead>
                  <TableHead className="text-right min-w-[90px]">Damages</TableHead>
                  <TableHead className="text-right">Stock Balance</TableHead>
                  <TableHead className="text-right min-w-[90px]">Phy. Count</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                  <TableHead className="text-right">Unit Cost</TableHead>
                  <TableHead className="text-right">Variance Value</TableHead>
                  <TableHead className="min-w-[160px]">Comment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grouped.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center text-muted-foreground py-8">
                      No items match the current filters
                    </TableCell>
                  </TableRow>
                ) : (
                  grouped.map(([category, entries]) => (
                    <Fragment key={category}>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableCell colSpan={13} className="font-semibold py-2">{category}</TableCell>
                      </TableRow>
                      {entries.map(({ row, edit, balance, phyCount, variance, varianceValue, status }) => (
                        <TableRow key={row.item_id} className={statusStyles[status]}>
                          <TableCell className="font-medium">
                            {row.item_name}
                            <div className="text-xs text-muted-foreground">{row.unit_of_measure}</div>
                          </TableCell>
                          <TableCell className="text-right">{row.qty_received}</TableCell>
                          <TableCell className="text-right">{row.opening_stock}</TableCell>
                          <TableCell className="text-right">{row.qty_issued}</TableCell>
                          <TableCell className="text-right">{row.qty_transferred}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={edit.qty_sold}
                              onChange={(e) => updateField(row.item_id, 'qty_sold', e.target.value)}
                              className="h-8 w-20 text-right ml-auto"
                              placeholder="0"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={edit.damages}
                              onChange={(e) => updateField(row.item_id, 'damages', e.target.value)}
                              className="h-8 w-20 text-right ml-auto"
                              placeholder="0"
                            />
                          </TableCell>
                          <TableCell className={cn('text-right', statusBadge[status])}>{balance}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={edit.phy_count}
                              onChange={(e) => updateField(row.item_id, 'phy_count', e.target.value)}
                              className="h-8 w-20 text-right ml-auto"
                              placeholder="-"
                            />
                          </TableCell>
                          <TableCell className="text-right">{variance ?? '-'}</TableCell>
                          <TableCell className="text-right">{row.unit_cost}</TableCell>
                          <TableCell className="text-right">{varianceValue !== null ? varianceValue.toFixed(2) : '-'}</TableCell>
                          <TableCell>
                            <Input
                              value={edit.comment}
                              onChange={(e) => updateField(row.item_id, 'comment', e.target.value)}
                              className="h-8"
                              placeholder="Comment"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyStockCount;
