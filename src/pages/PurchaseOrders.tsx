import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { useBranch } from '@/contexts/BranchContext';
import { useDailyStockCount, useCubeStockCount } from '@/hooks/useDailyStockCount';
import { exportToCSV } from '@/lib/export';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  suggestedQty: number;
  status: 'out' | 'low' | 'healthy';
}

const DEPARTMENTS = ['Retail', 'Bar', 'Kitchen', 'Housekeeping', 'Cube'] as const;

const DEPT_ICONS: Record<string, React.ReactNode> = {
  Retail: <ShoppingBag className="h-4 w-4 text-blue-500" />,
  Bar: <Wine className="h-4 w-4 text-purple-500" />,
  Kitchen: <Utensils className="h-4 w-4 text-amber-500" />,
  Housekeeping: <Sparkles className="h-4 w-4 text-emerald-500" />,
  Cube: <Box className="h-4 w-4 text-indigo-500" />,
};

export default function PurchaseOrders() {
  const { session } = useAuth();
  const { canManageReorders } = useRole(session);
  const { activeBranch } = useBranch();

  const todayStr = format(new Date(), 'yyyy-MM-dd');

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
              The Requisition Planner is restricted to Manager roles.
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

    return stockRows.map((row) => {
      const isCube = row.department === 'Cube' || (row.departments && row.departments.includes('Cube'));
      const generalBalance =
        row.opening_stock + row.qty_received - row.qty_issued - row.qty_transferred - row.qty_sold - row.damages;
      const balance = isCube && cubeMap.has(row.item_id) ? cubeMap.get(row.item_id)! : generalBalance;

      let status: 'out' | 'low' | 'healthy' = 'healthy';
      if (balance <= 0) {
        status = 'out';
      } else if (balance <= row.low_stock_threshold) {
        status = 'low';
      }

      const threshold = Number(row.low_stock_threshold) || 10;
      // Default suggested quantity: bring stock up to double the low stock threshold
      const defaultSuggested = Math.max(1, threshold * 2 - Math.max(0, balance));
      const suggestedQty =
        customQuantities[row.item_id] !== undefined
          ? customQuantities[row.item_id]
          : defaultSuggested;

      const primaryDept = row.department || (row.departments && row.departments[0]) || 'Retail';

      return {
        item_id: row.item_id,
        item_name: row.item_name,
        category: row.category,
        department: primaryDept,
        unit_of_measure: row.unit_of_measure,
        unit_cost: Number(row.unit_cost) || 0,
        low_stock_threshold: threshold,
        balance,
        suggestedQty,
        status,
      };
    });
  }, [stockRows, cubeStockRows, customQuantities]);

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

    // Initialise standard departments in fixed order
    DEPARTMENTS.forEach((dept) => groups.set(dept, []));

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
  }, [filteredItems]);

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

  // Generate Requisition List PDF (Item and Suggested Quantity ONLY)
  const generateRequisitionList = async () => {
    const selected = allReorderItems.filter((it) => selectedIds.has(it.item_id));

    if (selected.length === 0) {
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
      doc.text(`Total Items Selected: ${selected.length}`, 14, 34);

      // Sort selected items by Department then Status (out first) then Name
      const statusWeight: Record<string, number> = { out: 0, low: 1, healthy: 2 };
      const sortedSelected = [...selected].sort((a, b) => {
        const dCompare = a.department.localeCompare(b.department);
        if (dCompare !== 0) return dCompare;
        if (statusWeight[a.status] !== statusWeight[b.status]) {
          return statusWeight[a.status] - statusWeight[b.status];
        }
        return a.item_name.localeCompare(b.item_name);
      });

      const tableColumn = ['#', 'Item', 'Order Quantity'];

      const tableRows = sortedSelected.map((item, idx) => [
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
    const selected = allReorderItems.filter((it) => selectedIds.has(it.item_id));
    if (selected.length === 0) {
      alert('Please select at least one item to export.');
      return;
    }
    const statusWeight: Record<string, number> = { out: 0, low: 1, healthy: 2 };
    const sortedSelected = [...selected].sort((a, b) => {
      const dCompare = a.department.localeCompare(b.department);
      if (dCompare !== 0) return dCompare;
      if (statusWeight[a.status] !== statusWeight[b.status]) {
        return statusWeight[a.status] - statusWeight[b.status];
      }
      return a.item_name.localeCompare(b.item_name);
    });

    exportToCSV(
      sortedSelected.map((item) => ({
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
            variant="outline"
            size="sm"
            onClick={generateRequisitionCSV}
            disabled={selectedIds.size === 0}
            className="gap-1.5"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            Export CSV {selectedIds.size > 0 && `(${selectedIds.size})`}
          </Button>
          <Button
            onClick={generateRequisitionList}
            disabled={selectedIds.size === 0}
            className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md"
          >
            <Download className="h-4 w-4" />
            Export PDF {selectedIds.size > 0 && `(${selectedIds.size})`}
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
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-500">
              {kpis.low}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">At or below threshold</p>
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
            <CardTitle className="text-xs sm:text-sm font-medium">Total Attention</CardTitle>
            <PackageCheck className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
              {kpis.totalNeedsReorder}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Needs purchasing</p>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'cursor-pointer transition-all border-l-4 border-l-blue-400',
            statusFilter === 'all' ? 'ring-2 ring-blue-400 bg-blue-500/5' : 'hover:bg-muted/50'
          )}
          onClick={() => setStatusFilter(statusFilter === 'all' ? 'needs_reorder' : 'all')}
        >
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Catalog Items</CardTitle>
            <Building2 className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-2xl sm:text-3xl font-extrabold">{kpis.totalCatalog}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Click to view all'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Controls Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-1 items-center gap-2 flex-wrap">
              <div className="relative w-full sm:w-[220px]">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search item or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-9 text-xs sm:text-sm"
                />
              </div>

              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-full sm:w-[170px] h-9 text-xs">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d} Department
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                <SelectTrigger className="w-full sm:w-[170px] h-9 text-xs">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="needs_reorder">Needs Reorder (Out & Low)</SelectItem>
                  <SelectItem value="out">Out of Stock Only</SelectItem>
                  <SelectItem value="low">Low Stock Only</SelectItem>
                  <SelectItem value="all">All Catalog Items</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 justify-between sm:justify-end">
              <span className="text-xs text-muted-foreground">
                {selectedIds.size} of {filteredItems.length} selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleAllFiltered}
                className="text-xs h-8"
              >
                {allFilteredSelected ? 'Deselect All' : 'Select All Shown'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Department Sections */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm">Calculating live departmental stock balances...</p>
        </div>
      ) : groupedByDepartment.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground space-y-3">
            <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500 opacity-60" />
            <h3 className="text-base font-semibold text-foreground">No Items Need Attention</h3>
            <p className="text-xs max-w-md mx-auto">
              {statusFilter === 'needs_reorder'
                ? 'All items in the selected department(s) are above their minimum low-stock thresholds.'
                : 'No items match your current filter criteria.'}
            </p>
            {statusFilter !== 'all' && (
              <Button variant="outline" size="sm" onClick={() => setStatusFilter('all')}>
                View All Catalog Items
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedByDepartment.map(([dept, items]) => {
            const isCollapsed = collapsedDepts.has(dept);
            const deptOutOfStock = items.filter((i) => i.status === 'out').length;
            const deptLowStock = items.filter((i) => i.status === 'low').length;
            const allDeptSelected = items.length > 0 && items.every((i) => selectedIds.has(i.item_id));
            const someDeptSelected = items.some((i) => selectedIds.has(i.item_id));

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

                    <div className="flex items-center gap-2 flex-wrap">
                      {deptOutOfStock > 0 && (
                        <Badge variant="destructive" className="text-[11px]">
                          {deptOutOfStock} Out of Stock
                        </Badge>
                      )}
                      {deptLowStock > 0 && (
                        <Badge variant="outline" className="text-[11px] border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20">
                          {deptLowStock} Low Stock
                        </Badge>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDepartment(items);
                        }}
                        className="text-xs h-7 gap-1"
                      >
                        {allDeptSelected ? (
                          <>
                            <Square className="h-3 w-3" /> Deselect Dept
                          </>
                        ) : (
                          <>
                            <CheckSquare className="h-3 w-3" /> Select All in Dept
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
                          <TableRow className="bg-muted/10">
                            <TableHead className="w-10 text-center">
                              <Checkbox
                                checked={allDeptSelected}
                                ref={(el) => {
                                  if (el)
                                    (el as HTMLButtonElement & { indeterminate?: boolean }).indeterminate =
                                      someDeptSelected && !allDeptSelected;
                                }}
                                onCheckedChange={() => toggleDepartment(items)}
                              />
                            </TableHead>
                            <TableHead>Item &amp; Category</TableHead>
                            <TableHead className="text-center">Stock Status</TableHead>
                            <TableHead className="text-center">Current Balance</TableHead>
                            <TableHead className="text-center">Low Alert Threshold</TableHead>
                            <TableHead className="text-center">Suggested Order Qty</TableHead>
                            <TableHead className="text-right">Est. Unit Cost</TableHead>
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
                                  'cursor-pointer transition-colors',
                                  isSelected
                                    ? 'bg-primary/5 dark:bg-primary/10'
                                    : 'hover:bg-muted/40',
                                  isOut
                                    ? 'border-l-4 border-l-rose-500'
                                    : isLow
                                    ? 'border-l-4 border-l-amber-500'
                                    : 'border-l-4 border-l-transparent'
                                )}
                                onClick={() => toggleOne(item.item_id)}
                              >
                                <TableCell className="w-10 text-center" onClick={(e) => e.stopPropagation()}>
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => toggleOne(item.item_id)}
                                  />
                                </TableCell>
                                <TableCell>
                                  <div className="font-semibold text-sm">{item.item_name}</div>
                                  <div className="text-xs text-muted-foreground">{item.category}</div>
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
    </div>
  );
}
