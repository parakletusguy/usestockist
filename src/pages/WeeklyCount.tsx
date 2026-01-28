import { useState } from 'react';
import { format } from 'date-fns';
import { useItems } from '@/hooks/useItems';
import { useWeeklyStockCounts, useCreateWeeklyStockCount } from '@/hooks/useWeeklyStockCounts';
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
import { CalendarIcon, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const LOCATIONS = ['Main Store', '24hr Store'];

const WeeklyCount = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [location, setLocation] = useState<string>('Main Store');
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [physicalCount, setPhysicalCount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [filterLocation, setFilterLocation] = useState<string>('all');

  const { data: items } = useItems();
  const { data: stockCounts, isLoading } = useWeeklyStockCounts(
    filterLocation === 'all' ? undefined : filterLocation
  );
  const createCount = useCreateWeeklyStockCount();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedItem || !physicalCount) return;

    await createCount.mutateAsync({
      date: format(date, 'yyyy-MM-dd'),
      location,
      item_id: selectedItem,
      physical_count: Number(physicalCount),
      notes: notes || undefined,
    });

    // Reset form
    setSelectedItem('');
    setPhysicalCount('');
    setNotes('');
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
        <h1 className="text-3xl font-bold">Weekly Stock Count</h1>
        <p className="text-muted-foreground">Record physical inventory counts by location</p>
      </div>

      {/* Entry Form */}
      <Card>
        <CardHeader>
          <CardTitle>New Stock Count</CardTitle>
          <CardDescription>Record a physical count for an item</CardDescription>
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
                <Label>Location</Label>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    {LOCATIONS.map(loc => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
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
                <Label>Physical Count</Label>
                <Input
                  type="number"
                  value={physicalCount}
                  onChange={(e) => setPhysicalCount(e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any observations or notes..."
                rows={2}
              />
            </div>

            <Button type="submit" disabled={createCount.isPending || !selectedItem}>
              <Plus className="mr-2 h-4 w-4" />
              Record Count
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* History Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Count History</CardTitle>
            <CardDescription>Previous physical counts</CardDescription>
          </div>
          <Select value={filterLocation} onValueChange={setFilterLocation}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background">
              <SelectItem value="all">All Locations</SelectItem>
              {LOCATIONS.map(loc => (
                <SelectItem key={loc} value={loc}>{loc}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Count</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockCounts?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No counts recorded yet
                  </TableCell>
                </TableRow>
              ) : (
                stockCounts?.map(count => (
                  <TableRow key={count.id}>
                    <TableCell>{format(new Date(count.date), 'PP')}</TableCell>
                    <TableCell>{count.location}</TableCell>
                    <TableCell>{count.items?.name}</TableCell>
                    <TableCell>{count.physical_count} {count.items?.unit_of_measure}</TableCell>
                    <TableCell className="max-w-xs truncate">{count.notes || '-'}</TableCell>
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

export default WeeklyCount;
