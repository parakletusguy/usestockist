import { useState } from 'react';
import { format } from 'date-fns';
import { useItems } from '@/hooks/useItems';
import { useIssuanceLedger, useCreateIssuance, useUpdateIssuance, useDeleteIssuance, IssuanceLedger } from '@/hooks/useLedgers';
import { useAuth } from '@/contexts/AuthContext';
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

import { DEPARTMENTS } from '@/lib/validation';

const RECIPIENT_GROUPS = DEPARTMENTS;

const Issuance = () => {
  const { user } = useAuth();
  const [date, setDate] = useState<Date>(new Date());
  const [recipientGroup, setRecipientGroup] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [editingEntry, setEditingEntry] = useState<IssuanceLedger | null>(null);
  const [editDate, setEditDate] = useState<Date>(new Date());
  const [editGroup, setEditGroup] = useState('');
  const [editItem, setEditItem] = useState('');
  const [editQty, setEditQty] = useState('');

  const { data: items } = useItems();
  const { data: ledger, isLoading } = useIssuanceLedger();
  const createIssuance = useCreateIssuance();
  const updateIssuance = useUpdateIssuance();
  const deleteIssuance = useDeleteIssuance();

  const filteredLedger = ledger?.filter(entry => 
    filterGroup === 'all' || entry.recipient_group === filterGroup
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !quantity || !recipientGroup) return;

    await createIssuance.mutateAsync({
      date: format(date, 'yyyy-MM-dd'),
      recipient_group: recipientGroup,
      item_id: selectedItem,
      quantity: Number(quantity),
      issued_by: user?.email || 'Unknown',
    });

    setSelectedItem('');
    setQuantity('');
    setRecipientGroup('');
  };

  const openEdit = (entry: IssuanceLedger) => {
    setEditingEntry(entry);
    setEditDate(new Date(entry.date));
    setEditGroup(entry.recipient_group);
    setEditItem(entry.item_id);
    setEditQty(String(entry.quantity));
  };

  const handleEditSave = async () => {
    if (!editingEntry) return;
    await updateIssuance.mutateAsync({
      id: editingEntry.id,
      date: format(editDate, 'yyyy-MM-dd'),
      recipient_group: editGroup,
      item_id: editItem,
      quantity: Number(editQty),
    });
    setEditingEntry(null);
  };

  const handleExport = () => {
    if (!filteredLedger) return;
    exportToCSV(
      filteredLedger.map(entry => ({
        date: format(new Date(entry.date), 'yyyy-MM-dd'),
        recipient_group: entry.recipient_group,
        item: entry.items?.name || '',
        quantity: entry.quantity,
        unit: entry.items?.unit_of_measure || '',
        issued_by: entry.issued_by,
      })),
      'issuance_ledger',
      [
        { key: 'date', header: 'Date' },
        { key: 'recipient_group', header: 'Recipient Group' },
        { key: 'item', header: 'Item' },
        { key: 'quantity', header: 'Quantity' },
        { key: 'unit', header: 'Unit' },
        { key: 'issued_by', header: 'Issued By' },
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
        <h1 className="text-2xl sm:text-3xl font-bold">Issuance Ledger</h1>
        <p className="text-muted-foreground text-xs sm:text-sm">Record items issued to various groups</p>
      </div>

      {/* Entry Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">New Issuance</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Record a new item issuance</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-11 sm:h-9 text-base sm:text-xs")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(date, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus className="pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Recipient Group</Label>
                <Select value={recipientGroup} onValueChange={setRecipientGroup}>
                  <SelectTrigger className="h-11 sm:h-9 text-base sm:text-xs"><SelectValue placeholder="Select group" /></SelectTrigger>
                  <SelectContent className="bg-background">
                    {RECIPIENT_GROUPS.map(group => (
                      <SelectItem key={group} value={group}>{group}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Item</Label>
                <Select value={selectedItem} onValueChange={setSelectedItem}>
                  <SelectTrigger className="h-11 sm:h-9 text-base sm:text-xs"><SelectValue placeholder="Select item" /></SelectTrigger>
                  <SelectContent className="bg-background">
                    {items?.map(item => (
                      <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Quantity</Label>
                <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" className="h-11 sm:h-9 text-base sm:text-xs" required />
              </div>
            </div>
            <Button type="submit" disabled={createIssuance.isPending || !selectedItem || !recipientGroup} className="w-full sm:w-auto h-11 sm:h-9 text-base sm:text-xs">
              <Plus className="mr-2 h-4 w-4" />
              Record Issuance
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* History Table */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base sm:text-lg">Issuance History</CardTitle>
            <CardDescription className="text-xs sm:text-sm">All recorded issuances</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Select value={filterGroup} onValueChange={setFilterGroup}>
              <SelectTrigger className="w-full sm:w-[180px] h-11 sm:h-9 text-base sm:text-xs"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="all">All Groups</SelectItem>
                {RECIPIENT_GROUPS.map(group => (
                  <SelectItem key={group} value={group}>{group}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExport} disabled={!filteredLedger?.length} className="w-full sm:w-auto h-11 sm:h-9 text-base sm:text-xs">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Date</TableHead>
                  <TableHead className="whitespace-nowrap">Recipient</TableHead>
                  <TableHead className="whitespace-nowrap">Item</TableHead>
                  <TableHead className="whitespace-nowrap">Quantity</TableHead>
                  <TableHead className="whitespace-nowrap">Issued By</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLedger?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No issuances recorded yet
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLedger?.map(entry => (
                    <TableRow key={entry.id}>
                      <TableCell className="whitespace-nowrap">{format(new Date(entry.date), 'PP')}</TableCell>
                      <TableCell className="whitespace-nowrap">{entry.recipient_group}</TableCell>
                      <TableCell className="font-medium whitespace-nowrap">{entry.items?.name}</TableCell>
                      <TableCell className="whitespace-nowrap">{entry.quantity} {entry.items?.unit_of_measure}</TableCell>
                      <TableCell className="whitespace-nowrap">{entry.issued_by}</TableCell>
                      <TableCell>
                        <EditDeleteActions
                          onEdit={() => openEdit(entry)}
                          onDelete={() => deleteIssuance.mutate(entry.id)}
                          isDeleting={deleteIssuance.isPending}
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

      {/* Edit Dialog */}
      <Dialog open={!!editingEntry} onOpenChange={(open) => !open && setEditingEntry(null)}>
        <DialogContent className="w-full h-full sm:h-auto sm:max-w-lg rounded-none sm:rounded-lg overflow-y-auto p-4 sm:p-6 flex flex-col justify-between">
          <div>
            <DialogHeader>
              <DialogTitle className="text-xl">Edit Issuance</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal h-11 sm:h-9 text-base sm:text-sm">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(editDate, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={editDate} onSelect={(d) => d && setEditDate(d)} initialFocus className="pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Recipient Group</Label>
                <Select value={editGroup} onValueChange={setEditGroup}>
                  <SelectTrigger className="h-11 sm:h-9 text-base sm:text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-background">
                    {RECIPIENT_GROUPS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
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
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setEditingEntry(null)} className="w-full sm:w-auto h-11 sm:h-9 text-base sm:text-xs">Cancel</Button>
            <Button onClick={handleEditSave} disabled={updateIssuance.isPending} className="w-full sm:w-auto h-11 sm:h-9 text-base sm:text-xs">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Issuance;
