import { useState } from 'react';
import { format } from 'date-fns';
import { useItems } from '@/hooks/useItems';
import { useReachSalesReports, useUploadReachSales } from '@/hooks/useReachSales';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, ShoppingBag, Plus, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ParsedSaleRow {
  itemId: string;
  itemName: string;
  qtySold: number;
  unitPrice: number;
}

export default function ItemSalesReport() {
  const [reportDate, setReportDate] = useState<Date>(new Date());
  const dateStr = format(reportDate, 'yyyy-MM-dd');
  const [retailMember, setRetailMember] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedSaleRow[]>([]);
  const [fileName, setFileName] = useState('');

  const { data: items } = useItems();
  const { data: reportsHistory, isLoading: isLoadingHistory } = useReachSalesReports();
  const uploadSales = useUploadReachSales();

  // CSV File Parser for Reach Sales Export
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          toast({ title: 'Error', description: 'CSV file must have headers and content', variant: 'destructive' });
          return;
        }

        const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
        const nameIdx = headers.findIndex((h) => h.includes('item') || h.includes('product') || h.includes('name'));
        const qtyIdx = headers.findIndex((h) => h.includes('qty') || h.includes('quantity') || h.includes('sold'));
        const priceIdx = headers.findIndex((h) => h.includes('price') || h.includes('amount') || h.includes('total'));

        const newRows: ParsedSaleRow[] = [];

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
          if (cols.length <= 1) continue;

          const rawName = cols[nameIdx >= 0 ? nameIdx : 0] || '';
          const qty = Number(cols[qtyIdx >= 0 ? qtyIdx : 1]) || 0;
          const price = Number(cols[priceIdx >= 0 ? priceIdx : 2]) || 0;

          if (!rawName || qty <= 0) continue;

          // Match with catalog items
          const matchedItem = items?.find(
            (it) => it.name.toLowerCase() === rawName.toLowerCase() || rawName.toLowerCase().includes(it.name.toLowerCase())
          );

          if (matchedItem) {
            newRows.push({
              itemId: matchedItem.id,
              itemName: matchedItem.name,
              qtySold: qty,
              unitPrice: price || matchedItem.unit_cost,
            });
          }
        }

        if (newRows.length === 0 && items && items.length > 0) {
          toast({
            title: 'Notice',
            description: 'Could not automatically match file items to catalog. Please select items manually.',
          });
        }

        setParsedRows(newRows);
        toast({ title: 'File Parsed', description: `Loaded ${newRows.length} matched item sales` });
      } catch (err: any) {
        toast({ title: 'File Error', description: err.message || 'Failed to parse file', variant: 'destructive' });
      }
    };

    reader.readAsText(file);
  };

  const handleAddManualRow = () => {
    if (!items || items.length === 0) return;
    const firstItem = items[0];
    setParsedRows((prev) => [
      ...prev,
      { itemId: firstItem.id, itemName: firstItem.name, qtySold: 1, unitPrice: firstItem.unit_cost },
    ]);
  };

  const handleRowChange = (index: number, field: keyof ParsedSaleRow, value: any) => {
    setParsedRows((prev) => {
      const next = [...prev];
      if (field === 'itemId') {
        const item = items?.find((it) => it.id === value);
        next[index] = {
          ...next[index],
          itemId: value,
          itemName: item?.name || '',
          unitPrice: item?.unit_cost || next[index].unitPrice,
        };
      } else {
        next[index] = { ...next[index], [field]: value };
      }
      return next;
    });
  };

  const handleRemoveRow = (index: number) => {
    setParsedRows((prev) => prev.filter((_, i) => i !== index));
  };

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
      file_name: fileName || 'Reach_Sales_Upload.csv',
      items: parsedRows.map((r) => ({
        item_id: r.itemId,
        qty_sold: r.qtySold,
        unit_price: r.unitPrice,
        department: 'Retail',
      })),
    });

    setParsedRows([]);
    setFileName('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reach Item Sales Report</h1>
          <p className="text-muted-foreground">Upload daily Reach POS sales exports per retail team member</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upload & Form Section */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Daily Sales Entry</CardTitle>
            <CardDescription>Upload CSV/Excel file or manually input item sales for reconciliation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Report Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(reportDate, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={reportDate} onSelect={(d) => d && setReportDate(d)} />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Retail Member Name</Label>
                <Input
                  placeholder="e.g. John Doe"
                  value={retailMember}
                  onChange={(e) => setRetailMember(e.target.value)}
                />
              </div>
            </div>

            {/* File Dropzone */}
            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer">
              <input type="file" accept=".csv, .txt" onChange={handleFileUpload} className="hidden" id="reach-file-upload" />
              <label htmlFor="reach-file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                <FileSpreadsheet className="h-8 w-8 text-primary" />
                <span className="font-medium text-sm">
                  {fileName ? `File: ${fileName}` : 'Drop Reach Sales CSV here or click to browse'}
                </span>
                <span className="text-xs text-muted-foreground">Supports Reach daily POS CSV exports</span>
              </label>
            </div>

            {/* Items Table */}
            {parsedRows.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Item Sales ({parsedRows.length})</h3>
                  <Button size="sm" variant="outline" onClick={handleAddManualRow}>
                    <Plus className="h-4 w-4 mr-1" /> Add Row
                  </Button>
                </div>
                <div className="border rounded-md overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="w-28 text-right">Qty Sold</TableHead>
                        <TableHead className="w-28 text-right">Unit Price</TableHead>
                        <TableHead className="w-28 text-right">Total ($)</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedRows.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <select
                              value={row.itemId}
                              onChange={(e) => handleRowChange(idx, 'itemId', e.target.value)}
                              className="w-full h-8 text-sm rounded-md border bg-background px-2"
                            >
                              {items?.map((it) => (
                                <option key={it.id} value={it.id}>
                                  {it.name} ({it.category})
                                </option>
                              ))}
                            </select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={row.qtySold}
                              onChange={(e) => handleRowChange(idx, 'qtySold', Number(e.target.value))}
                              className="h-8 w-20 text-right ml-auto"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={row.unitPrice}
                              onChange={(e) => handleRowChange(idx, 'unitPrice', Number(e.target.value))}
                              className="h-8 w-24 text-right ml-auto"
                            />
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {(row.qtySold * row.unitPrice).toFixed(2)}
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
                  <Button onClick={handleSubmitReport} disabled={uploadSales.isPending}>
                    <Upload className="h-4 w-4 mr-2" />
                    Save & Sync Sales Report
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upload History Section */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Sales Uploads</CardTitle>
            <CardDescription>Uploaded Reach daily reports</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingHistory ? (
              <div className="text-center py-6 text-muted-foreground text-sm">Loading history...</div>
            ) : !reportsHistory || reportsHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">No sales reports uploaded yet.</div>
            ) : (
              <div className="space-y-3">
                {reportsHistory.map((rep) => (
                  <div key={rep.id} className="p-3 border rounded-lg flex items-center justify-between text-sm">
                    <div>
                      <div className="font-semibold">{rep.retail_member_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(rep.report_date), 'PP')} · {rep.total_items_sold || 0} items
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary">${(rep.total_sales_value || 0).toFixed(2)}</div>
                      <div className="text-[10px] text-muted-foreground">{rep.file_name}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
