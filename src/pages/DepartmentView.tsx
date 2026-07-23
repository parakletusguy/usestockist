import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useItems } from '@/hooks/useItems';
import { useDailyStockCount } from '@/hooks/useDailyStockCount';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, PackageX, AlertTriangle, CheckCircle2, Search, ArrowRightLeft, Send, PackageCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const DEPARTMENT_MAP: Record<string, string> = {
  retail: 'Retail',
  cube: 'Cube',
  bar: 'Bar',
  nox: 'Nox',
  housekeeping: 'Housekeeping',
  'kitchen-nox': 'Kitchen (Nox)',
};

export default function DepartmentView() {
  const { departmentId } = useParams<{ departmentId: string }>();
  const departmentName = DEPARTMENT_MAP[departmentId || ''] || 'Retail';
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'out' | 'low' | 'healthy'>('all');

  const { data: stockRows, isLoading } = useDailyStockCount(todayStr, todayStr, departmentName);

  const computedItems = useMemo(() => {
    if (!stockRows) return [];
    return stockRows.map((row) => {
      const balance = row.opening_stock + row.qty_received - row.qty_issued - row.qty_transferred - row.qty_sold - row.damages;
      let status: 'out' | 'low' | 'healthy' = 'healthy';
      if (balance <= 0) status = 'out';
      else if (balance <= row.low_stock_threshold) status = 'low';
      return { ...row, balance, status };
    });
  }, [stockRows]);

  const filteredItems = useMemo(() => {
    return computedItems.filter((item) => {
      const matchesSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [computedItems, searchTerm, statusFilter]);

  const kpiCounts = useMemo(() => {
    const counts = { out: 0, low: 0, healthy: 0, total: computedItems.length };
    computedItems.forEach((i) => {
      counts[i.status]++;
    });
    return counts;
  }, [computedItems]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 sm:h-7 sm:w-7 text-primary shrink-0" />
            <h1 className="text-2xl sm:text-3xl font-bold">{departmentName} Department</h1>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
            Department inventory balances, alerts, and stock movements for {departmentName}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button asChild variant="outline" size="sm" className="h-11 sm:h-9 text-base sm:text-xs justify-center">
            <Link to="/ledgers/stock-count">
              <PackageCheck className="mr-1.5 h-4 w-4" /> Stock Count
            </Link>
          </Button>
          <Button asChild size="sm" className="h-11 sm:h-9 text-base sm:text-xs justify-center">
            <Link to="/ledgers/transfers">
              <ArrowRightLeft className="mr-1.5 h-4 w-4" /> Transfer Stock
            </Link>
          </Button>
        </div>
      </div>

      {/* Metric Cards — 2 grid cols on mobile */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground truncate">Total Items</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-2xl sm:text-3xl font-extrabold">{kpiCounts.total}</div>
          </CardContent>
        </Card>

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
          <div className="text-2xl sm:text-3xl font-extrabold mt-1 text-destructive">{kpiCounts.out}</div>
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
          <div className="text-2xl sm:text-3xl font-extrabold mt-1 text-amber-600 dark:text-amber-500">{kpiCounts.low}</div>
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
          <div className="text-2xl sm:text-3xl font-extrabold mt-1 text-green-600">{kpiCounts.healthy}</div>
        </button>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-6">
          <div>
            <CardTitle className="text-base sm:text-lg">{departmentName} Inventory List</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Live stock levels for items in {departmentName}</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-[200px]">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full h-11 sm:h-9 text-base sm:text-xs"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v: string) => setStatusFilter(v)}>
              <SelectTrigger className="w-full sm:w-[140px] h-11 sm:h-9 text-base sm:text-xs">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="out">Out of Stock Only</SelectItem>
                <SelectItem value="low">Low Stock Only</SelectItem>
                <SelectItem value="healthy">Healthy Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap min-w-[150px]">Item Name</TableHead>
                  <TableHead className="whitespace-nowrap">Category</TableHead>
                  <TableHead className="whitespace-nowrap">Unit</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Opening</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Received</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Issued</TableHead>
                  <TableHead className="text-right font-bold text-primary whitespace-nowrap">Sold</TableHead>
                  <TableHead className="text-right font-bold whitespace-nowrap">Current Stock</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Threshold</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Unit Cost ($)</TableHead>
                  <TableHead className="text-center whitespace-nowrap">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground text-xs sm:text-sm">
                      Loading department inventory...
                    </TableCell>
                  </TableRow>
                ) : filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground text-xs sm:text-sm">
                      No items found in {departmentName} matching current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow
                      key={item.item_id}
                      className={cn(
                        item.status === 'out' && 'bg-destructive/10 border-l-4 border-l-destructive',
                        item.status === 'low' && 'bg-amber-500/10 border-l-4 border-l-amber-500'
                      )}
                    >
                      <TableCell className="font-medium whitespace-nowrap">{item.item_name}</TableCell>
                      <TableCell className="whitespace-nowrap">{item.category}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{item.unit_of_measure}</TableCell>
                      <TableCell className="text-right">{item.opening_stock}</TableCell>
                      <TableCell className="text-right">{item.qty_received}</TableCell>
                      <TableCell className="text-right">{item.qty_issued}</TableCell>
                      <TableCell className="text-right font-semibold text-primary">{item.qty_sold}</TableCell>
                      <TableCell className="text-right font-extrabold text-sm">{item.balance}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">{item.low_stock_threshold}</TableCell>
                      <TableCell className="text-right">${item.unit_cost.toFixed(2)}</TableCell>
                      <TableCell className="text-center whitespace-nowrap">
                        {item.status === 'out' && (
                          <span className="px-2 py-1 rounded-full text-xs font-bold bg-destructive/20 text-destructive">
                            🔴 Out of Stock
                          </span>
                        )}
                        {item.status === 'low' && (
                          <span className="px-2 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-700 dark:text-amber-400">
                            🟡 Low Stock
                          </span>
                        )}
                        {item.status === 'healthy' && (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-600">
                            🟢 Healthy
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
