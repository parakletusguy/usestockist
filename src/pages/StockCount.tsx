import { Fragment, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { useDailyStockCount, useSaveDailyStockCount, DailyStockCountRow, DailyStockEntryInput } from '@/hooks/useDailyStockCount';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { DEPARTMENTS } from '@/lib/validation';
import { exportToCSV } from '@/lib/export';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CalendarIcon, Download, Save, Search, Wifi, WifiOff, CloudOff, PackageX, AlertTriangle, CheckCircle2, Building2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

type PeriodType = 'daily' | 'weekly' | 'monthly' | 'custom';
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
  out: 'text-destructive font-bold',
  low: 'text-amber-600 dark:text-amber-500 font-bold',
  healthy: 'text-muted-foreground',
};

/** Mobile card for a single stock item */
function MobileStockCard({
  row,
  edit,
  sold,
  balance,
  phyCount,
  variance,
  varianceValue,
  status,
  onUpdate,
}: {
  row: DailyStockCountRow;
  edit: RowEdit;
  sold: number;
  balance: number;
  phyCount: number | null;
  variance: number | null;
  varianceValue: number | null;
  status: Status;
  onUpdate: (field: keyof RowEdit, value: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={cn('rounded-lg border p-3 space-y-2', statusStyles[status])}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {status === 'out' && <span className="text-destructive font-bold text-sm">🔴</span>}
            {status === 'low' && <span className="text-amber-500 font-bold text-sm">🟡</span>}
            <p className="font-semibold text-sm truncate">{row.item_name}</p>
          </div>
          <p className="text-xs text-muted-foreground">{row.unit_of_measure} · {row.department}</p>
        </div>
        <div className="text-right shrink-0">
          <div className={cn('text-xl font-extrabold', statusBadge[status])}>{balance}</div>
          <div className="text-[10px] text-muted-foreground">Stock Balance</div>
        </div>
      </div>

      {/* Quick edit fields always visible */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-muted-foreground font-medium block mb-1">Damages</label>
          <Input
            type="number"
            value={edit.damages}
            onChange={(e) => onUpdate('damages', e.target.value)}
            className="h-9 text-sm text-right"
            placeholder="0"
          />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground font-medium block mb-1">Phy. Count</label>
          <Input
            type="number"
            value={edit.phy_count}
            onChange={(e) => onUpdate('phy_count', e.target.value)}
            className="h-9 text-sm text-right"
            placeholder="-"
          />
        </div>
      </div>

      {/* Comment */}
      <Input
        value={edit.comment}
        onChange={(e) => onUpdate('comment', e.target.value)}
        className="h-9 text-sm"
        placeholder="Comment..."
      />

      {/* Expand to see all columns */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors w-full"
      >
        {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        {expanded ? 'Hide details' : 'Show all details'}
      </button>

      {expanded && (
        <div className="grid grid-cols-3 gap-2 pt-1 border-t text-xs">
          <div className="text-center">
            <div className="text-muted-foreground">Opening</div>
            <div className="font-medium">{row.opening_stock}</div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground">Received</div>
            <div className="font-medium">{row.qty_received}</div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground">Issued</div>
            <div className="font-medium">{row.qty_issued}</div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground">Transferred</div>
            <div className="font-medium">{row.qty_transferred}</div>
          </div>
          <div className="text-center">
            <div className="text-primary text-muted-foreground">Sold</div>
            <div className="font-semibold text-primary">{sold}</div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground">Variance</div>
            <div className="font-medium">{variance ?? '-'}</div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground">Unit Cost</div>
            <div className="font-medium">${row.unit_cost.toFixed(2)}</div>
          </div>
          <div className="text-center col-span-2">
            <div className="text-muted-foreground">Variance Value</div>
            <div className="font-medium">{varianceValue !== null ? `$${varianceValue.toFixed(2)}` : '-'}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StockCount() {
  const [searchParams] = useSearchParams();
  const [period, setPeriod] = useState<PeriodType>('daily');
  const [singleDate, setSingleDate] = useState<Date>(new Date());
  const [customStart, setCustomStart] = useState<Date | undefined>();
  const [customEnd, setCustomEnd] = useState<Date | undefined>();
  const [departmentFilter, setDepartmentFilter] = useState('all');

  const [edits, setEdits] = useState<Record<string, RowEdit>>({});
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    searchParams.get('filter') === 'flagged' ? 'flagged' : 'all'
  );

  // Compute date range based on selected period
  const dateRange = useMemo(() => {
    const today = singleDate;
    if (period === 'daily') {
      const d = format(today, 'yyyy-MM-dd');
      return { start: d, end: d };
    }
    if (period === 'weekly') {
      return {
        start: format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        end: format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      };
    }
    if (period === 'monthly') {
      return {
        start: format(startOfMonth(today), 'yyyy-MM-dd'),
        end: format(endOfMonth(today), 'yyyy-MM-dd'),
      };
    }
    return {
      start: customStart ? format(customStart, 'yyyy-MM-dd') : format(today, 'yyyy-MM-dd'),
      end: customEnd ? format(customEnd, 'yyyy-MM-dd') : format(today, 'yyyy-MM-dd'),
    };
  }, [period, singleDate, customStart, customEnd]);

  const { data: rows, isLoading } = useDailyStockCount(dateRange.start, dateRange.end, departmentFilter);
  const saveStockCount = useSaveDailyStockCount(dateRange.start);
  const { isOnline, pendingCount, addToQueue } = useOfflineSync();

  useEffect(() => {
    if (!rows) return;
    const next: Record<string, RowEdit> = {};
    rows.forEach((row) => {
      next[row.item_id] = toEdit(row);
    });
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
      const sold = row.qty_sold || Number(edit.qty_sold) || 0;
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

  const categories = useMemo(() => Array.from(new Set((rows || []).map((r) => r.category))).sort() as string[], [rows]);

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
    computed.forEach(({ status }) => {
      counts[status]++;
    });
    return counts;
  }, [computed]);

  const handleSave = async () => {
    const entries: DailyStockEntryInput[] = Array.from(dirty).map((itemId) => {
      const edit = edits[itemId];
      const itemRow = rows?.find((r) => r.item_id === itemId);
      return {
        item_id: itemId,
        date: dateRange.start,
        qty_sold: Number(edit.qty_sold) || 0,
        damages: Number(edit.damages) || 0,
        phy_count: edit.phy_count === '' ? null : Number(edit.phy_count),
        comment: edit.comment,
        department: itemRow?.department || 'Retail',
      };
    });
    if (entries.length === 0) return;

    if (!isOnline) {
      entries.forEach((entry) => addToQueue(entry as any));
      setDirty(new Set());
    } else {
      await saveStockCount.mutateAsync(entries);
    }
  };

  const handleExport = () => {
    if (computed.length === 0) return;
    exportToCSV(
      computed.map(({ row, sold, damages, balance, phyCount, variance, varianceValue }) => ({
        category: row.category,
        department: row.department,
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
      `stock_count_${dateRange.start}_to_${dateRange.end}`,
      [
        { key: 'category', header: 'Category' },
        { key: 'department', header: 'Department' },
        { key: 'item', header: 'Item' },
        { key: 'unit', header: 'Unit' },
        { key: 'qty_received', header: 'Qty Received' },
        { key: 'opening_stock', header: 'Opening Stock' },
        { key: 'issuance', header: 'Issuance' },
        { key: 'transfer', header: 'Transfer' },
        { key: 'qty_sold', header: 'Qty Sold (Reach)' },
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

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold">Reconciled Stock Count</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
            Auto-reconciles Reach sales reports, ledgers, and physical counts with automated 🔴 Out-of-Stock and 🟡 Low-Stock alerts
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <CloudOff className="h-4 w-4" />
              <span>{pendingCount} pending</span>
            </div>
          )}
          {isOnline ? (
            <div className="flex items-center gap-1 text-sm text-green-600 font-medium">
              <Wifi className="h-4 w-4" />
              <span>Online</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-sm text-destructive font-medium">
              <WifiOff className="h-4 w-4" />
              <span>Offline</span>
            </div>
          )}
        </div>
      </div>

      {/* Control Bar: Time Periods & Department Selection */}
      <div className="flex flex-col gap-3 bg-muted/30 p-3 sm:p-4 rounded-lg border">
        <div className="flex flex-wrap items-center gap-2">
          {/* Period Selector Tabs */}
          <div className="flex items-center gap-1 bg-background border rounded-lg p-1 overflow-x-auto">
            {(['daily', 'weekly', 'monthly', 'custom'] as PeriodType[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition-colors whitespace-nowrap',
                  period === p ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted text-muted-foreground'
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Date Controls + Department Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {period !== 'custom' ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 justify-start text-left font-normal text-xs">
                  <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                  {format(singleDate, 'PP')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={singleDate} onSelect={(d) => d && setSingleDate(d)} />
              </PopoverContent>
            </Popover>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 justify-start text-left text-xs">
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {customStart ? format(customStart, 'MMM d') : 'Start'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={customStart} onSelect={setCustomStart} />
                </PopoverContent>
              </Popover>
              <span className="text-xs text-muted-foreground">to</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 justify-start text-left text-xs">
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {customEnd ? format(customEnd, 'MMM d') : 'End'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={customEnd} onSelect={setCustomEnd} />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Department Filter */}
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="h-9 text-xs w-auto min-w-[120px]">
              <Building2 className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {DEPARTMENTS.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid gap-3 grid-cols-3">
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'out' ? 'all' : 'out')}
          className={cn(
            'rounded-lg border p-3 text-left transition-all min-h-[44px]',
            statusFilter === 'out' ? 'border-destructive bg-destructive/15 ring-2 ring-destructive' : 'hover:bg-muted/50'
          )}
        >
          <div className="flex items-center gap-1.5 text-destructive font-bold">
            <PackageX className="h-4 w-4 shrink-0" />
            <span className="text-xs">🔴 Out</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold mt-1 text-destructive">{summary.out}</div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'low' ? 'all' : 'low')}
          className={cn(
            'rounded-lg border p-3 text-left transition-all min-h-[44px]',
            statusFilter === 'low' ? 'border-amber-500 bg-amber-500/15 ring-2 ring-amber-500' : 'hover:bg-muted/50'
          )}
        >
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-500 font-bold">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="text-xs">🟡 Low</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold mt-1 text-amber-600 dark:text-amber-500">{summary.low}</div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'healthy' ? 'all' : 'healthy')}
          className={cn(
            'rounded-lg border p-3 text-left transition-all min-h-[44px]',
            statusFilter === 'healthy' ? 'border-green-600 bg-green-500/10 ring-2 ring-green-600' : 'hover:bg-muted/50'
          )}
        >
          <div className="flex items-center gap-1.5 text-green-600 font-bold">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="text-xs">🟢 OK</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold mt-1 text-green-600">{summary.healthy}</div>
        </button>
      </div>

      {/* Main Content Card */}
      <Card>
        <CardHeader className="flex flex-col gap-3 pb-3">
          <div>
            <CardTitle className="text-sm sm:text-base">
              Reconciliation Grid ({dateRange.start} to {dateRange.end})
            </CardTitle>
            <CardDescription className="text-xs">
              Qty Sold automatically synced from Reach Sales uploads.
            </CardDescription>
          </div>
          {/* Search, Filter, Export, Save */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[120px]">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-xs w-full"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-auto min-w-[110px] h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={computed.length === 0} className="h-9">
              <Download className="mr-1.5 h-4 w-4" />
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">CSV</span>
            </Button>
            <Button size="sm" onClick={handleSave} disabled={dirty.size === 0 || saveStockCount.isPending} className="h-9">
              <Save className="mr-1.5 h-4 w-4" />
              Save ({dirty.size})
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Loading inventory reconciliation...
            </div>
          ) : grouped.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No items match current filters.
            </div>
          ) : (
            <>
              {/* Mobile Card Layout — shown on small screens */}
              <div className="space-y-3 md:hidden">
                {grouped.map(([category, entries]) => (
                  <div key={category} className="space-y-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1 py-1 bg-muted/50 rounded">
                      {category} ({entries.length})
                    </div>
                    {entries.map(({ row, edit, sold, balance, phyCount, variance, varianceValue, status }) => (
                      <MobileStockCard
                        key={row.item_id}
                        row={row}
                        edit={edit}
                        sold={sold}
                        balance={balance}
                        phyCount={phyCount}
                        variance={variance}
                        varianceValue={varianceValue}
                        status={status}
                        onUpdate={(field, value) => updateField(row.item_id, field, value)}
                      />
                    ))}
                  </div>
                ))}
              </div>

              {/* Desktop Table — hidden on small screens, shown md+ */}
              <div className="overflow-x-auto rounded-md border hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[180px]">Item</TableHead>
                      <TableHead>Dept</TableHead>
                      <TableHead className="text-right">Qty Received</TableHead>
                      <TableHead className="text-right">Opening Stock</TableHead>
                      <TableHead className="text-right">Issuance</TableHead>
                      <TableHead className="text-right">Transfer</TableHead>
                      <TableHead className="text-right font-bold text-primary">Reach Qty Sold</TableHead>
                      <TableHead className="text-right min-w-[80px]">Damages</TableHead>
                      <TableHead className="text-right font-bold">Stock Balance</TableHead>
                      <TableHead className="text-right min-w-[90px]">Phy. Count</TableHead>
                      <TableHead className="text-right">Variance</TableHead>
                      <TableHead className="text-right">Unit Cost ($)</TableHead>
                      <TableHead className="text-right">Variance Val ($)</TableHead>
                      <TableHead className="min-w-[140px]">Comment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grouped.map(([category, entries]) => (
                      <Fragment key={category}>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                          <TableCell colSpan={14} className="font-bold py-2 text-xs uppercase tracking-wider">
                            {category} ({entries.length})
                          </TableCell>
                        </TableRow>
                        {entries.map(({ row, edit, sold, balance, phyCount, variance, varianceValue, status }) => (
                          <TableRow key={row.item_id} className={statusStyles[status]}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-1.5">
                                {status === 'out' && <span className="text-destructive font-bold">🔴</span>}
                                {status === 'low' && <span className="text-amber-500 font-bold">🟡</span>}
                                <span>{row.item_name}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">{row.unit_of_measure}</div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{row.department}</TableCell>
                            <TableCell className="text-right">{row.qty_received}</TableCell>
                            <TableCell className="text-right">{row.opening_stock}</TableCell>
                            <TableCell className="text-right">{row.qty_issued}</TableCell>
                            <TableCell className="text-right">{row.qty_transferred}</TableCell>
                            <TableCell className="text-right font-semibold text-primary">{sold}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={edit.damages}
                                onChange={(e) => updateField(row.item_id, 'damages', e.target.value)}
                                className="h-8 w-16 text-right ml-auto text-xs"
                                placeholder="0"
                              />
                            </TableCell>
                            <TableCell className={cn('text-right font-bold text-sm', statusBadge[status])}>
                              {balance}
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={edit.phy_count}
                                onChange={(e) => updateField(row.item_id, 'phy_count', e.target.value)}
                                className="h-8 w-20 text-right ml-auto text-xs"
                                placeholder="-"
                              />
                            </TableCell>
                            <TableCell className="text-right">{variance ?? '-'}</TableCell>
                            <TableCell className="text-right">{row.unit_cost.toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                              {varianceValue !== null ? varianceValue.toFixed(2) : '-'}
                            </TableCell>
                            <TableCell>
                              <Input
                                value={edit.comment}
                                onChange={(e) => updateField(row.item_id, 'comment', e.target.value)}
                                className="h-8 text-xs"
                                placeholder="Comment"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
