import { useState, useCallback } from 'react';
import { format } from 'date-fns';
import { useItems } from '@/hooks/useItems';
import { useReachSalesReports, useUploadReachSales, useReachSalesReportDetails, useDeleteReachSalesReport, ReachSalesReport } from '@/hooks/useReachSales';
import { parsePdfSalesReport } from '@/lib/parsePdf';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  CalendarIcon, Upload, FileSpreadsheet, FileScan,
  CheckCircle2, ShoppingBag, Plus, Trash2, Loader2, FileText,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ParsedSaleRow {
  itemId: string;
  itemName: string;
  qtySold: number;
  unitPrice: number;
}

type FileStatus = 'idle' | 'parsing' | 'done' | 'error';

export default function ItemSalesReport() {
  const [reportDate, setReportDate] = useState<Date>(new Date());
  const dateStr = format(reportDate, 'yyyy-MM-dd');
  const [retailMember, setRetailMember] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedSaleRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [fileStatus, setFileStatus] = useState<FileStatus>('idle');
  const [unmatchedCount, setUnmatchedCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const { data: items } = useItems();
  const { data: reportsHistory, isLoading: isLoadingHistory } = useReachSalesReports();
  const uploadSales = useUploadReachSales();
  
  const [selectedReport, setSelectedReport] = useState<ReachSalesReport | null>(null);
  const deleteReport = useDeleteReachSalesReport();
  const { data: reportDetails, isLoading: isLoadingDetails } = useReachSalesReportDetails(selectedReport?.id || null);

  /** Match a raw name from PDF/CSV against the catalog */
  const matchToCatalog = useCallback((rawName: string): { id: string; name: string; unit_cost: number } | null => {
    if (!items) return null;
    const lower = rawName.toLowerCase().trim();
    return (
      items.find(it => it.name.toLowerCase() === lower) ||
      items.find(it => lower.includes(it.name.toLowerCase())) ||
      items.find(it => it.name.toLowerCase().includes(lower)) ||
      null
    );
  }, [items]);

  /** Parse a CSV/TXT file */
  const parseCsv = useCallback((text: string): ParsedSaleRow[] => {
    const lines = text.split(/\r\n|\n/).filter(l => l.trim().length > 0);
    if (lines.length < 2) throw new Error('File must have headers and at least one row');

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
    const nameIdx = headers.findIndex(h => h.includes('item') || h.includes('product') || h.includes('name'));
    const qtyIdx = headers.findIndex(h => h.includes('qty') || h.includes('quantity') || h.includes('sold'));
    const priceIdx = headers.findIndex(h => h.includes('price') || h.includes('amount') || h.includes('total'));

    const newRows: ParsedSaleRow[] = [];
    let unmatched = 0;

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      if (cols.length <= 1) continue;

      const rawName = cols[nameIdx >= 0 ? nameIdx : 0] || '';
      const qty = Number(cols[qtyIdx >= 0 ? qtyIdx : 1]) || 0;
      const price = Number(cols[priceIdx >= 0 ? priceIdx : 2]) || 0;

      if (!rawName || qty <= 0) continue;

      const matched = matchToCatalog(rawName);
      if (matched) {
        newRows.push({
          itemId: matched.id,
          itemName: matched.name,
          qtySold: qty,
          unitPrice: price || matched.unit_cost,
        });
      } else {
        unmatched++;
      }
    }

    setUnmatchedCount(unmatched);
    return newRows;
  }, [matchToCatalog]);

  /** Core file processor — handles PDF, CSV, TXT */
  const processFile = useCallback(async (file: File) => {
    setFileName(file.name);
    setFileStatus('parsing');
    setParsedRows([]);
    setUnmatchedCount(0);

    try {
      let newRows: ParsedSaleRow[] = [];

      if (file.name.toLowerCase().endsWith('.pdf')) {
        // --- PDF path: use pdfjs-dist in-browser parser for Reach reports ---
        const pdfResult = await parsePdfSalesReport(file);
        
        // Auto-fill header fields if extracted
        if (pdfResult.retailMember) {
          setRetailMember(pdfResult.retailMember);
        }
        if (pdfResult.reportDate) {
          try {
            setReportDate(new Date(pdfResult.reportDate));
          } catch {
            // Keep default date
          }
        }

        let unmatched = 0;
        newRows = pdfResult.rows.map(row => {
          const matched = matchToCatalog(row.item_name);
          if (matched) {
            return {
              itemId: matched.id,
              itemName: matched.name,
              qtySold: row.quantity,
              unitPrice: row.unit_price || matched.unit_cost,
            };
          } else {
            unmatched++;
            return {
              itemId: items?.[0]?.id || '',
              itemName: row.item_name, // Raw name from PDF as hint
              qtySold: row.quantity,
              unitPrice: row.unit_price || 0,
            };
          }
        });

        setUnmatchedCount(unmatched);
      } else {
        // --- CSV / TXT path ---
        const text = await file.text();
        newRows = parseCsv(text);
      }

      setFileStatus('done');
      setParsedRows(newRows);

      toast({
        title: 'File Parsed',
        description: `Loaded ${newRows.length} item row${newRows.length !== 1 ? 's' : ''} from ${file.name}`,
      });
    } catch (err: unknown) {
      setFileStatus('error');
      toast({ title: 'Parse Error', description: err instanceof Error ? err.message : 'Failed to parse file', variant: 'destructive' });
    }
  }, [items, matchToCatalog, parseCsv]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';           // allow re-uploading same file
  };

  // Drag-and-drop
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleAddManualRow = () => {
    if (!items || items.length === 0) {
      toast({
        title: 'No Catalog Items Found',
        description: 'Please add items in the Items Manager first before adding manual sales rows.',
        variant: 'destructive',
      });
      return;
    }
    const first = items[0];
    setParsedRows(prev => [
      ...prev,
      { itemId: first.id, itemName: first.name, qtySold: 1, unitPrice: first.unit_cost },
    ]);
    toast({ title: 'Manual Row Added', description: `Added ${first.name} to sales entry table.` });
  };

  const handleRowChange = (index: number, field: keyof ParsedSaleRow, value: string | number) => {
    setParsedRows(prev => {
      const next = [...prev];
      if (field === 'itemId') {
        const item = items?.find(it => it.id === value);
        next[index] = { ...next[index], itemId: value as string, itemName: item?.name || '', unitPrice: item?.unit_cost ?? next[index].unitPrice };
      } else {
        next[index] = { ...next[index], [field]: value };
      }
      return next;
    });
  };

  const handleRemoveRow = (index: number) => setParsedRows(prev => prev.filter((_, i) => i !== index));

  const handleSubmitReport = async () => {
    if (!retailMember.trim()) {
      toast({ title: 'Validation Error', description: 'Please enter the retail member name', variant: 'destructive' });
      return;
    }
    if (parsedRows.length === 0) {
      toast({ title: 'Validation Error', description: 'Please add at least one item sale', variant: 'destructive' });
      return;
    }

    await uploadSales.mutateAsync({
      report_date: dateStr,
      retail_member_name: retailMember.trim(),
      file_name: fileName || 'Reach_Sales_Upload',
      items: parsedRows.map(r => ({
        item_id: r.itemId,
        qty_sold: r.qtySold,
        unit_price: r.unitPrice,
        department: 'Retail',
      })),
    });

    setParsedRows([]);
    setFileName('');
    setFileStatus('idle');
    setUnmatchedCount(0);
  };

  const totalValue = parsedRows.reduce((s, r) => s + (Number(r.qtySold) || 0) * (Number(r.unitPrice) || 0), 0);
  const totalQty = parsedRows.reduce((s, r) => s + (Number(r.qtySold) || 0), 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Reach Item Sales Report</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Upload daily Reach POS exports — CSV, Excel, or PDF auto-parsed instantly
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upload & Form Section */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Daily Sales Entry</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Drop any file — PDF, CSV, or Excel — and the app parses it automatically</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Report Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal h-11 sm:h-9 text-base sm:text-xs">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(reportDate, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={reportDate} onSelect={d => d && setReportDate(d)} />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Retail Member Name</Label>
                <Input
                  placeholder="e.g. John Doe"
                  value={retailMember}
                  onChange={e => setRetailMember(e.target.value)}
                  className="h-11 sm:h-9 text-base sm:text-xs"
                />
              </div>
            </div>

            {/* File Dropzone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                'border-2 border-dashed rounded-lg p-6 sm:p-8 text-center transition-all cursor-pointer min-h-[140px] flex items-center justify-center',
                isDragging
                  ? 'border-primary bg-primary/5 scale-[1.01]'
                  : fileStatus === 'done'
                  ? 'border-green-500 bg-green-500/5'
                  : fileStatus === 'error'
                  ? 'border-destructive bg-destructive/5'
                  : 'hover:bg-muted/50 hover:border-primary/50'
              )}
            >
              <input
                type="file"
                accept=".csv,.txt,.xlsx,.xls,.pdf"
                onChange={handleFileInput}
                className="hidden"
                id="reach-file-upload"
              />
              <label htmlFor="reach-file-upload" className="cursor-pointer flex flex-col items-center gap-2 w-full">
                {fileStatus === 'parsing' ? (
                  <>
                    <Loader2 className="h-9 w-9 text-primary animate-spin" />
                    <span className="font-semibold text-sm text-primary">Parsing {fileName}…</span>
                    <span className="text-xs text-muted-foreground">Extracting items from your file</span>
                  </>
                ) : fileStatus === 'done' ? (
                  <>
                    <CheckCircle2 className="h-9 w-9 text-green-500" />
                    <span className="font-semibold text-sm text-green-700 dark:text-green-400">{fileName}</span>
                    <span className="text-xs text-muted-foreground">
                      {parsedRows.length} rows loaded
                      {unmatchedCount > 0 ? ` · ${unmatchedCount} unmatched (review below)` : ' · click to replace'}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <FileSpreadsheet className="h-8 w-8 text-primary" />
                      <FileScan className="h-8 w-8 text-primary" />
                    </div>
                    <span className="font-semibold text-sm">
                      Drop your Reach sales file here, or click to browse
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Supports <strong>PDF</strong>, CSV, and Excel (.xlsx) — all auto-parsed
                    </span>
                  </>
                )}
              </label>
            </div>

            {/* Summary bar */}
            {parsedRows.length > 0 && (
              <div className="flex flex-wrap items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-xs gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">{parsedRows.length}</strong> items
                  </span>
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">{totalQty}</strong> units sold
                  </span>
                </div>
                <span className="font-bold text-primary text-sm">₦{totalValue.toFixed(2)}</span>
              </div>
            )}

            {/* Items Table */}
            {parsedRows.length > 0 && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-xs sm:text-sm">Review & Edit Rows</h3>
                  <Button size="sm" variant="outline" onClick={handleAddManualRow} className="h-9 text-xs">
                    <Plus className="h-4 w-4 mr-1" /> Add Row
                  </Button>
                </div>
                <div className="border rounded-md overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[160px]">Item</TableHead>
                        <TableHead className="w-24 text-right min-w-[80px]">Qty Sold</TableHead>
                        <TableHead className="w-24 text-right min-w-[90px]">Unit Price</TableHead>
                        <TableHead className="w-24 text-right min-w-[90px]">Total (₦)</TableHead>
                        <TableHead className="w-12" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedRows.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <select
                              value={row.itemId}
                              onChange={e => handleRowChange(idx, 'itemId', e.target.value)}
                              className="w-full h-9 text-xs sm:text-sm rounded-md border bg-background px-2"
                            >
                              {items?.map(it => (
                                <option key={it.id} value={it.id}>
                                  {it.name} ({it.category})
                                </option>
                              ))}
                            </select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number" min="1"
                              value={row.qtySold}
                              onChange={e => handleRowChange(idx, 'qtySold', Number(e.target.value))}
                              className="h-9 w-20 text-right ml-auto text-xs sm:text-sm"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number" step="0.01"
                              value={row.unitPrice}
                              onChange={e => handleRowChange(idx, 'unitPrice', Number(e.target.value))}
                              className="h-9 w-24 text-right ml-auto text-xs sm:text-sm"
                            />
                          </TableCell>
                          <TableCell className="text-right font-medium text-xs sm:text-sm">
                            {((Number(row.qtySold) || 0) * (Number(row.unitPrice) || 0)).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleRemoveRow(idx)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-end pt-2">
                  <Button onClick={handleSubmitReport} disabled={uploadSales.isPending} className="w-full sm:w-auto h-11 sm:h-9 text-base sm:text-xs">
                    {uploadSales.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Save & Sync Sales Report
                  </Button>
                </div>
              </div>
            )}

            {/* Manual entry prompt when no file loaded */}
            {parsedRows.length === 0 && fileStatus === 'idle' && (
              <div className="flex flex-col items-center gap-2 pt-2">
                <p className="text-xs text-muted-foreground">No file? Enter items manually instead</p>
                <Button size="sm" variant="outline" onClick={handleAddManualRow} className="h-9 text-xs">
                  <ShoppingBag className="h-4 w-4 mr-2" /> Add Item Manually
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upload History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Recent Uploads</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Reach daily reports history (Click to view details)</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingHistory ? (
              <div className="text-center py-6 text-muted-foreground text-xs sm:text-sm">Loading…</div>
            ) : !reportsHistory || reportsHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-xs sm:text-sm">No sales reports uploaded yet.</div>
            ) : (
              <div className="space-y-3">
                {reportsHistory.map(rep => (
                  <div 
                    key={rep.id} 
                    onClick={() => setSelectedReport(rep)}
                    className="p-3 border rounded-lg flex items-center justify-between text-xs sm:text-sm gap-2 cursor-pointer transition-all hover:bg-accent/40 active:bg-accent/70 hover:border-primary/50 shadow-sm hover:shadow-md"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{rep.retail_member_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(rep.report_date), 'PP')} · {rep.total_items_sold || 0} items
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-primary">₦{(rep.total_sales_value || 0).toFixed(2)}</div>
                      <div className="text-[10px] text-muted-foreground truncate max-w-[100px]">{rep.file_name}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed report modal */}
      <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] flex flex-col p-4 sm:p-6 overflow-hidden">
          {selectedReport && (
            <>
              <DialogHeader className="space-y-1">
                <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <FileText className="h-5 w-5 text-primary" />
                  Sales Report Details
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm">
                  Uploaded by <strong className="text-foreground">{selectedReport.retail_member_name}</strong> on {format(new Date(selectedReport.report_date), 'PPP')}
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto my-4 pr-1">
                {isLoadingDetails ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Loading sales items...</span>
                  </div>
                ) : !reportDetails || reportDetails.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No items found in this sales report.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs sm:text-sm">Item Name</TableHead>
                            <TableHead className="text-right text-xs sm:text-sm">Qty Sold</TableHead>
                            <TableHead className="text-right text-xs sm:text-sm">Price</TableHead>
                            <TableHead className="text-right text-xs sm:text-sm">Subtotal</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reportDetails.map((det) => (
                            <TableRow key={det.id}>
                              <TableCell className="font-medium text-xs sm:text-sm">
                                <div>{det.item_name}</div>
                                <div className="text-[10px] text-muted-foreground">{det.category}</div>
                              </TableCell>
                              <TableCell className="text-right text-xs sm:text-sm">{det.quantity}</TableCell>
                              <TableCell className="text-right text-xs sm:text-sm">₦{det.unit_price.toFixed(2)}</TableCell>
                              <TableCell className="text-right font-medium text-xs sm:text-sm">
                                ₦{(det.quantity * det.unit_price).toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="bg-accent/30 p-3 sm:p-4 rounded-lg flex flex-col sm:flex-row sm:justify-between gap-3 text-xs sm:text-sm border">
                      <div>
                        <div className="text-muted-foreground">Source File:</div>
                        <div className="font-semibold truncate max-w-[250px]">{selectedReport.file_name || 'Manual Entry'}</div>
                      </div>
                      <div className="sm:text-right">
                        <div className="text-muted-foreground">Total Sales Value:</div>
                        <div className="text-xl sm:text-2xl font-bold text-primary">
                          ₦{(selectedReport.total_sales_value || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-between w-full pt-2 border-t mt-auto">
                <Button 
                  variant="destructive" 
                  size="sm"
                  className="w-full sm:w-auto text-xs"
                  disabled={deleteReport.isPending}
                  onClick={async () => {
                    if (window.confirm("Are you sure you want to delete and void this sales report? This will restore the items' inventory levels by reversing the sales.")) {
                      await deleteReport.mutateAsync(selectedReport.id);
                      setSelectedReport(null);
                    }
                  }}
                >
                  {deleteReport.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Void/Delete Report
                </Button>

                <div className="flex gap-2 w-full sm:w-auto">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 sm:flex-initial text-xs"
                    onClick={() => setSelectedReport(null)}
                  >
                    Close
                  </Button>
                  
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="flex-1 sm:flex-initial text-xs"
                    disabled={!reportDetails || reportDetails.length === 0}
                    onClick={() => {
                      if (!reportDetails) return;
                      // Generate CSV content
                      const headers = "Item Name,Category,Quantity Sold,Unit Price,Subtotal\n";
                      const rows = reportDetails.map(d => 
                        `"${d.item_name}","${d.category}",${d.quantity},${d.unit_price},${(d.quantity * d.unit_price).toFixed(2)}`
                      ).join("\n");
                      const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.setAttribute("href", url);
                      link.setAttribute("download", `sales_report_${selectedReport.retail_member_name}_${selectedReport.report_date}.csv`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
