import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { usePredictiveReordering, PurchaseOrder, PurchaseOrderStatus } from '@/hooks/usePredictiveReordering';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Sparkles,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  PackageCheck,
  XCircle,
  RefreshCw,
  ShieldAlert,
  Clock,
  Building2,
  Download,
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
    updatePO,
    markAsReceived,
    isFulfilling,
  } = usePredictiveReordering();

  const [selectedTab, setSelectedTab] = useState<string>('all');
  const [editingQuantities, setEditingQuantities] = useState<Record<string, number>>({});
  const [editingSuppliers, setEditingSuppliers] = useState<Record<string, string>>({});

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
              Predictive Automated Reordering and Purchase Order approvals are restricted to Manager roles.
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

  // Filter purchase orders based on active tab
  const filteredOrders = purchaseOrders.filter((po) => {
    if (selectedTab === 'drafts') return po.status === 'draft';
    if (selectedTab === 'active') return po.status === 'approved' || po.status === 'ordered';
    if (selectedTab === 'received') return po.status === 'received';
    if (selectedTab === 'cancelled') return po.status === 'cancelled';
    return true;
  });

  // KPI Calculations
  const draftCount = purchaseOrders.filter((po) => po.status === 'draft').length;
  const criticalCount = purchaseOrders.filter(
    (po) => po.days_to_stockout !== null && po.days_to_stockout <= 3 && po.status !== 'received'
  ).length;
  const totalValue = purchaseOrders
    .filter((po) => po.status === 'draft' || po.status === 'approved' || po.status === 'ordered')
    .reduce((sum, po) => {
      const qty = po.ordered_quantity ?? po.suggested_quantity;
      return sum + qty * Number(po.unit_cost || 0);
    }, 0);

  const handleQtyChange = (id: string, value: string) => {
    const num = parseFloat(value);
    setEditingQuantities((prev) => ({
      ...prev,
      [id]: isNaN(num) ? 0 : num,
    }));
  };

  const handleSupplierChange = (id: string, value: string) => {
    setEditingSuppliers((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSavePO = (po: PurchaseOrder, newStatus?: PurchaseOrderStatus) => {
    const updatedQty = editingQuantities[po.id] ?? po.ordered_quantity ?? po.suggested_quantity;
    const updatedSupplier = editingSuppliers[po.id] ?? po.supplier ?? '';

    updatePO({
      id: po.id,
      updates: {
        ordered_quantity: updatedQty,
        supplier: updatedSupplier,
        ...(newStatus ? { status: newStatus } : {}),
      },
    });
  };

  const generateRequisitionList = () => {
    const approvedOrders = purchaseOrders.filter(po => po.status === 'approved');
    
    if (approvedOrders.length === 0) {
      alert("No approved purchase orders found to generate a requisition list.");
      return;
    }

    const doc = new jsPDF();
    const dateStr = format(new Date(), 'yyyy-MM-dd HH:mm');
    
    doc.setFontSize(18);
    doc.text('Requisition List', 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated: ${dateStr}`, 14, 30);
    doc.text(`Total Items: ${approvedOrders.length}`, 14, 36);

    const tableColumn = [
      "Item Name", 
      "Category", 
      "Dept",
      "Qty", 
      "Supplier", 
      "Unit Cost", 
      "Total Cost"
    ];
    
    const tableRows = approvedOrders.map(po => {
      const qty = po.ordered_quantity ?? po.suggested_quantity;
      const totalCost = qty * (po.unit_cost || 0);
      return [
        po.items?.name || 'Unknown Item',
        po.items?.category || '',
        po.department || 'Retail',
        `${qty} ${po.items?.unit_of_measure || ''}`.trim(),
        po.supplier || 'Auto-Reorder Vendor',
        `N${po.unit_cost || 0}`,
        `N${totalCost}`
      ];
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [79, 70, 229] } // Indigo-600 matching UI theme
    });

    doc.save(`Requisition_List_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header Title & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-7 w-7 text-primary" />
            Predictive Automated Reordering
          </h1>
          <p className="text-muted-foreground text-sm">
            AI-assisted demand forecasting, velocity tracking, and automated Purchase Orders.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={generateRequisitionList}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Requisition List
          </Button>
          <Button
            onClick={() => runAnalysis(30)}
            disabled={isAnalyzing}
            className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md"
          >
            {isAnalyzing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Run Predictive Analysis
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Draft POs</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{draftCount}</div>
            <p className="text-xs text-muted-foreground">Draft orders awaiting manager review</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Critical Stockouts (&le; 3 Days)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{criticalCount}</div>
            <p className="text-xs text-muted-foreground">High priority stockout warnings</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Estimated Pipeline Value</CardTitle>
            <span className="font-bold text-emerald-500 text-base leading-none">₦</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Active & draft PO capital commitment</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs & Orders Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold">Purchase Orders</CardTitle>
              <CardDescription>Review velocity predictions, edit quantities, and fulfill orders.</CardDescription>
            </div>
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full sm:w-auto">
              <TabsList className="grid grid-cols-5 w-full sm:w-auto text-xs">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="drafts">Drafts ({draftCount})</TabsTrigger>
                <TabsTrigger value="active">Approved</TabsTrigger>
                <TabsTrigger value="received">Received</TabsTrigger>
                <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground space-y-3">
              <ShoppingCart className="h-10 w-10 mx-auto opacity-40" />
              <p>No purchase orders found matching this filter.</p>
              <Button variant="outline" size="sm" onClick={() => runAnalysis(30)} disabled={isAnalyzing}>
                <Sparkles className="h-4 w-4 mr-2" /> Run Analysis Now
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item &amp; Category</TableHead>
                    <TableHead>Dept</TableHead>
                    <TableHead className="text-center">Velocity / Stockout</TableHead>
                    <TableHead className="text-center">Suggested Qty</TableHead>
                    <TableHead className="w-[120px]">Order Qty</TableHead>
                    <TableHead className="w-[180px]">Supplier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((po) => {
                    const currentQty = editingQuantities[po.id] ?? po.ordered_quantity ?? po.suggested_quantity;
                    const currentSupplier = editingSuppliers[po.id] ?? po.supplier ?? '';
                    const isCritical = po.days_to_stockout !== null && po.days_to_stockout <= 3;
                    const isWarning = po.days_to_stockout !== null && po.days_to_stockout > 3 && po.days_to_stockout <= 7;

                    return (
                      <TableRow key={po.id} className="hover:bg-muted/50">
                        {/* Item Name */}
                        <TableCell>
                          <div className="font-medium text-sm">{po.items?.name || 'Item'}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <span>{po.items?.category || 'General'}</span>
                            {po.items?.unit_of_measure && <span>({po.items.unit_of_measure})</span>}
                          </div>
                        </TableCell>

                        {/* Dept */}
                        <TableCell className="text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {po.department || 'Retail'}
                          </span>
                        </TableCell>

                        {/* Velocity & Days to Stockout */}
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xs font-semibold flex items-center gap-1">
                              <TrendingUp className="h-3 w-3 text-blue-500" />
                              {po.daily_velocity || 0}/day
                            </span>
                            {po.days_to_stockout !== null && (
                              <Badge
                                variant={isCritical ? 'destructive' : isWarning ? 'outline' : 'secondary'}
                                className={`text-[10px] ${
                                  isWarning ? 'border-amber-500 text-amber-600 dark:text-amber-400' : ''
                                }`}
                              >
                                {po.days_to_stockout <= 0
                                  ? 'Out of stock'
                                  : `${po.days_to_stockout} days left`}
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        {/* Suggested Qty */}
                        <TableCell className="text-center text-sm font-semibold">
                          {po.suggested_quantity}
                        </TableCell>

                        {/* Editable Order Qty */}
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={currentQty}
                            disabled={po.status === 'received' || po.status === 'cancelled'}
                            onChange={(e) => handleQtyChange(po.id, e.target.value)}
                            className="h-8 text-xs font-medium w-full text-center"
                          />
                        </TableCell>

                        {/* Editable Supplier */}
                        <TableCell>
                          <Input
                            type="text"
                            placeholder="Supplier name"
                            value={currentSupplier}
                            disabled={po.status === 'received' || po.status === 'cancelled'}
                            onChange={(e) => handleSupplierChange(po.id, e.target.value)}
                            className="h-8 text-xs w-full"
                          />
                        </TableCell>

                        {/* Status Badge */}
                        <TableCell>
                          {po.status === 'draft' && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300">
                              Draft
                            </Badge>
                          )}
                          {po.status === 'approved' && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300">
                              Approved
                            </Badge>
                          )}
                          {po.status === 'ordered' && (
                            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300">
                              Ordered
                            </Badge>
                          )}
                          {po.status === 'received' && (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1 w-fit">
                              <CheckCircle2 className="h-3 w-3" /> Received
                            </Badge>
                          )}
                          {po.status === 'cancelled' && (
                            <Badge variant="secondary" className="text-muted-foreground">
                              Cancelled
                            </Badge>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right space-x-1">
                          {po.status === 'draft' && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => handleSavePO(po, 'approved')}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs text-destructive hover:bg-destructive/10"
                                onClick={() => handleSavePO(po, 'cancelled')}
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}

                          {(po.status === 'approved' || po.status === 'ordered') && (
                            <Button
                              size="sm"
                              variant="default"
                              disabled={isFulfilling}
                              className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1"
                              onClick={() => {
                                handleSavePO(po);
                                markAsReceived(po);
                              }}
                            >
                              <PackageCheck className="h-3.5 w-3.5" /> Receive Stock
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
