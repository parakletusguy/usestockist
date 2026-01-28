import { useState } from 'react';
import { format } from 'date-fns';
import { useItems } from '@/hooks/useItems';
import { useTransferLedger, useCreateTransfer } from '@/hooks/useLedgers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

const DESTINATIONS = ['Sister Branch', 'Partner Business', 'Warehouse', 'Other'];

const Transfers = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [destination, setDestination] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [reason, setReason] = useState<string>('');

  const { data: items } = useItems();
  const { data: ledger, isLoading } = useTransferLedger();
  const createTransfer = useCreateTransfer();

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

    // Reset form
    setSelectedItem('');
    setQuantity('');
    setDestination('');
    setReason('');
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Transfer Ledger</h1>
        <p className="text-muted-foreground">Record items transferred to other locations</p>
      </div>

      {/* Entry Form */}
      <Card>
        <CardHeader>
          <CardTitle>New Transfer</CardTitle>
          <CardDescription>Record a new item transfer</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                <Label>Destination</Label>
                <Select value={destination} onValueChange={setDestination}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    {DESTINATIONS.map(dest => (
                      <SelectItem key={dest} value={dest}>{dest}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            </div>

            <div className="space-y-2">
              <Label>Reason (Optional)</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for transfer..."
                rows={2}
              />
            </div>

            <Button type="submit" disabled={createTransfer.isPending || !selectedItem || !destination}>
              <Plus className="mr-2 h-4 w-4" />
              Record Transfer
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* History Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Transfer History</CardTitle>
            <CardDescription>All recorded transfers</CardDescription>
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
                <TableHead>Destination</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ledger?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No transfers recorded yet
                  </TableCell>
                </TableRow>
              ) : (
                ledger?.map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell>{format(new Date(entry.date), 'PP')}</TableCell>
                    <TableCell>{entry.destination}</TableCell>
                    <TableCell>{entry.items?.name}</TableCell>
                    <TableCell>{entry.quantity} {entry.items?.unit_of_measure}</TableCell>
                    <TableCell className="max-w-xs truncate">{entry.reason || '-'}</TableCell>
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

export default Transfers;
