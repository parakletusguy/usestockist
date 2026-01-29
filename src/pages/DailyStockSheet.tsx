import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useItems } from '@/hooks/useItems';
import { useDailyStockSheets, useCreateDailyStockSheet, useDeleteDailyStockSheet } from '@/hooks/useDailyStockSheets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, Plus, Trash2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const TEAMS = ['Team 1', 'Team 2', 'Team 3', 'Team 4', 'Team 5', 'Team 6', 'Team 7', 'Team 8', 'Team 9', 'Team 10'];

interface StockRow {
  id?: string;
  item_id: string;
  open_qty: number;
  qty_in: number;
  close_qty: number;
  sales_qty: number;
  reach: string;
  os_status: string;
  remark: string;
}

const DailyStockSheet = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [team, setTeam] = useState<string>('');
  const [rows, setRows] = useState<StockRow[]>([]);
  
  const { data: items } = useItems();
  const { data: existingSheets, isLoading } = useDailyStockSheets(
    format(date, 'yyyy-MM-dd'),
    team
  );
  const createSheet = useCreateDailyStockSheet();
  const deleteSheet = useDeleteDailyStockSheet();

  // Load existing data when date/team changes
  useEffect(() => {
    if (existingSheets && existingSheets.length > 0) {
      setRows(existingSheets.map(sheet => ({
        id: sheet.id,
        item_id: sheet.item_id,
        open_qty: Number(sheet.open_qty),
        qty_in: Number(sheet.qty_in),
        close_qty: Number(sheet.close_qty),
        sales_qty: Number(sheet.sales_qty),
        reach: sheet.reach || '',
        os_status: sheet.os_status || '',
        remark: sheet.remark || '',
      })));
    } else {
      setRows([]);
    }
  }, [existingSheets]);

  const addRow = () => {
    setRows([...rows, {
      item_id: '',
      open_qty: 0,
      qty_in: 0,
      close_qty: 0,
      sales_qty: 0,
      reach: '',
      os_status: '',
      remark: '',
    }]);
  };

  const updateRow = (index: number, field: keyof StockRow, value: string | number) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    
    // Auto-calculate sales_qty
    if (field === 'open_qty' || field === 'qty_in' || field === 'close_qty') {
      const open = field === 'open_qty' ? Number(value) : newRows[index].open_qty;
      const qtyIn = field === 'qty_in' ? Number(value) : newRows[index].qty_in;
      const close = field === 'close_qty' ? Number(value) : newRows[index].close_qty;
      newRows[index].sales_qty = (open + qtyIn) - close;
    }
    
    setRows(newRows);
  };

  const removeRow = async (index: number) => {
    const row = rows[index];
    if (row.id) {
      await deleteSheet.mutateAsync(row.id);
    }
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const validRows = rows.filter(row => row.item_id);
    
    if (validRows.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one item',
        variant: 'destructive',
      });
      return;
    }

    // Delete existing entries for this date/team first
    if (existingSheets) {
      for (const sheet of existingSheets) {
        await deleteSheet.mutateAsync(sheet.id);
      }
    }

    // Create new entries
    for (const row of validRows) {
      await createSheet.mutateAsync({
        date: format(date, 'yyyy-MM-dd'),
        retail_team_name: team,
        item_id: row.item_id,
        open_qty: row.open_qty,
        qty_in: row.qty_in,
        close_qty: row.close_qty,
        sales_qty: row.sales_qty,
        reach: row.reach || undefined,
        os_status: row.os_status || undefined,
        remark: row.remark || undefined,
      });
    }
  };

  const getItemName = (itemId: string) => {
    return items?.find(item => item.id === itemId)?.name || '';
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
      <div>
        <h1 className="text-3xl font-bold">Daily Stock Sheet</h1>
        <p className="text-muted-foreground">Record daily stock movements by retail team</p>
      </div>

      {/* Selectors */}
      <Card>
        <CardHeader>
          <CardTitle>Select Date & Team</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full sm:w-[240px] justify-start text-left font-normal")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(date, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Retail Team</Label>
              <Input
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                placeholder="Enter team member name"
                className="w-full sm:w-[240px]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Grid */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Stock Entries</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={addRow}>
              <Plus className="mr-2 h-4 w-4" />
              Add Row
            </Button>
            <Button onClick={handleSave} disabled={createSheet.isPending}>
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Item</TableHead>
                  <TableHead className="min-w-[100px]">Open Qty</TableHead>
                  <TableHead className="min-w-[100px]">Qty In</TableHead>
                  <TableHead className="min-w-[100px]">Close Qty</TableHead>
                  <TableHead className="min-w-[100px]">Sales Qty</TableHead>
                  <TableHead className="min-w-[100px]">Reach</TableHead>
                  <TableHead className="min-w-[100px]">OS Status</TableHead>
                  <TableHead className="min-w-[150px]">Remark</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      No entries yet. Click "Add Row" to start.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Select
                          value={row.item_id}
                          onValueChange={(value) => updateRow(index, 'item_id', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select item">
                              {row.item_id ? getItemName(row.item_id) : 'Select item'}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="bg-background">
                            {items?.map(item => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={row.open_qty}
                          onChange={(e) => updateRow(index, 'open_qty', Number(e.target.value))}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={row.qty_in}
                          onChange={(e) => updateRow(index, 'qty_in', Number(e.target.value))}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={row.close_qty}
                          onChange={(e) => updateRow(index, 'close_qty', Number(e.target.value))}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={row.sales_qty}
                          readOnly
                          className="w-20 bg-muted"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={row.reach}
                          onChange={(e) => updateRow(index, 'reach', e.target.value)}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={row.os_status}
                          onChange={(e) => updateRow(index, 'os_status', e.target.value)}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={row.remark}
                          onChange={(e) => updateRow(index, 'remark', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRow(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
};

export default DailyStockSheet;
