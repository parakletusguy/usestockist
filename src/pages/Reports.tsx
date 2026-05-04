import { useState } from 'react';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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

type DateRangePreset = 'today' | 'this_week' | 'this_month' | 'custom';

const Reports = () => {
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
      
      const { data, error } = await supabase.functions.invoke('generate-inventory-report', {
        body: { startDate: from, endDate: to }
      });

      if (error) throw error;

      if (!data) {
        throw new Error('No data received from export function');
      }

      // Create a download link for the blob returned by the Edge Function
      const url = window.URL.createObjectURL(data as Blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Inventory_Report_${from}_to_${to}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({ title: 'Exported', description: `Inventory report exported successfully` });
    } catch (err: any) {
      console.error('Export error:', err);
      toast({ title: 'Export failed', description: err.message || 'An error occurred during export', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">Generate and export inventory ledgers and reports</p>
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

      <Card>
        <CardHeader>
          <CardTitle>Export Inventory Ledger</CardTitle>
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

            <Button onClick={handleExport} disabled={isExporting || !isOnline} className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? 'Generating Report...' : 'Download Excel Report'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
