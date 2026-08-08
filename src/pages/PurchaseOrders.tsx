import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { usePredictiveReordering, PurchaseOrder } from '@/hooks/usePredictiveReordering';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Sparkles,
  ClipboardList,
  AlertTriangle,
  PackageX,
  RefreshCw,
  ShieldAlert,
  Building2,
  Download,
  Trash2,
  TrendingDown,
} from 'lucide-react';
import { format } from 'date-fns';

export default function PurchaseOrders() {
  const { session } = useAuth();
  const { canManageReorders } = useRole(session);
  const {
    purchaseOrders,
    isLoading,
    runAnalysis,
    isAnalyzing,
    clearList,
    isClearing,
  } = usePredictiveReordering();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  // Categorise items
  const outOfStock = purchaseOrders.filter(
    (po) => po.days_to_stockout !== null && po.days_to_stockout <= 0
  );
  const lowStock = purchaseOrders.filter(
    (po) => po.days_to_stockout !== null && po.days_to_stockout > 0 && po.days_to_stockout <= 7
  );
  const watchList = purchaseOrders.filter(
    (po) => po.days_to_stockout === null || po.days_to_stockout > 7
  );

  // Checkbox helpers
  const allIds = purchaseOrders.map((po) => po.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id));
  const someSelected = allIds.some((id) => selectedIds.has(id));

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allIds));
    }
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

  const handleClear = () => {
    if (confirm('Clear the entire requisition list? This cannot be undone. Run analysis again to regenerate.')) {
      clearList();
      setSelectedIds(new Set());
    }
  };

  const generateRequisitionList = async () => {
    const selected = purchaseOrders.filter((po) => selectedIds.has(po.id));

    if (selected.length === 0) {
      alert('Please select at least one item to include in the Requisition List.');
      return;
    }

    try {
      const { jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF();
      const dateStr = format(new Date(), 'dd MMM yyyy, HH:mm');

      // Header
      doc.setFontSize(20);
      doc.setTextColor(30, 30, 60);
      doc.text('Requisition List', 14, 22);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated: ${dateStr}`, 14, 30);
      doc.text(`Total Items: ${selected.length}`, 14, 36);

      const tableColumn = ['Item', 'Category', 'Dept', 'Est. Days Left', 'Suggested Qty', 'Supplier'];

      const tableRows = selected.map((po) => [
        po.items?.name || 'Unknown Item',
        po.items?.category || '',
        po.department || 'Retail',
        po.days_to_stockout !== null && po.days_to_stockout <= 0
          ? 'OUT OF STOCK'
          : po.days_to_stockout !== null
          ? `${po.days_to_stockout} days`
          : '—',
        `${po.suggested_quantity} ${po.items?.unit_of_measure || ''}`.trim(),
        po.supplier || '—',
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 44,
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [79, 70, 229] },
        didParseCell: (data) => {
          // Highlight out-of-stock rows
          if (data.section === 'body' && data.row.raw[3] === 'OUT OF STOCK') {
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = 'bold';
          }
        },
      });

      doc.save(`Requisition_List_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Check console for details.');
    }
  };

  const renderSection = (title: string, items: PurchaseOrder[], badgeVariant: 'destructive' | 'outline' | 'secondary', icon: React.ReactNode) => {
    if (items.length === 0) return null;

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          {icon}
          <span className="text-sm font-semibold">{title}</span>
          <Badge variant={badgeVariant} className="text-[11px]">{items.length}</Badge>
        </div>
        {items.map((po) => {
          const isCritical = po.days_to_stockout !== null && po.days_to_stockout <= 0;
          const isLow = po.days_to_stockout !== null && po.days_to_stockout > 0 && po.days_to_stockout <= 7;

          return (
            <TableRow
              key={po.id}
              className={`cursor-pointer transition-colors ${
                selectedIds.has(po.id) ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-muted/50'
              } ${isCritical ? 'border-l-4 border-l-rose-500' : isLow ? 'border-l-4 border-l-amber-500' : ''}`}
              onClick={() => toggleOne(po.id)}
            >
              <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedIds.has(po.id)}
                  onCheckedChange={() => toggleOne(po.id)}
                />
              </TableCell>
              <TableCell>
                <div className="font-medium text-sm">{po.items?.name || 'Item'}</div>
                <div className="text-xs text-muted-foreground">{po.items?.category}</div>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {po.department || 'Retail'}
                </span>
              </TableCell>
              <TableCell className="text-center">
                {isCritical ? (
                  <Badge variant="destructive" className="text-[10px]">Out of Stock</Badge>
                ) : isLow ? (
                  <Badge variant="outline" className="text-[10px] border-amber-500 text-amber-600 dark:text-amber-400">
                    {po.days_to_stockout} days left
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px]">
                    {po.days_to_stockout !== null ? `${po.days_to_stockout} days` : 'Watch'}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-center text-sm font-semibold">
                {po.suggested_quantity}{' '}
                <span className="text-xs font-normal text-muted-foreground">
                  {po.items?.unit_of_measure}
                </span>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {po.supplier || '—'}
              </TableCell>
            </TableRow>
          );
        })}
      </div>
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
            Low &amp; out-of-stock alerts based on sales velocity. Select items and generate a Requisition List PDF.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={handleClear}
            disabled={isClearing || purchaseOrders.length === 0}
            className="gap-2 text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60 hover:bg-destructive/5"
          >
            {isClearing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Clear List
          </Button>
          <Button
            variant="outline"
            onClick={() => generateRequisitionList()}
            disabled={selectedIds.size === 0}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Requisition List {selectedIds.size > 0 && `(${selectedIds.size})`}
          </Button>
          <Button
            onClick={() => runAnalysis(30)}
            disabled={isAnalyzing}
            className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md"
          >
            {isAnalyzing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Run Analysis
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-rose-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <PackageX className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{outOfStock.length}</div>
            <p className="text-xs text-muted-foreground">Requires immediate reorder</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low Stock (≤ 7 Days)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{lowStock.length}</div>
            <p className="text-xs text-muted-foreground">Running low based on velocity</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-400">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">On Watch</CardTitle>
            <TrendingDown className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{watchList.length}</div>
            <p className="text-xs text-muted-foreground">Flagged for monitoring</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-semibold">Flagged Items</CardTitle>
              <CardDescription>
                {purchaseOrders.length === 0
                  ? 'Run Analysis to detect low and out-of-stock items.'
                  : `${purchaseOrders.length} item${purchaseOrders.length !== 1 ? 's' : ''} flagged — ${selectedIds.size} selected for requisition.`}
              </CardDescription>
            </div>
            {purchaseOrders.length > 0 && (
              <Button variant="ghost" size="sm" onClick={toggleAll} className="text-xs self-start sm:self-center">
                {allSelected ? 'Deselect All' : 'Select All'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : purchaseOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground space-y-3">
              <ClipboardList className="h-10 w-10 mx-auto opacity-40" />
              <p className="text-sm">No items flagged yet.</p>
              <Button variant="outline" size="sm" onClick={() => runAnalysis(30)} disabled={isAnalyzing}>
                <Sparkles className="h-4 w-4 mr-2" />
                Run Analysis Now
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allSelected}
                        ref={(el) => {
                          if (el) (el as HTMLButtonElement & { indeterminate?: boolean }).indeterminate = someSelected && !allSelected;
                        }}
                        onCheckedChange={toggleAll}
                      />
                    </TableHead>
                    <TableHead>Item &amp; Category</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-center">Stock Status</TableHead>
                    <TableHead className="text-center">Suggested Qty</TableHead>
                    <TableHead>Supplier</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {renderSection(
                    'Out of Stock',
                    outOfStock,
                    'destructive',
                    <PackageX className="h-4 w-4 text-rose-500" />
                  )}
                  {renderSection(
                    'Low Stock',
                    lowStock,
                    'outline',
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                  {renderSection(
                    'On Watch',
                    watchList,
                    'secondary',
                    <TrendingDown className="h-4 w-4 text-blue-400" />
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
