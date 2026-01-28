import { useState } from 'react';
import { format } from 'date-fns';
import { useItems } from '@/hooks/useItems';
import { useReceivedLedger, useCreateReceived } from '@/hooks/useLedgers';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CalendarIcon, Plus, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportToCSV } from '@/lib/export';

const Received = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [supplier, setSupplier] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');

  const { data: items } = useItems();
  const { data: ledger, isLoading } = useReceivedLedger();
  const createReceived = useCreateReceived();

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

    // Reset form
    setSelectedItem('');
    setQuantity('');
    setSupplier('');
    setInvoiceNumber('');
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Received Ledger</h1>
        <p className="text-muted-foreground">Record items received from suppliers</p>
      </div>

      {/* Entry Form */}
      <Card>
        <CardHeader>
          <CardTitle>New Receipt</CardTitle>
          <CardDescription>Record items received from a supplier</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
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
                <Label>Supplier</Label>
                <Input
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="Supplier name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Item</Label>
                <Select value={selectedItem} onValueChange={setSelectedItem}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select item" />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    {items?.map(item => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Invoice # (Optional)</Label>
                <Input
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="INV-001"
                />
              </div>
            </div>

            <Button type="submit" disabled={createReceived.isPending || !selectedItem || !supplier}>
              <Plus className="mr-2 h-4 w-4" />
              Record Receipt
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* History Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Receipt History</CardTitle>
            <CardDescription>All recorded receipts</CardDescription>
          </div>
          <Button variant="outline" onClick={handleExport} disabled={!ledger?.length}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Invoice #</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ledger?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No receipts recorded yet
                  </TableCell>
                </TableRow>
              ) : (
                ledger?.map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell>{format(new Date(entry.date), 'PP')}</TableCell>
                    <TableCell>{entry.supplier}</TableCell>
                    <TableCell>{entry.items?.name}</TableCell>
                    <TableCell>{entry.quantity} {entry.items?.unit_of_measure}</TableCell>
                    <TableCell>{entry.invoice_number || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Received;
