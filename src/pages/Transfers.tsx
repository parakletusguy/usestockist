import { useState } from 'react';
import { format } from 'date-fns';
import { useItems } from '@/hooks/useItems';
import { useTransferLedger, useCreateTransfer, useUpdateTransfer, useDeleteTransfer, TransferLedger } from '@/hooks/useLedgers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CalendarIcon, Plus, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportToCSV } from '@/lib/export';
import { EditDeleteActions } from '@/components/ledger/EditDeleteActions';

import { DEPARTMENTS } from '@/lib/validation';

const DESTINATIONS = DEPARTMENTS;

const Transfers = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [destination, setDestination] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [editingEntry, setEditingEntry] = useState<TransferLedger | null>(null);
  const [editDate, setEditDate] = useState<Date>(new Date());
  const [editDest, setEditDest] = useState('');
  const [editItem, setEditItem] = useState('');
  const [editQty, setEditQty] = useState('');
  const [editReason, setEditReason] = useState('');

  const { data: items } = useItems();
  const { data: ledger, isLoading } = useTransferLedger();
  const createTransfer = useCreateTransfer();
  const updateTransfer = useUpdateTransfer();
  const deleteTransfer = useDeleteTransfer();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !quantity || !destination) return;
    await createTransfer.mutateAsync({
      date: format(date, 'yyyy-MM-dd'),
      destination,
      item_id: selectedItem,
      quantity: Number(quantity),
      reason: reason || undefined,
    });
    setSelectedItem('');
    setQuantity('');
    setDestination('');
    setReason('');
  };

  const openEdit = (entry: TransferLedger) => {
    setEditingEntry(entry);
    setEditDate(new Date(entry.date));
    setEditDest(entry.destination);
    setEditItem(entry.item_id);
    setEditQty(String(entry.quantity));
    setEditReason(entry.reason || '');
  };

  const handleEditSave = async () => {
    if (!editingEntry) return;
    await updateTransfer.mutateAsync({
      id: editingEntry.id,
      date: format(editDate, 'yyyy-MM-dd'),
      destination: editDest,
      item_id: editItem,
      quantity: Number(editQty),
      reason: editReason || undefined,
    });
    setEditingEntry(null);
  };

  const handleExport = () => {
    if (!ledger) return;
    exportToCSV(
      ledger.map(entry => ({
        date: format(new Date(entry.date), 'yyyy-MM-dd'),
        destination: entry.destination,
        item: entry.items?.name || '',
        quantity: entry.quantity,
        unit: entry.items?.unit_of_measure || '',
        reason: entry.reason || '',
      })),
      'transfer_ledger',
      [
        { key: 'date', header: 'Date' },
        { key: 'destination', header: 'Destination' },
        { key: 'item', header: 'Item' },
        { key: 'quantity', header: 'Quantity' },
        { key: 'unit', header: 'Unit' },
        { key: 'reason', header: 'Reason' },
      ]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Transfer Ledger</h1>
        <p className="text-muted-foreground text-xs sm:text-sm">Record items transferred to other locations</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">New Transfer</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Record a new item transfer</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-11 sm:h-9 text-base sm:text-xs")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />{format(date, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus className="pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Destination</Label>
                <Select value={destination} onValueChange={setDestination}>
                  <SelectTrigger className="h-11 sm:h-9 text-base sm:text-xs"><SelectValue placeholder="Select destination" /></SelectTrigger>
                  <SelectContent className="bg-background">
                    {DESTINATIONS.map(dest => <SelectItem key={dest} value={dest}>{dest}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Item</Label>
                <Select value={selectedItem} onValueChange={setSelectedItem}>
                  <SelectTrigger className="h-11 sm:h-9 text-base sm:text-xs"><SelectValue placeholder="Select item" /></SelectTrigger>
                  <SelectContent className="bg-background">
                    {items?.map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Quantity</Label>
                <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" className="h-11 sm:h-9 text-base sm:text-xs" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Reason (Optional)</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for transfer..." rows={2} className="text-base sm:text-xs min-h-[44px]" />
            </div>
            <Button type="submit" disabled={createTransfer.isPending || !selectedItem || !destination} className="w-full sm:w-auto h-11 sm:h-9 text-base sm:text-xs">
              <Plus className="mr-2 h-4 w-4" />Record Transfer
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base sm:text-lg">Transfer History</CardTitle>
            <CardDescription className="text-xs sm:text-sm">All recorded transfers</CardDescription>
          </div>
          <Button variant="outline" onClick={handleExport} disabled={!ledger?.length} className="w-full sm:w-auto h-11 sm:h-9 text-base sm:text-xs">
            <Download className="mr-2 h-4 w-4" />Export
          </Button>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
          {/* Mobile card list */}
          <div className="sm:hidden space-y-2">
            {!ledger?.length ? (
              <p className="text-center text-muted-foreground py-8 text-sm">No transfers recorded yet</p>
            ) : ledger.map(entry => (
              <div key={entry.id} className="rounded-lg border p-3 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm truncate">{entry.items?.name}</span>
                  <span className="text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full shrink-0">
                    {entry.quantity} {entry.items?.unit_of_measure}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(entry.date), 'PP')} · To: <strong className="text-foreground">{entry.destination}</strong>
                </div>
                {entry.reason && <p className="text-xs text-muted-foreground italic truncate">{entry.reason}</p>}
                <div className="flex justify-end pt-1 border-t">
                  <EditDeleteActions onEdit={() => openEdit(entry)} onDelete={() => deleteTransfer.mutate(entry.id)} isDeleting={deleteTransfer.isPending} />
                </div>
              </div>
            ))}
          </div>
          {/* Desktop table */}
          <div className="hidden sm:block rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Date</TableHead>
                  <TableHead className="whitespace-nowrap">Destination</TableHead>
                  <TableHead className="whitespace-nowrap">Item</TableHead>
                  <TableHead className="whitespace-nowrap">Quantity</TableHead>
                  <TableHead className="whitespace-nowrap">Reason</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledger?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No transfers recorded yet</TableCell>
                  </TableRow>
                ) : (
                  ledger?.map(entry => (
                    <TableRow key={entry.id}>
                      <TableCell className="whitespace-nowrap">{format(new Date(entry.date), 'PP')}</TableCell>
                      <TableCell className="whitespace-nowrap">{entry.destination}</TableCell>
                      <TableCell className="font-medium whitespace-nowrap">{entry.items?.name}</TableCell>
                      <TableCell className="whitespace-nowrap">{entry.quantity} {entry.items?.unit_of_measure}</TableCell>
                      <TableCell className="max-w-xs truncate">{entry.reason || '-'}</TableCell>
                      <TableCell>
                        <EditDeleteActions onEdit={() => openEdit(entry)} onDelete={() => deleteTransfer.mutate(entry.id)} isDeleting={deleteTransfer.isPending} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editingEntry} onOpenChange={(open) => !open && setEditingEntry(null)}>
        <DialogContent className="w-full h-full sm:h-auto sm:max-w-lg rounded-none sm:rounded-lg overflow-y-auto p-4 sm:p-6 flex flex-col justify-between">
          <div>
            <DialogHeader><DialogTitle className="text-xl">Edit Transfer</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal h-11 sm:h-9 text-base sm:text-sm">
                      <CalendarIcon className="mr-2 h-4 w-4" />{format(editDate, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={editDate} onSelect={(d) => d && setEditDate(d)} initialFocus className="pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Destination</Label>
                <Select value={editDest} onValueChange={setEditDest}>
                  <SelectTrigger className="h-11 sm:h-9 text-base sm:text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-background">
                    {DESTINATIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Item</Label>
                <Select value={editItem} onValueChange={setEditItem}>
                  <SelectTrigger className="h-11 sm:h-9 text-base sm:text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-background">
                    {items?.map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Quantity</Label>
                <Input type="number" value={editQty} onChange={(e) => setEditQty(e.target.value)} className="h-11 sm:h-9 text-base sm:text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Reason</Label>
                <Textarea value={editReason} onChange={(e) => setEditReason(e.target.value)} rows={2} className="text-base sm:text-sm min-h-[44px]" />
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setEditingEntry(null)} className="w-full sm:w-auto h-11 sm:h-9 text-base sm:text-xs">Cancel</Button>
            <Button onClick={handleEditSave} disabled={updateTransfer.isPending} className="w-full sm:w-auto h-11 sm:h-9 text-base sm:text-xs">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Transfers;
