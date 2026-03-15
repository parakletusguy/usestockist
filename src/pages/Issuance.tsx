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

const RECIPIENT_GROUPS = ['Retail', 'Housekeeping', 'Managers', 'Cube', 'Bar'];

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Issuance Ledger</h1>
        <p className="text-muted-foreground">Record items issued to various groups</p>
      </div>

      {/* Entry Form */}
      <Card>
        <CardHeader>
          <CardTitle>New Issuance</CardTitle>
          <CardDescription>Record a new item issuance</CardDescription>
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
                    <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus className="pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Recipient Group</Label>
                <Select value={recipientGroup} onValueChange={setRecipientGroup}>
                  <SelectTrigger><SelectValue placeholder="Select group" /></SelectTrigger>
                  <SelectContent className="bg-background">
                    {RECIPIENT_GROUPS.map(group => (
                      <SelectItem key={group} value={group}>{group}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Item</Label>
                <Select value={selectedItem} onValueChange={setSelectedItem}>
                  <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                  <SelectContent className="bg-background">
                    {items?.map(item => (
                      <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" required />
              </div>
            </div>
            <Button type="submit" disabled={createIssuance.isPending || !selectedItem || !recipientGroup}>
              <Plus className="mr-2 h-4 w-4" />
              Record Issuance
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* History Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Issuance History</CardTitle>
            <CardDescription>All recorded issuances</CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={filterGroup} onValueChange={setFilterGroup}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="all">All Groups</SelectItem>
                {RECIPIENT_GROUPS.map(group => (
                  <SelectItem key={group} value={group}>{group}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExport} disabled={!filteredLedger?.length}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Issued By</TableHead>
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
                    <TableCell>{format(new Date(entry.date), 'PP')}</TableCell>
                    <TableCell>{entry.recipient_group}</TableCell>
                    <TableCell>{entry.items?.name}</TableCell>
                    <TableCell>{entry.quantity} {entry.items?.unit_of_measure}</TableCell>
                    <TableCell>{entry.issued_by}</TableCell>
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
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingEntry} onOpenChange={(open) => !open && setEditingEntry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Issuance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(editDate, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={editDate} onSelect={(d) => d && setEditDate(d)} initialFocus className="pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Recipient Group</Label>
              <Select value={editGroup} onValueChange={setEditGroup}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="bg-background">
                  {RECIPIENT_GROUPS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Item</Label>
              <Select value={editItem} onValueChange={setEditItem}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="bg-background">
                  {items?.map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input type="number" value={editQty} onChange={(e) => setEditQty(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingEntry(null)}>Cancel</Button>
            <Button onClick={handleEditSave} disabled={updateIssuance.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Issuance;
