import { useState } from 'react';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { exportToCSV } from '@/lib/export';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarIcon, Wifi, WifiOff, RefreshCw, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import StockEntryTable from '@/components/daily-stock/StockEntryTable';

const TEAM_MEMBERS = [
  'Nene Spiff',
  'Roseline Ihuoma',
  'Ruth Deekae',
  'Chiamaka Akuwueze',
  'Raphael Favour',
  'Joy Chinenye',
  'Priye',
  'Chinasa',
  'Mercy'
];

type DateRangePreset = 'today' | 'this_week' | 'this_month' | 'custom';

const DailyStockSheet = () => {
  const [date, setDate] = useState<Date>(new Date());
  const { isOnline, isSyncing, pendingCount, syncPendingEntries } = useOfflineSync();

  // Export state
  const [exportPreset, setExportPreset] = useState<DateRangePreset>('today');
  const [exportFrom, setExportFrom] = useState<Date>(new Date());
  const [exportTo, setExportTo] = useState<Date>(new Date());
  const [isExporting, setIsExporting] = useState(false);

  const getExportDateRange = (): { from: string; to: string } => {
    const now = new Date();
    switch (exportPreset) {
      case 'today':
        return { from: format(startOfDay(now), 'yyyy-MM-dd'), to: format(endOfDay(now), 'yyyy-MM-dd') };
      case 'this_week':
        return { from: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'), to: format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd') };
      case 'this_month':
        return { from: format(startOfMonth(now), 'yyyy-MM-dd'), to: format(endOfMonth(now), 'yyyy-MM-dd') };
      case 'custom':
        return { from: format(exportFrom, 'yyyy-MM-dd'), to: format(exportTo, 'yyyy-MM-dd') };
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const { from, to } = getExportDateRange();
      const { data, error } = await supabase
        .from('daily_stock_sheets')
        .select('*, items(name, unit_of_measure)')
        .gte('date', from)
        .lte('date', to)
        .order('date', { ascending: true })
        .order('retail_team_name', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({ title: 'No data', description: 'No entries found for the selected date range' });
        return;
      }

      const exportData = data.map(row => ({
        date: row.date,
        team_member: row.retail_team_name,
        item: (row.items as any)?.name || '',
        unit: (row.items as any)?.unit_of_measure || '',
        open_qty: row.open_qty,
        qty_in: row.qty_in,
        close_qty: row.close_qty,
        sales_qty: row.sales_qty,
        reach: row.reach || '',
        os_status: row.os_status || '',
        remark: row.remark || '',
      }));

      exportToCSV(exportData, `daily_stock_${from}_to_${to}`, [
        { key: 'date', header: 'Date' },
        { key: 'team_member', header: 'Team Member' },
        { key: 'item', header: 'Item' },
        { key: 'unit', header: 'Unit' },
        { key: 'open_qty', header: 'Open Qty' },
        { key: 'qty_in', header: 'Qty In' },
        { key: 'close_qty', header: 'Close Qty' },
        { key: 'sales_qty', header: 'Sales Qty' },
        { key: 'reach', header: 'Reach' },
        { key: 'os_status', header: 'OS Status' },
        { key: 'remark', header: 'Remark' },
      ]);

      toast({ title: 'Exported', description: `${data.length} entries exported` });
    } catch (err: any) {
      toast({ title: 'Export failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Daily Stock Sheet</h1>
          <p className="text-muted-foreground">Record daily stock movements by retail team member</p>
        </div>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Badge variant="outline" className="gap-1">
              <Wifi className="h-3 w-3" />
              Online
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1">
              <WifiOff className="h-3 w-3" />
              Offline
            </Badge>
          )}
          {pendingCount > 0 && (
            <Badge variant="secondary" className="gap-1">
              {pendingCount} pending
              {isOnline && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => syncPendingEntries()}
                  disabled={isSyncing}
                >
                  <RefreshCw className={cn("h-3 w-3", isSyncing && "animate-spin")} />
                </Button>
              )}
            </Badge>
          )}
        </div>
      </div>

      {/* Date Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Date</CardTitle>
        </CardHeader>
        <CardContent>
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
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle>Export</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="space-y-2">
              <Label>Date Range</Label>
              <Select value={exportPreset} onValueChange={(v) => setExportPreset(v as DateRangePreset)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="this_week">This Week</SelectItem>
                  <SelectItem value="this_month">This Month</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {exportPreset === 'custom' && (
              <>
                <div className="space-y-2">
                  <Label>From</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full sm:w-[180px] justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(exportFrom, 'PPP')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={exportFrom}
                        onSelect={(d) => d && setExportFrom(d)}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>To</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full sm:w-[180px] justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(exportTo, 'PPP')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={exportTo}
                        onSelect={(d) => d && setExportTo(d)}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </>
            )}

            <Button onClick={handleExport} disabled={isExporting || !isOnline}>
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Team Member Tabs */}
      <Tabs defaultValue={TEAM_MEMBERS[0]} className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1">
          {TEAM_MEMBERS.map(member => (
            <TabsTrigger key={member} value={member} className="text-xs sm:text-sm">
              {member.split(' ')[0]}
            </TabsTrigger>
          ))}
        </TabsList>
        {TEAM_MEMBERS.map(member => (
          <TabsContent key={member} value={member}>
            <StockEntryTable date={date} teamMember={member} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default DailyStockSheet;
