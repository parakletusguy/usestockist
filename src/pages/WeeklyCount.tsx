import { useState } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { useItems } from '@/hooks/useItems';
import { useWeeklyStockCounts, useCreateWeeklyStockCount, useDeleteWeeklyStockCount } from '@/hooks/useWeeklyStockCounts';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { exportToCSV } from '@/lib/export';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CalendarIcon, Plus, Trash2, Download, Wifi, WifiOff, CloudOff } from 'lucide-react';
import { cn } from '@/lib/utils';

const LOCATIONS = ['Main Store', '24hr Store', 'Cube'];

type DateRangeType = 'all' | 'day' | 'week' | 'month' | 'custom';

const WeeklyCount = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [location, setLocation] = useState<string>('Main Store');
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [physicalCount, setPhysicalCount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [filterLocation, setFilterLocation] = useState<string>('all');
  
  // Date range for export/filter
  const [dateRangeType, setDateRangeType] = useState<DateRangeType>('all');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();

  const { data: items } = useItems();
  const { isOnline, isSyncing, pendingCount, addToQueue } = useOfflineSync();
  
  // Calculate date range based on selection
  const getDateRange = () => {
    const today = new Date();
    switch (dateRangeType) {
      case 'day':
        const dayStr = format(today, 'yyyy-MM-dd');
        return { startDate: dayStr, endDate: dayStr };
      case 'week':
        return {
          startDate: format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
          endDate: format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        };
      case 'month':
        return {
          startDate: format(startOfMonth(today), 'yyyy-MM-dd'),
          endDate: format(endOfMonth(today), 'yyyy-MM-dd'),
        };
      case 'custom':
        return {
          startDate: customStartDate ? format(customStartDate, 'yyyy-MM-dd') : undefined,
          endDate: customEndDate ? format(customEndDate, 'yyyy-MM-dd') : undefined,
        };
      default:
        return { startDate: undefined, endDate: undefined };
    }
  };

  const { startDate, endDate } = getDateRange();
  
  const { data: stockCounts, isLoading } = useWeeklyStockCounts(
    filterLocation === 'all' ? undefined : filterLocation,
    startDate,
    endDate
  );
  const createCount = useCreateWeeklyStockCount();
  const deleteCount = useDeleteWeeklyStockCount();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedItem || !physicalCount) return;

    const entryData = {
      date: format(date, 'yyyy-MM-dd'),
      location,
      item_id: selectedItem,
      physical_count: Number(physicalCount),
      notes: notes || undefined,
    };

    if (!isOnline) {
      // Save to offline queue
      addToQueue(entryData);
    } else {
      await createCount.mutateAsync(entryData);
    }

    // Reset form
    setSelectedItem('');
    setPhysicalCount('');
    setNotes('');
  };

  const handleDelete = async (id: string) => {
    await deleteCount.mutateAsync(id);
  };

  const handleExport = () => {
    if (!stockCounts || stockCounts.length === 0) return;

    const exportData = stockCounts.map(count => ({
      date: format(new Date(count.date), 'yyyy-MM-dd'),
      location: count.location,
      item: count.items?.name || '',
      physical_count: count.physical_count,
      unit: count.items?.unit_of_measure || '',
      notes: count.notes || '',
    }));

    const rangeLabel = dateRangeType === 'all' ? 'all' : 
      dateRangeType === 'custom' ? `${startDate}_to_${endDate}` :
      dateRangeType;

    exportToCSV(exportData, `weekly_stock_counts_${rangeLabel}`, [
      { key: 'date', header: 'Date' },
      { key: 'location', header: 'Location' },
      { key: 'item', header: 'Item' },
      { key: 'physical_count', header: 'Count' },
      { key: 'unit', header: 'Unit' },
      { key: 'notes', header: 'Notes' },
    ]);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Weekly Stock Count</h1>
          <p className="text-muted-foreground">Record physical inventory counts by location</p>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <CloudOff className="h-4 w-4" />
              <span>{pendingCount} pending</span>
            </div>
          )}
          {isOnline ? (
            <div className="flex items-center gap-1 text-sm text-green-600">
              <Wifi className="h-4 w-4" />
              <span className="hidden sm:inline">Online</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-sm text-destructive">
              <WifiOff className="h-4 w-4" />
              <span className="hidden sm:inline">Offline</span>
            </div>
          )}
        </div>
      </div>

      {/* Entry Form */}
      <Card>
        <CardHeader>
          <CardTitle>New Stock Count</CardTitle>
          <CardDescription>
            Record a physical count for an item
            {!isOnline && <span className="text-destructive ml-2">(Saving locally)</span>}
          </CardDescription>
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

            <Button type="submit" disabled={createCount.isPending || isSyncing || !selectedItem}>
              <Plus className="mr-2 h-4 w-4" />
              Record Count
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* History Table */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Count History</CardTitle>
            <CardDescription>Previous physical counts</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Date Range Filter */}
            <Select value={dateRangeType} onValueChange={(v) => setDateRangeType(v as DateRangeType)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="day">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>

            {dateRangeType === 'custom' && (
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-[110px]">
                      <CalendarIcon className="mr-1 h-3 w-3" />
                      {customStartDate ? format(customStartDate, 'MMM d') : 'Start'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={customStartDate}
                      onSelect={setCustomStartDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <span className="text-muted-foreground">to</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-[110px]">
                      <CalendarIcon className="mr-1 h-3 w-3" />
                      {customEndDate ? format(customEndDate, 'MMM d') : 'End'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={customEndDate}
                      onSelect={setCustomEndDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Location Filter */}
            <Select value={filterLocation} onValueChange={setFilterLocation}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="all">All Locations</SelectItem>
                {LOCATIONS.map(loc => (
                  <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Export Button */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExport}
              disabled={!stockCounts || stockCounts.length === 0}
            >
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
                <TableHead>Location</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Count</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockCounts?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
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
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete this stock count entry. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(count.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
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
