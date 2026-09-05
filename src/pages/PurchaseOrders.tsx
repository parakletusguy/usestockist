import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { useBranch } from '@/contexts/BranchContext';
import { useDailyStockCount, useCubeStockCount } from '@/hooks/useDailyStockCount';
import { exportToCSV } from '@/lib/export';
import { getBranchDepartments } from '@/lib/validation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ClipboardList,
  AlertTriangle,
  PackageX,
  RefreshCw,
  ShieldAlert,
  Building2,
  Download,
  Search,
  ShoppingBag,
  Wine,
  Utensils,
  Sparkles,
  Box,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  CheckSquare,
  Square,
  PackageCheck,
  FileSpreadsheet,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export interface ReorderItem {
  item_id: string;
  item_name: string;
  category: string;
  department: string;
  unit_of_measure: string;
  unit_cost: number;
  low_stock_threshold: number;
  balance: number;
  storeStock?: number;
  suggestedQty: number;
  status: 'out' | 'low' | 'healthy';
}

const DEPARTMENTS = ['Retail', 'Bar', 'Bush Bar', 'Box Signature Bar', 'Housekeeping', 'Kitchen', 'Cube'] as const;

const DEPT_ICONS: Record<string, React.ReactNode> = {
  Retail: <ShoppingBag className="h-4 w-4 text-blue-500" />,
  Bar: <Wine className="h-4 w-4 text-purple-500" />,
  Kitchen: <Utensils className="h-4 w-4 text-amber-500" />,
  Housekeeping: <Sparkles className="h-4 w-4 text-emerald-500" />,
  Cube: <Box className="h-4 w-4 text-indigo-500" />,
  'Bush Bar': <Wine className="h-4 w-4 text-rose-500" />,
  'Box Signature Bar': <Wine className="h-4 w-4 text-violet-500" />,
};

export default function PurchaseOrders() {
  const { session } = useAuth();
  const { canManageReorders } = useRole(session);
  const { activeBranch } = useBranch();

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const activeDepts = useMemo(() => getBranchDepartments(activeBranch?.name), [activeBranch]);

  // Fetch live stock counts for all general items and Cube items
  const { data: stockRows, isLoading: isLoadingStock, refetch: refetchStock } = useDailyStockCount(
    todayStr,
    todayStr,
    undefined,
    activeBranch?.id
  );
  const { data: cubeStockRows, isLoading: isLoadingCube } = useCubeStockCount(
    todayStr,
    todayStr,
    activeBranch?.id
  );

  const isLoading = isLoadingStock || isLoadingCube;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [customQuantities, setCustomQuantities] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'needs_reorder' | 'out' | 'low' | 'all'>('needs_reorder');
  const [collapsedDepts, setCollapsedDepts] = useState<Set<string>>(new Set());
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Non-manager role protection guard
  if (!canManageReorders) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md w-full text-center border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-2">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <CardTitle className="text-xl">Manager Access Required</CardTitle>
            <CardDescription>
              Please contact your administrator if you require purchasing authority.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Please contact your administrator if you require purchasing authority.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Build list of items with live computed balances and suggested order quantities
  const allReorderItems = useMemo<ReorderItem[]>(() => {
    if (!stockRows) return [];

    // Map Cube items for quick lookup
    const cubeMap = new Map<string, number>();
    (cubeStockRows || []).forEach((r) => {
      const bal = r.opening_stock + r.qty_received - r.qty_issued - r.qty_transferred - r.qty_sold - r.damages;
      cubeMap.set(r.item_id, bal);
    });

    const itemsList: ReorderItem[] = [];

    stockRows.forEach((row) => {
      const depts =
        row.departments && row.departments.length > 0
          ? row.departments
          : [row.department || 'Retail'];

      // Only iterate over departments that exist in the active branch
      const validDepts = depts.filter((d) => activeDepts.includes(d));

      validDepts.forEach((dept) => {
        const isCubeDept = dept === 'Cube';
        const generalBalance =
          row.opening_stock + row.qty_received - row.qty_issued - row.qty_transferred - row.qty_sold - row.damages;
        const cubeRoomStock = cubeMap.get(row.item_id) ?? 0;
        const storeStock = Math.max(0, generalBalance);
        const isCubeOnly = validDepts.length === 1 && isCubeDept;

        // When evaluating Cube:
        // - If stock has been physically moved into the Cube room, cubeRoomStock > 0.
        // - If stock was received into the central store and is awaiting transfer to Cube, storeStock > 0.
        // For external supplier purchasing, total branch availability prevents false out-of-stock orders.
        const effectiveCubeStock = cubeRoomStock + (isCubeOnly ? storeStock : (cubeRoomStock === 0 ? storeStock : 0));
        const balance = isCubeDept && cubeMap.has(row.item_id) ? effectiveCubeStock : generalBalance;

        // Check if this item has zero transactions and no initial physical count fed in for this branch
        const isUncountedBranchItem =
          row.phy_count === null &&
          row.opening_stock === 0 &&
          row.qty_received === 0 &&
          row.qty_issued === 0 &&
          row.qty_transferred === 0 &&
          row.qty_sold === 0;

        const threshold = Number(row.low_stock_threshold) || 10;

        let status: 'out' | 'low' | 'healthy' = 'healthy';
        if (isUncountedBranchItem) {
          // Uncounted branch item: don't flag as critical out-of-stock until stock sheet or receipt is logged
          status = 'healthy';
        } else if (balance <= 0) {
          status = 'out';
        } else if (balance <= threshold) {
          status = 'low';
        }

        const defaultSuggested = status === 'healthy' ? 0 : Math.max(1, threshold * 2 - Math.max(0, balance));
        const key = validDepts.length > 1 ? `${row.item_id}__${dept}` : row.item_id;
        const suggestedQty =
          customQuantities[key] !== undefined
            ? customQuantities[key]
            : customQuantities[row.item_id] !== undefined
            ? customQuantities[row.item_id]
            : defaultSuggested;

        const displayName =
          validDepts.length > 1 && dept === 'Cube'
            ? `${row.item_name} (Cube)`
            : validDepts.length > 1 && dept === 'Bar'
            ? `${row.item_name} (Bar)`
            : row.item_name;

        itemsList.push({
          item_id: key,
          item_name: displayName,
          category: row.category,
          department: dept,
          unit_of_measure: row.unit_of_measure,
          unit_cost: Number(row.unit_cost) || 0,
          low_stock_threshold: threshold,
          balance,
          storeStock: isCubeDept && storeStock > 0 ? storeStock : undefined,
          suggestedQty,
          status,
        });
      });
    });

    return itemsList;
  }, [stockRows, cubeStockRows, customQuantities, activeDepts]);

  // Filter items based on search, department, and status filters
  const filteredItems = useMemo(() => {
    return allReorderItems.filter((item) => {
      const matchesSearch =
        item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = departmentFilter === 'all' || item.department === departmentFilter;
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'needs_reorder'
          ? item.status === 'out' || item.status === 'low'
          : item.status === statusFilter;

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [allReorderItems, searchTerm, departmentFilter, statusFilter]);

  // Group filtered items by Department
  const groupedByDepartment = useMemo(() => {
    const groups = new Map<string, ReorderItem[]>();

    // Initialise active branch departments in fixed order
    activeDepts.forEach((dept) => groups.set(dept, []));

    filteredItems.forEach((item) => {
      const list = groups.get(item.department) || [];
      list.push(item);
      groups.set(item.department, list);
    });

    // Sort items within each department: Out of stock first, then Low stock, then Healthy, then alphabetically
    const statusWeight: Record<string, number> = { out: 0, low: 1, healthy: 2 };
    return Array.from(groups.entries())
      .filter(([_, items]) => items.length > 0)
      .map(([dept, items]) => {
        const sorted = [...items].sort((a, b) => {
          if (statusWeight[a.status] !== statusWeight[b.status]) {
            return statusWeight[a.status] - statusWeight[b.status];
          }
          return a.item_name.localeCompare(b.item_name);
        });
        return [dept, sorted] as [string, ReorderItem[]];
      });
  }, [filteredItems, activeDepts]);

  // Overall counts
  const kpis = useMemo(() => {
    const out = allReorderItems.filter((it) => it.status === 'out').length;
    const low = allReorderItems.filter((it) => it.status === 'low').length;
    const totalNeedsReorder = out + low;
    return { out, low, totalNeedsReorder, totalCatalog: allReorderItems.length };
  }, [allReorderItems]);

  // Checkbox helpers
  const allFilteredIds = filteredItems.map((it) => it.item_id);
  const allFilteredSelected = allFilteredIds.length > 0 && allFilteredIds.every((id) => selectedIds.has(id));

  const toggleAllFiltered = () => {
    if (allFilteredSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allFilteredIds));
    }
  };

  const selectAllFlagged = () => {
    const flaggedIds = allReorderItems
      .filter((it) => it.status === 'out' || it.status === 'low')
      .map((it) => it.item_id);
    setSelectedIds(new Set(flaggedIds));
  };

  const toggleDepartment = (deptItems: ReorderItem[]) => {
    const deptIds = deptItems.map((it) => it.item_id);
    const allDeptSelected = deptIds.every((id) => selectedIds.has(id));

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allDeptSelected) {
        deptIds.forEach((id) => next.delete(id));
      } else {
        deptIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleDeptCollapse = (dept: string) => {
    setCollapsedDepts((prev) => {
      const next = new Set(prev);
      if (next.has(dept)) next.delete(dept);
      else next.add(dept);
      return next;
    });
  };

  // Selected items sorted for Preview, PDF & CSV export
  const selectedItemsSorted = useMemo(() => {
    const selected = allReorderItems.filter((it) => selectedIds.has(it.item_id));
    const statusWeight: Record<string, number> = { out: 0, low: 1, healthy: 2 };
    return [...selected].sort((a, b) => {
      const dCompare = a.department.localeCompare(b.department);
      if (dCompare !== 0) return dCompare;
      if (statusWeight[a.status] !== statusWeight[b.status]) {
        return statusWeight[a.status] - statusWeight[b.status];
      }
      return a.item_name.localeCompare(b.item_name);
    });
  }, [allReorderItems, selectedIds]);

  // Generate Requisition List PDF (Item and Suggested Quantity ONLY)
  const generateRequisitionList = async () => {
    if (selectedItemsSorted.length === 0) {
      alert('Please select at least one item to include in the Requisition List.');
      return;
    }

    try {
      const { jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF();
      const dateStr = format(new Date(), 'dd MMM yyyy, HH:mm');

      // Title & Header
      doc.setFontSize(20);
      doc.setTextColor(30, 30, 60);
      doc.text('Purchase Requisition List', 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(
        `Generated: ${dateStr}${activeBranch ? ` | Branch: ${activeBranch.name}` : ''}`,
        14,
        28
      );
      doc.text(`Total Items Selected: ${selectedItemsSorted.length}`, 14, 34);

      const tableColumn = ['#', 'Item', 'Order Quantity'];

      const tableRows = selectedItemsSorted.map((item, idx) => [
        String(idx + 1),
        item.item_name,
        `${item.suggestedQty} ${item.unit_of_measure || ''}`.trim(),
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 3.5 },
        headStyles: { fillColor: [79, 70, 229], fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center' },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 50, halign: 'center', fontStyle: 'bold' },
        },
      });

      doc.save(`Requisition_List_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Check console for details.');
    }
  };

  // Export CSV with Item and Suggested Quantity ONLY
  const generateRequisitionCSV = () => {
    if (selectedItemsSorted.length === 0) {
      alert('Please select at least one item to export.');
      return;
    }

    exportToCSV(
      selectedItemsSorted.map((item) => ({
        item: item.item_name,
        suggested_order_quantity: `${item.suggestedQty} ${item.unit_of_measure || ''}`.trim(),
      })),
      `requisition_list_${format(new Date(), 'yyyy-MM-dd_HHmm')}`,
      [
        { key: 'item', header: 'Item' },
        { key: 'suggested_order_quantity', header: 'Suggested Order Quantity' },
      ]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <ClipboardList className="h-7 w-7 text-primary" />
            Requisition Planner
          </h1>
          <p className="text-muted-foreground text-sm">
            Live stock status grouped by department. Adjust quantities and export your Requisition List.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchStock()}
            disabled={isLoading}
            className="gap-1.5"
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={selectAllFlagged}
            className="gap-1.5"
          >
            <CheckSquare className="h-4 w-4 text-amber-500" />
            Select All Flagged ({kpis.totalNeedsReorder})
          </Button>
          <Button
            onClick={() => setIsPreviewOpen(true)}
            disabled={selectedIds.size === 0}
            className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md"
          >
            <Eye className="h-4 w-4" />
            Preview Requisition {selectedIds.size > 0 && `(${selectedIds.size})`}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={generateRequisitionCSV}
            disabled={selectedIds.size === 0}
            className="gap-1.5"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={generateRequisitionList}
            disabled={selectedIds.size === 0}
            className="gap-1.5"
          >
            <Download className="h-4 w-4 text-indigo-600" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card
          className={cn(
            'cursor-pointer transition-all border-l-4 border-l-rose-500',
            statusFilter === 'out' ? 'ring-2 ring-rose-500 bg-rose-500/5' : 'hover:bg-muted/50'
          )}
          onClick={() => setStatusFilter(statusFilter === 'out' ? 'needs_reorder' : 'out')}
        >
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Out of Stock</CardTitle>
            <PackageX className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400">
              {kpis.out}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Critical zero balance</p>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'cursor-pointer transition-all border-l-4 border-l-amber-500',
            statusFilter === 'low' ? 'ring-2 ring-amber-500 bg-amber-500/5' : 'hover:bg-muted/50'
          )}
          onClick={() => setStatusFilter(statusFilter === 'low' ? 'needs_reorder' : 'low')}
        >
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400">
              {kpis.low}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Below reorder threshold</p>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'cursor-pointer transition-all border-l-4 border-l-indigo-500',
            statusFilter === 'needs_reorder' ? 'ring-2 ring-indigo-500 bg-indigo-500/5' : 'hover:bg-muted/50'
          )}
          onClick={() => setStatusFilter('needs_reorder')}
        >
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Needs Attention</CardTitle>
            <PackageCheck className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
              {kpis.totalNeedsReorder}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Out + Low stock items</p>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'cursor-pointer transition-all border-l-4 border-l-slate-400',
            statusFilter === 'all' ? 'ring-2 ring-slate-400 bg-slate-500/5' : 'hover:bg-muted/50'
          )}
          onClick={() => setStatusFilter(statusFilter === 'all' ? 'needs_reorder' : 'all')}
        >
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Catalog Total</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-2xl sm:text-3xl font-extrabold">
              {kpis.totalCatalog}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">All monitored items</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Actions Bar */}
      <Card className="p-3 sm:p-4 shadow-sm">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-[140px] text-xs">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {activeDepts.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={(v: any) => setStatusFilter(v)}
              >
                <SelectTrigger className="w-[140px] text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="needs_reorder">Needs Reorder</SelectItem>
                  <SelectItem value="out">Out of Stock</SelectItem>
                  <SelectItem value="low">Low Stock</SelectItem>
                  <SelectItem value="all">All Items</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0">
            <Badge variant="outline" className="text-xs font-semibold py-1">
              Selected: {selectedIds.size} / {allReorderItems.length}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleAllFiltered}
              className="text-xs gap-1.5"
            >
              {allFilteredSelected ? (
                <>
                  <CheckSquare className="h-4 w-4 text-primary" /> Deselect Visible
                </>
              ) : (
                <>
                  <Square className="h-4 w-4 text-muted-foreground" /> Select Visible ({filteredItems.length})
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Department Grouped View */}
      {isLoading ? (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center justify-center gap-3">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">
              Loading live stock balances...
            </p>
          </div>
        </Card>
      ) : groupedByDepartment.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold">No Items Match Filters</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            {statusFilter === 'needs_reorder'
              ? 'All items in this view are healthy with sufficient stock.'
              : 'Try clearing your search or changing department filters.'}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => {
              setSearchTerm('');
              setDepartmentFilter('all');
              setStatusFilter('all');
            }}
          >
            Clear All Filters
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedByDepartment.map(([dept, items]) => {
            const isCollapsed = collapsedDepts.has(dept);
            const deptOutOfStock = items.filter((i) => i.status === 'out').length;
            const deptLowStock = items.filter((i) => i.status === 'low').length;
            const allDeptSelected = items.length > 0 && items.every((i) => selectedIds.has(i.item_id));

            return (
              <Card key={dept} className="overflow-hidden border-2 shadow-sm">
                <CardHeader className="bg-muted/40 p-4 border-b">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div
                      className="flex items-center gap-2.5 cursor-pointer select-none"
                      onClick={() => toggleDeptCollapse(dept)}
                    >
                      {DEPT_ICONS[dept] || <Building2 className="h-4 w-4" />}
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        {dept} Department
                        <Badge variant="outline" className="text-xs font-normal">
                          {items.length} item{items.length !== 1 ? 's' : ''}
                        </Badge>
                      </CardTitle>
                      {isCollapsed ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      {deptOutOfStock > 0 && (
                        <Badge variant="destructive" className="text-[10px]">
                          {deptOutOfStock} Out of Stock
                        </Badge>
                      )}
                      {deptLowStock > 0 && (
                        <Badge
                          variant="outline"
                          className="text-[10px] border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20"
                        >
                          {deptLowStock} Low Stock
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDepartment(items);
                        }}
                        className="h-7 text-xs gap-1"
                      >
                        {allDeptSelected ? (
                          <>
                            <CheckSquare className="h-3.5 w-3.5 text-primary" /> Deselect Dept
                          </>
                        ) : (
                          <>
                            <Square className="h-3.5 w-3.5 text-muted-foreground" /> Select All in Dept
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {!isCollapsed && (
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/20">
                            <TableHead className="w-12 text-center">Select</TableHead>
                            <TableHead className="font-bold text-xs">Item Name</TableHead>
                            <TableHead className="font-bold text-xs">Category</TableHead>
                            <TableHead className="text-center font-bold text-xs">Stock Status</TableHead>
                            <TableHead className="text-center font-bold text-xs">Current Stock</TableHead>
                            <TableHead className="text-center font-bold text-xs">Threshold</TableHead>
                            <TableHead className="text-center font-bold text-xs">Suggested Order Qty</TableHead>
                            <TableHead className="text-right font-bold text-xs">Unit Cost</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((item) => {
                            const isSelected = selectedIds.has(item.item_id);
                            const isOut = item.status === 'out';
                            const isLow = item.status === 'low';

                            return (
                              <TableRow
                                key={item.item_id}
                                className={cn(
                                  'transition-colors cursor-pointer',
                                  isSelected ? 'bg-primary/5 dark:bg-primary/10' : undefined,
                                  isOut ? 'hover:bg-rose-500/5' : isLow ? 'hover:bg-amber-500/5' : undefined
                                )}
                                onClick={() => toggleOne(item.item_id)}
                              >
                                <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => toggleOne(item.item_id)}
                                  />
                                </TableCell>
                                <TableCell className="font-bold text-sm">
                                  <div className="flex items-center gap-2">
                                    <span>{item.item_name}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {item.category}
                                </TableCell>
                                <TableCell className="text-center">
                                  {isOut ? (
                                    <Badge variant="destructive" className="text-[10px] font-bold">
                                      Out of Stock
                                    </Badge>
                                  ) : isLow ? (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] border-amber-500 text-amber-600 dark:text-amber-400 font-semibold bg-amber-50/50 dark:bg-amber-950/20"
                                    >
                                      Low Stock
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="text-[10px] text-muted-foreground">
                                      In Stock
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-center font-bold text-sm">
                                  <span
                                    className={cn(
                                      isOut
                                        ? 'text-rose-600 dark:text-rose-400'
                                        : isLow
                                        ? 'text-amber-600 dark:text-amber-500'
                                        : 'text-foreground'
                                    )}
                                  >
                                    {item.balance}
                                  </span>{' '}
                                  <span className="text-xs font-normal text-muted-foreground">
                                    {item.unit_of_measure}
                                  </span>
                                  {item.storeStock !== undefined && item.storeStock > 0 && (
                                    <span className="block text-[10px] font-normal text-muted-foreground">
                                      ({item.storeStock} in store)
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-center text-xs text-muted-foreground">
                                  {item.low_stock_threshold} {item.unit_of_measure}
                                </TableCell>
                                <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-center gap-1.5">
                                    <Input
                                      type="number"
                                      min="0"
                                      className="w-20 h-8 text-center font-bold text-sm bg-background border-input focus-visible:ring-1"
                                      value={item.suggestedQty === 0 ? '' : item.suggestedQty}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        const num = val === '' ? 0 : parseInt(val, 10);
                                        setCustomQuantities((prev) => ({
                                          ...prev,
                                          [item.item_id]: isNaN(num) ? 0 : Math.max(0, num),
                                        }));
                                      }}
                                    />
                                    <span className="text-xs text-muted-foreground whitespace-nowrap min-w-[28px] text-left">
                                      {item.unit_of_measure}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right text-xs text-muted-foreground">
                                  {item.unit_cost > 0
                                    ? `₦${Number(item.unit_cost).toLocaleString()}`
                                    : '—'}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Requisition Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Eye className="h-5 w-5 text-primary" />
              Purchase Requisition Preview
            </DialogTitle>
            <DialogDescription>
              Review your selected reorder items and adjust quantities before exporting.
            </DialogDescription>
          </DialogHeader>

          {/* Document Preview Sheet */}
          <div className="flex-1 overflow-y-auto space-y-4 border rounded-lg p-4 bg-muted/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b gap-2">
              <div>
                <h3 className="font-extrabold text-lg tracking-tight">Purchase Requisition List</h3>
                <p className="text-xs text-muted-foreground">
                  Generated: {format(new Date(), 'dd MMM yyyy, HH:mm')}
                  {activeBranch && ` | Branch: ${activeBranch.name}`}
                </p>
              </div>
              <Badge variant="secondary" className="w-fit text-xs font-semibold">
                {selectedItemsSorted.length} item{selectedItemsSorted.length !== 1 ? 's' : ''} selected
              </Badge>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12 text-center font-bold">#</TableHead>
                  <TableHead className="font-bold">Department</TableHead>
                  <TableHead className="font-bold">Item Name</TableHead>
                  <TableHead className="text-center font-bold">Order Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedItemsSorted.map((item, idx) => (
                  <TableRow key={item.item_id}>
                    <TableCell className="text-center font-medium text-xs text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="text-xs font-semibold">
                      <Badge variant="outline" className="text-[11px] font-normal">
                        {item.department}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold text-sm">
                      {item.item_name}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Input
                          type="number"
                          min="0"
                          className="w-24 h-8 text-center font-bold text-sm bg-background border-input focus-visible:ring-1"
                          value={item.suggestedQty === 0 ? '' : item.suggestedQty}
                          onChange={(e) => {
                            const val = e.target.value;
                            const num = val === '' ? 0 : parseInt(val, 10);
                            setCustomQuantities((prev) => ({
                              ...prev,
                              [item.item_id]: isNaN(num) ? 0 : Math.max(0, num),
                            }));
                          }}
                        />
                        <span className="text-xs text-muted-foreground min-w-[28px] text-left">
                          {item.unit_of_measure}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t">
            <Button variant="outline" size="sm" onClick={() => setIsPreviewOpen(false)}>
              Close Preview
            </Button>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  generateRequisitionCSV();
                }}
                className="gap-1.5 flex-1 sm:flex-none"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                Export CSV
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  generateRequisitionList();
                }}
                className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white flex-1 sm:flex-none"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
