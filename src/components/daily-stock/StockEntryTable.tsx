import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useItems } from '@/hooks/useItems';
import { useDailyStockSheets } from '@/hooks/useDailyStockSheets';
import { supabase } from '@/integrations/supabase/client';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Plus, Trash2, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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

interface StockEntryTableProps {
  date: Date;
  teamMember: string;
}

const StockEntryTable = ({ date, teamMember }: StockEntryTableProps) => {
  const [rows, setRows] = useState<StockRow[]>([]);

  const { data: items } = useItems();
  const { data: existingSheets, isLoading } = useDailyStockSheets(
    format(date, 'yyyy-MM-dd'),
    teamMember
  );
  const queryClient = useQueryClient();
  const { isOnline, addDailyToQueue } = useOfflineSync();

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
      const { error } = await supabase.from('daily_stock_sheets').delete().eq('id', row.id);
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return;
      }
    }
    setRows(rows.filter((_, i) => i !== index));
  };

  const [isSaving, setIsSaving] = useState(false);

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

    if (!isOnline) {
      for (const row of validRows) {
        addDailyToQueue({
          date: format(date, 'yyyy-MM-dd'),
          retail_team_name: teamMember,
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
      return;
    }

    setIsSaving(true);
    try {
      // Delete rows that were removed by the user
      if (existingSheets) {
        const currentIds = validRows.filter(r => r.id).map(r => r.id!);
        const removedIds = existingSheets
          .map(s => s.id)
          .filter(id => !currentIds.includes(id));
        if (removedIds.length > 0) {
          const { error: delError } = await supabase
            .from('daily_stock_sheets')
            .delete()
            .in('id', removedIds);
          if (delError) throw delError;
        }
      }

      // Upsert all rows in one call (updates existing, inserts new)
      const upsertData = validRows.map(row => ({
        ...(row.id ? { id: row.id } : {}),
        date: format(date, 'yyyy-MM-dd'),
        retail_team_name: teamMember,
        item_id: row.item_id,
        open_qty: row.open_qty,
        qty_in: row.qty_in,
        close_qty: row.close_qty,
        sales_qty: row.sales_qty,
        reach: row.reach || null,
        os_status: row.os_status || null,
        remark: row.remark || null,
      }));

      const { error } = await supabase
        .from('daily_stock_sheets')
        .upsert(upsertData);
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['daily_stock_sheets'] });
      toast({ title: 'Success', description: 'Stock sheet entries saved' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const getItemName = (itemId: string) => {
    return items?.find(item => item.id === itemId)?.name || '';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">{teamMember}</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={addRow}>
            <Plus className="mr-2 h-4 w-4" />
            Add Row
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isOnline ? 'Save' : 'Save Offline'}
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
  );
};

export default StockEntryTable;
