import { useState } from 'react';
import { format } from 'date-fns';
import { useItems } from '@/hooks/useItems';
import { useReceivedLedger, useCreateReceived, useUpdateReceived, useDeleteReceived, ReceivedLedger } from '@/hooks/useLedgers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

const Received = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [supplier, setSupplier] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [editingEntry, setEditingEntry] = useState<ReceivedLedger | null>(null);
  const [editDate, setEditDate] = useState<Date>(new Date());
  const [editSupplier, setEditSupplier] = useState('');
  const [editItem, setEditItem] = useState('');
  const [editQty, setEditQty] = useState('');
  const [editInvoice, setEditInvoice] = useState('');

  const { data: items } = useItems();
  const { data: ledger, isLoading } = useReceivedLedger();
  const createReceived = useCreateReceived();
  const updateReceived = useUpdateReceived();
  const deleteReceived = useDeleteReceived();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !quantity || !supplier) return;
    await createReceived.mutateAsync({
      date: format(date, 'yyyy-MM-dd'),
      supplier,
      item_id: selectedItem,
      quantity: Number(quantity),
      invoice_number: invoiceNumber || undefined,
    });
    setSelectedItem('');
    setQuantity('');
    setSupplier('');
    setInvoiceNumber('');
  };

  const openEdit = (entry: ReceivedLedger) => {
    setEditingEntry(entry);
    setEditDate(new Date(entry.date));
    setEditSupplier(entry.supplier);
    setEditItem(entry.item_id);
    setEditQty(String(entry.quantity));
    setEditInvoice(entry.invoice_number || '');
  };

  const handleEditSave = async () => {
    if (!editingEntry) return;
    await updateReceived.mutateAsync({
      id: editingEntry.id,
      date: format(editDate, 'yyyy-MM-dd'),
      supplier: editSupplier,
      item_id: editItem,
      quantity: Number(editQty),
      invoice_number: editInvoice || undefined,
    });
    setEditingEntry(null);
  };

  const handleExport = () => {
    if (!ledger) return;
    exportToCSV(
      ledger.map(entry => ({
        date: format(new Date(entry.date), 'yyyy-MM-dd'),
        supplier: entry.supplier,
        item: entry.items?.name || '',
        quantity: entry.quantity,
        unit: entry.items?.unit_of_measure || '',
        invoice_number: entry.invoice_number || '',
      })),
      'received_ledger',
      [
        { key: 'date', header: 'Date' },
        { key: 'supplier', header: 'Supplier' },
        { key: 'item', header: 'Item' },
        { key: 'quantity', header: 'Quantity' },
        { key: 'unit', header: 'Unit' },
        { key: 'invoice_number', header: 'Invoice Number' },
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
        <h1 className="text-2xl sm:text-3xl font-bold">Received Ledger</h1>
        <p className="text-muted-foreground text-xs sm:text-sm">Record items received from suppliers</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">New Receipt</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Record items received from a supplier</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
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
                <Label className="text-xs">Supplier</Label>
                <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Supplier name" className="h-11 sm:h-9 text-base sm:text-xs" required />
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
              <div className="space-y-1.5">
                <Label className="text-xs">Invoice # (Optional)</Label>
                <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="INV-001" className="h-11 sm:h-9 text-base sm:text-xs" />
              </div>
            </div>
            <Button type="submit" disabled={createReceived.isPending || !selectedItem || !supplier} className="w-full sm:w-auto h-11 sm:h-9 text-base sm:text-xs">
              <Plus className="mr-2 h-4 w-4" />Record Receipt
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base sm:text-lg">Receipt History</CardTitle>
            <CardDescription className="text-xs sm:text-sm">All recorded receipts</CardDescription>
          </div>
          <Button variant="outline" onClick={handleExport} disabled={!ledger?.length} className="w-full sm:w-auto h-11 sm:h-9 text-base sm:text-xs">
            <Download className="mr-2 h-4 w-4" />Export
          </Button>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Date</TableHead>
                  <TableHead className="whitespace-nowrap">Supplier</TableHead>
                  <TableHead className="whitespace-nowrap">Item</TableHead>
                  <TableHead className="whitespace-nowrap">Quantity</TableHead>
                  <TableHead className="whitespace-nowrap">Invoice #</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledger?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No receipts recorded yet</TableCell>
                  </TableRow>
                ) : (
                  ledger?.map(entry => (
                    <TableRow key={entry.id}>
                      <TableCell className="whitespace-nowrap">{format(new Date(entry.date), 'PP')}</TableCell>
                      <TableCell className="whitespace-nowrap">{entry.supplier}</TableCell>
                      <TableCell className="font-medium whitespace-nowrap">{entry.items?.name}</TableCell>
                      <TableCell className="whitespace-nowrap">{entry.quantity} {entry.items?.unit_of_measure}</TableCell>
                      <TableCell className="whitespace-nowrap">{entry.invoice_number || '-'}</TableCell>
                      <TableCell>
                        <EditDeleteActions
                          onEdit={() => openEdit(entry)}
                          onDelete={() => deleteReceived.mutate(entry.id)}
                          isDeleting={deleteReceived.isPending}
                        />
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
            <DialogHeader><DialogTitle className="text-xl">Edit Receipt</DialogTitle></DialogHeader>
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
                <Label className="text-sm">Supplier</Label>
                <Input value={editSupplier} onChange={(e) => setEditSupplier(e.target.value)} className="h-11 sm:h-9 text-base sm:text-sm" />
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
                <Label className="text-sm">Invoice #</Label>
                <Input value={editInvoice} onChange={(e) => setEditInvoice(e.target.value)} className="h-11 sm:h-9 text-base sm:text-sm" />
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setEditingEntry(null)} className="w-full sm:w-auto h-11 sm:h-9 text-base sm:text-xs">Cancel</Button>
            <Button onClick={handleEditSave} disabled={updateReceived.isPending} className="w-full sm:w-auto h-11 sm:h-9 text-base sm:text-xs">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Received;
