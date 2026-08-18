import { useState, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { useItems, useCreateItem } from '@/hooks/useItems';
import { useReachSalesReports, useUploadReachSales, useReachSalesReportDetails, useDeleteReachSalesReport, ReachSalesReport } from '@/hooks/useReachSales';
import { parsePdfSalesReport, ParsedPdfRow } from '@/lib/parsePdf';
import { calculateBarCupDeductions, isPreparedBarDrink, isBarCupConsumingDrink, isPackagedProductOverride } from '@/lib/barCupMapping';
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
  ShoppingBag, Plus, Trash2, Loader2, FileText,
  AlertTriangle, Sparkles, Ticket, Coffee, ChevronDown, ChevronUp
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ParsedSaleRow {
  itemId: string;
  itemName: string;
  qtySold: number;
  unitPrice: number;
  department: string;
  isPreparedDrink?: boolean;
}

type FileStatus = 'idle' | 'parsing' | 'done' | 'error';

/** Normalize string by stripping non-alphanumeric chars */
const normalizeStr = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

/** Tokenize string into clean words */
const tokenizeStr = (str: string) =>
  str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !['can', 'bottle', 'pack', 'pcs', 'drink', 'item', 'product'].includes(w));

/** Identify kitchen items (e.g. Shawarma, Chicken, Sausages) to route to Kitchen department */
const isKitchenItemName = (name: string) => {
  const lower = name.toLowerCase();
  return ['shawarma', 'chicken', 'sausage', 'burger', 'meat pie', 'doughnut', 'bbq', 'ketchup', 'curry', 'pepper', 'corn dog'].some(k => lower.includes(k));
};

/** Identify bar items */
const isBarItemName = (name: string) => {
  const lower = name.toLowerCase();
  // Packaged canned products that share bar keyword names must never be treated as bar items
  if (isPackagedProductOverride(name)) return false;
  return [
    'cocktail', 'mocktail', 'mojito', 'margarita', 'magarita', 'martini', 'long island',
    'milkshake', 'smoothie', 'blast', 'shot', 'vodka', 'gin', 'rum', 'whisky', 'whiskey',
    'tequila', 'tequilla', 'wine', 'syrup', 'sirop', 'liqueur'
  ].some(k => lower.includes(k));
};

export default function ItemSalesReport() {
  const [reportDate, setReportDate] = useState<Date>(new Date());
  const dateStr = format(reportDate, 'yyyy-MM-dd');
  const [retailMember, setRetailMember] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedSaleRow[]>([]);
  const [ticketRows, setTicketRows] = useState<ParsedPdfRow[]>([]);
  const [ticketRevenue, setTicketRevenue] = useState(0);
  const [ticketQuantity, setTicketQuantity] = useState(0);
  const [showTicketDetails, setShowTicketDetails] = useState(false);

  const [fileName, setFileName] = useState('');
  const [fileStatus, setFileStatus] = useState<FileStatus>('idle');
  const [unmatchedCount, setUnmatchedCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isCreatingItems, setIsCreatingItems] = useState(false);

  const { data: items } = useItems();
  const createItemMutation = useCreateItem();
  const { data: reportsHistory, isLoading: isLoadingHistory } = useReachSalesReports();
  const uploadSales = useUploadReachSales();
  
  const [selectedReport, setSelectedReport] = useState<ReachSalesReport | null>(null);
  const deleteReport = useDeleteReachSalesReport();
  const { data: reportDetails, isLoading: isLoadingDetails } = useReachSalesReportDetails(selectedReport?.id || null);

  /** Bar cup deductions calculation */
  const barCupStats = useMemo(() => {
    return calculateBarCupDeductions(parsedRows);
  }, [parsedRows]);

  /** Find Cups item in Bar department */
  const barCupsItem = useMemo(() => {
    if (!items) return null;
    return items.find(
      it => it.name.toLowerCase() === 'cups' && (it.departments?.includes('Bar') || it.department === 'Bar')
    ) || items.find(it => it.name.toLowerCase() === 'cups');
  }, [items]);

  /** Advanced 4-stage matching algorithm */
  const matchToCatalog = useCallback((rawName: string): { id: string; name: string; unit_cost: number; department?: string } | null => {
    if (!items || items.length === 0 || !rawName) return null;

    // If it is a prepared cocktail, mocktail, smoothie, milkshake, tea, or shot, do not match raw syrup/fruit catalog items
    if (isPreparedBarDrink(rawName)) {
      return null;
    }

    const rawLower = rawName.toLowerCase().trim();
    const rawNorm = normalizeStr(rawName);
    const rawTokens = tokenizeStr(rawName);

    // Stage 1: Exact lowercase match
    const exact = items.find(it => it.name.toLowerCase().trim() === rawLower);
    if (exact) return exact;

    // Stage 2: Normalized exact match
    const normExact = items.find(it => normalizeStr(it.name) === rawNorm);
    if (normExact) return normExact;

    // Stage 3: Substring match
    const substringMatch = items.find(it => {
      const itLower = it.name.toLowerCase().trim();
      const itNorm = normalizeStr(it.name);
      return (
        rawLower.includes(itLower) ||
        itLower.includes(rawLower) ||
        (rawNorm.length >= 4 && itNorm.length >= 4 && (rawNorm.includes(itNorm) || itNorm.includes(rawNorm)))
      );
    });
    if (substringMatch) return substringMatch;

    // Stage 4: Token/Word overlap match
    if (rawTokens.length > 0) {
      let bestItem: (typeof items)[0] | null = null;
      let bestScore = 0;

      for (const item of items) {
        const itemTokens = tokenizeStr(item.name);
        if (itemTokens.length === 0) continue;

        const common = rawTokens.filter(t => itemTokens.includes(t));
        const score = common.length / Math.max(rawTokens.length, itemTokens.length);

        if (score > 0.3 && score > bestScore) {
          bestScore = score;
          bestItem = item;
        }
      }

      if (bestItem) return bestItem;
    }

    return null;
  }, [items]);

  /** Determine default department for an item name */
  const detectDepartment = (name: string): string => {
    if (isKitchenItemName(name)) return 'Kitchen';
    if (isBarItemName(name)) return 'Bar';
    return 'Retail';
  };

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
      const isPrepared = !matched && (isPreparedBarDrink(rawName) || isBarItemName(rawName) || detectDepartment(rawName) === 'Bar');
      const dept = matched?.department || (isPrepared ? 'Bar' : detectDepartment(rawName));
      if (matched) {
        newRows.push({
          itemId: matched.id,
          itemName: matched.name,
          qtySold: qty,
          unitPrice: price || matched.unit_cost,
          department: dept,
        });
      } else if (isPrepared) {
        newRows.push({
          itemId: '',
          itemName: rawName,
          qtySold: qty,
          unitPrice: price || 0,
          department: 'Bar',
          isPreparedDrink: true,
        });
      } else {
        unmatched++;
        newRows.push({
          itemId: '',
          itemName: rawName,
          qtySold: qty,
          unitPrice: price || 0,
          department: dept,
        });
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
    setTicketRows([]);
    setTicketRevenue(0);
    setTicketQuantity(0);
    setUnmatchedCount(0);

    try {
      let newRows: ParsedSaleRow[] = [];

      if (file.name.toLowerCase().endsWith('.pdf')) {
        const pdfResult = await parsePdfSalesReport(file);
        
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

        setTicketRows(pdfResult.ticketRows || []);
        setTicketRevenue(pdfResult.totalTicketRevenue || 0);
        setTicketQuantity(pdfResult.totalTicketQuantity || 0);

        let unmatched = 0;
        newRows = pdfResult.rows.map(row => {
          const matched = matchToCatalog(row.item_name);
          const isPrepared = !matched && (isPreparedBarDrink(row.item_name) || isBarItemName(row.item_name) || detectDepartment(row.item_name) === 'Bar');
          const dept = matched?.department || (isPrepared ? 'Bar' : detectDepartment(row.item_name));
          if (matched) {
            return {
              itemId: matched.id,
              itemName: matched.name,
              qtySold: row.quantity,
              unitPrice: row.unit_price || matched.unit_cost,
              department: dept,
            };
          } else if (isPrepared) {
            return {
              itemId: '',
              itemName: row.item_name,
              qtySold: row.quantity,
              unitPrice: row.unit_price || 0,
              department: 'Bar',
              isPreparedDrink: true,
            };
          } else {
            unmatched++;
            return {
              itemId: '',
              itemName: row.item_name,
              qtySold: row.quantity,
              unitPrice: row.unit_price || 0,
              department: dept,
            };
          }
        });

        setUnmatchedCount(unmatched);
      } else {
        const text = await file.text();
        newRows = parseCsv(text);
      }

      setFileStatus('done');
      setParsedRows(newRows);

      toast({
        title: 'File Parsed',
        description: `Loaded ${newRows.length} physical inventory row(s) from ${file.name}`,
      });
    } catch (err: unknown) {
      setFileStatus('error');
      toast({ title: 'Parse Error', description: err instanceof Error ? err.message : 'Failed to parse file', variant: 'destructive' });
    }
  }, [items, matchToCatalog, parseCsv]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
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
      { itemId: first.id, itemName: first.name, qtySold: 1, unitPrice: first.unit_cost, department: 'Retail' },
    ]);
    toast({ title: 'Manual Row Added', description: `Added ${first.name} to sales entry table.` });
  };

  const handleQuickCreateItem = async (index: number) => {
    const row = parsedRows[index];
    if (!row || !row.itemName) return;

    try {
      const dept = detectDepartment(row.itemName);
      const newItem = await createItemMutation.mutateAsync({
        name: row.itemName,
        category: dept === 'Kitchen' ? 'Food' : dept === 'Bar' ? 'Beverages' : 'Retail',
        unit_of_measure: 'pcs',
        low_stock_threshold: 10,
        unit_cost: row.unitPrice || 0,
        departments: [dept],
      });

      setParsedRows(prev => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          itemId: newItem.id,
          itemName: newItem.name,
          department: dept,
        };
        return next;
      });

      setUnmatchedCount(prev => Math.max(0, prev - 1));
      toast({ title: 'Item Created', description: `Created "${newItem.name}" in catalog (${dept}).` });
    } catch (err: unknown) {
      toast({ title: 'Creation Failed', description: err instanceof Error ? err.message : 'Could not create item', variant: 'destructive' });
    }
  };

  const handleQuickCreateAllMissing = async () => {
    const missingIndices = parsedRows
      .map((r, i) => (!r.itemId && !r.isPreparedDrink ? i : -1))
      .filter(i => i !== -1);

    if (missingIndices.length === 0) return;

    setIsCreatingItems(true);
    let createdCount = 0;
    const newRows = [...parsedRows];

    for (const idx of missingIndices) {
      const row = newRows[idx];
      if (!row || !row.itemName) continue;

      try {
        const dept = detectDepartment(row.itemName);
        const newItem = await createItemMutation.mutateAsync({
          name: row.itemName,
          category: dept === 'Kitchen' ? 'Food' : dept === 'Bar' ? 'Beverages' : 'Retail',
          unit_of_measure: 'pcs',
          low_stock_threshold: 10,
          unit_cost: row.unitPrice || 0,
          departments: [dept],
        });

        newRows[idx] = {
          ...newRows[idx],
          itemId: newItem.id,
          itemName: newItem.name,
          department: dept,
          isPreparedDrink: false,
        };
        createdCount++;
      } catch {
        // continue
      }
    }

    setParsedRows(newRows);
    setUnmatchedCount(prev => Math.max(0, prev - createdCount));
    setIsCreatingItems(false);
    toast({ title: 'Missing Items Created', description: `Successfully created ${createdCount} new item(s) in catalog.` });
  };

  const handleRowChange = (index: number, field: keyof ParsedSaleRow, value: string | number) => {
    setParsedRows(prev => {
      const next = [...prev];
      if (field === 'itemId') {
        const item = items?.find(it => it.id === value);
        next[index] = {
          ...next[index],
          itemId: value as string,
          itemName: item?.name || next[index].itemName,
          unitPrice: item?.unit_cost ?? next[index].unitPrice,
          isPreparedDrink: false,
        };
        if (value && !prev[index].itemId && !prev[index].isPreparedDrink) {
          setUnmatchedCount(count => Math.max(0, count - 1));
        }
      } else {
        next[index] = { ...next[index], [field]: value };
      }
      return next;
    });
  };

  const handleRemoveRow = (index: number) => setParsedRows(prev => prev.filter((_, i) => i !== index));

  const handleSubmitReport = async () => {
    if (!retailMember.trim()) {
      toast({ title: 'Validation Error', description: 'Please enter the staff / member name', variant: 'destructive' });
      return;
    }
    if (parsedRows.length === 0) {
      toast({ title: 'Validation Error', description: 'Please add at least one item sale', variant: 'destructive' });
      return;
    }

    const missingRows = parsedRows.filter(r => !r.itemId && !r.isPreparedDrink);
    if (missingRows.length > 0) {
      toast({
        title: 'Unmatched Items Found',
        description: `Please select catalog items or click "Create Missing Items" for the ${missingRows.length} unmatched row(s) before saving.`,
        variant: 'destructive',
      });
      return;
    }

    // Build base sale items — physical catalog items have item_id; prepared drinks have item_name (for report total, no ledger transaction)
    const saleItems = parsedRows.flatMap(r => {
      if (r.itemId) {
        const base = {
          item_id: r.itemId,
          item_name: r.itemName,
          qty_sold: r.qtySold,
          unit_price: r.unitPrice,
        };
        if (r.department === 'Kitchen') {
          return [
            { ...base, department: 'Retail' },
            { ...base, department: 'Kitchen' },
          ];
        }
        return [{ ...base, department: r.department || 'Retail' }];
      }
      return [{
        item_name: r.itemName,
        qty_sold: r.qtySold,
        unit_price: r.unitPrice,
        department: r.department || 'Bar',
      }];
    });

    // Auto-append Bar Cups deduction if Bar drinks were sold
    if (barCupStats.totalCupsToDeduct > 0 && barCupsItem) {
      saleItems.push({
        item_id: barCupsItem.id,
        item_name: 'Cups',
        qty_sold: barCupStats.totalCupsToDeduct,
        unit_price: barCupsItem.unit_cost || 0,
        department: 'Bar',
      });
    }

    await uploadSales.mutateAsync({
      report_date: dateStr,
      retail_member_name: retailMember.trim(),
      file_name: fileName || 'Reach_Sales_Upload',
      total_items_sold: totalQty,
      total_sales_value: totalValue,
      items: saleItems,
    });

    setParsedRows([]);
    setTicketRows([]);
    setTicketRevenue(0);
    setTicketQuantity(0);
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
            Upload daily Reach POS exports — CSV, Excel, or PDF auto-parsed with Bar Cup Auto-Reconciliation
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upload & Form Section */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Daily Sales Entry</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Drop your Reach PDF, CSV, or Excel file — auto-parsed instantly</CardDescription>
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
                <Label className="text-xs">Staff / Member Name</Label>
                <Input
                  value={retailMember}
                  onChange={e => setRetailMember(e.target.value)}
                  placeholder="e.g. Chinenye Joy"
                  className="h-11 sm:h-9 text-base sm:text-xs"
                />
              </div>
            </div>

            {/* Dropzone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                'border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
                isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
                fileStatus === 'parsing' && 'opacity-60 pointer-events-none'
              )}
            >
              <input
                type="file"
                accept=".pdf,.csv,.txt,.xlsx"
                onChange={handleFileInput}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                {fileStatus === 'parsing' ? (
                  <>
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    <span className="text-sm font-medium">Parsing sales report…</span>
                  </>
                ) : fileName ? (
                  <>
                    <FileSpreadsheet className="h-8 w-8 text-primary" />
                    <span className="font-semibold text-sm">{fileName}</span>
                    <span className="text-xs text-muted-foreground">Click or drop another file to replace</span>
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

            {/* Read-Only Box Office Ticket Revenue Card */}
            {ticketRows.length > 0 && (
              <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-3 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-purple-900 dark:text-purple-200">
                    <Ticket className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span>🎟️ Box Office & Ticket Sales (Read-Only: Not in Physical Stock)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-purple-700 dark:text-purple-300">
                      {ticketQuantity} tickets · ₦{ticketRevenue.toLocaleString()}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowTicketDetails(!showTicketDetails)}
                      className="h-6 w-6 p-0 text-purple-700 dark:text-purple-300"
                    >
                      {showTicketDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>

                {showTicketDetails && (
                  <div className="border rounded-md bg-background overflow-hidden mt-2">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-[11px] py-1">Ticket Type</TableHead>
                          <TableHead className="text-right text-[11px] py-1">Qty</TableHead>
                          <TableHead className="text-right text-[11px] py-1">Price</TableHead>
                          <TableHead className="text-right text-[11px] py-1">Revenue (₦)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ticketRows.map((t, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="text-[11px] py-1 font-medium">{t.item_name}</TableCell>
                            <TableCell className="text-right text-[11px] py-1">{t.quantity}</TableCell>
                            <TableCell className="text-right text-[11px] py-1">₦{t.unit_price.toLocaleString()}</TableCell>
                            <TableCell className="text-right text-[11px] py-1 font-semibold">
                              ₦{(t.quantity * t.unit_price).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}

            {/* Bar Cup Auto-Reconciliation Card */}
            {barCupStats.totalCupsToDeduct > 0 && (
              <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-xs flex items-center justify-between text-blue-900 dark:text-blue-200">
                <div className="flex items-center gap-2">
                  <Coffee className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>
                    <strong>🥤 Bar Cups Auto-Reconciliation:</strong> {barCupStats.totalCupsToDeduct} cups will be automatically deducted from Bar stock count for {barCupStats.cupEligibleItems.length} served drink(s).
                  </span>
                </div>
                <span className="font-bold text-blue-700 dark:text-blue-300 shrink-0 ml-2">
                  -{barCupStats.totalCupsToDeduct} Cups
                </span>
              </div>
            )}

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
                {/* Unmatched Alert Banner & Bulk Creation Button */}
                {unmatchedCount > 0 && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                      <span>
                        <strong>{unmatchedCount} item{unmatchedCount !== 1 ? 's' : ''}</strong> in report not matched to catalog. Select matching items below or auto-create them.
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleQuickCreateAllMissing}
                      disabled={isCreatingItems}
                      className="h-8 text-xs shrink-0 bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600 border-none"
                    >
                      {isCreatingItems ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5 mr-1" />
                      )}
                      Create {unmatchedCount} Missing Item{unmatchedCount !== 1 ? 's' : ''} in Catalog
                    </Button>
                  </div>
                )}

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
                        <TableHead className="min-w-[220px]">Item</TableHead>
                        <TableHead className="w-28">Department</TableHead>
                        <TableHead className="w-24 text-right min-w-[80px]">Qty Sold</TableHead>
                        <TableHead className="w-24 text-right min-w-[90px]">Unit Price</TableHead>
                        <TableHead className="w-24 text-right min-w-[90px]">Total (₦)</TableHead>
                        <TableHead className="w-24 text-center">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedRows.map((row, idx) => (
                        <TableRow
                          key={idx}
                          className={cn(
                            !row.itemId && !row.isPreparedDrink && 'bg-amber-500/5 hover:bg-amber-500/10 border-l-4 border-l-amber-500',
                            row.isPreparedDrink && 'bg-blue-500/5 hover:bg-blue-500/10 border-l-4 border-l-blue-500'
                          )}
                        >
                          <TableCell>
                            <div className="space-y-1">
                              {row.isPreparedDrink ? (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-xs sm:text-sm text-foreground">{row.itemName}</span>
                                    {isBarCupConsumingDrink(row.itemName) ? (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-300">
                                        <Coffee className="h-3 w-3" /> Prepared Drink (1 Cup Auto-Deduct)
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                                        <Coffee className="h-3 w-3" /> Prepared Beverage (Hot / Service)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <select
                                  value={row.itemId}
                                  onChange={e => handleRowChange(idx, 'itemId', e.target.value)}
                                  className={cn(
                                    "w-full h-9 text-xs sm:text-sm rounded-md border bg-background px-2",
                                    !row.itemId && "border-amber-500/70 text-amber-700 dark:text-amber-400 font-medium"
                                  )}
                                >
                                  {!row.itemId && (
                                    <option value="" disabled>
                                      ⚠️ Unmatched: "{row.itemName}" — (Select catalog item...)
                                    </option>
                                  )}
                                  {items?.map(it => (
                                    <option key={it.id} value={it.id}>
                                      {it.name} ({it.category} · {it.department || 'Retail'})
                                    </option>
                                  ))}
                                </select>
                              )}
                              {!row.itemId && !row.isPreparedDrink && (
                                <div className="text-[11px] text-amber-700 dark:text-amber-400 flex items-center gap-1 font-medium pl-0.5">
                                  <AlertTriangle className="h-3 w-3 inline shrink-0" />
                                  <span>Raw PDF Item: <strong>{row.itemName}</strong></span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs px-2 py-1 bg-muted rounded font-medium">
                              {row.department}
                            </span>
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
                            <div className="flex items-center justify-center gap-1">
                              {!row.itemId && !row.isPreparedDrink && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleQuickCreateItem(idx)}
                                  className="h-8 px-2 text-[11px] border-amber-500/50 text-amber-700 hover:bg-amber-500/10 dark:text-amber-300"
                                  title="Add this item to catalog"
                                >
                                  <Plus className="h-3.5 w-3.5 mr-1" /> Create
                                </Button>
                              )}
                              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleRemoveRow(idx)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
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
