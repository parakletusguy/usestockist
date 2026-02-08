import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

// Generic offline entry with a type discriminator
export interface OfflineWeeklyEntry {
  type: 'weekly_stock_count';
  id: string;
  date: string;
  location: string;
  item_id: string;
  physical_count: number;
  notes?: string;
  created_at: string;
}

export interface OfflineDailyEntry {
  type: 'daily_stock_sheet';
  id: string;
  date: string;
  retail_team_name: string;
  item_id: string;
  open_qty: number;
  qty_in: number;
  close_qty: number;
  sales_qty: number;
  reach?: string;
  os_status?: string;
  remark?: string;
  created_at: string;
}

export type OfflineEntry = OfflineWeeklyEntry | OfflineDailyEntry;

// Keep legacy key for backward compat, but store all types together
const OFFLINE_QUEUE_KEY = 'stockist_offline_queue';
const LEGACY_QUEUE_KEY = 'weekly_stock_counts_offline_queue';

function migrateLegacyQueue(): OfflineEntry[] {
  try {
    const legacy = localStorage.getItem(LEGACY_QUEUE_KEY);
    if (legacy) {
      const entries = JSON.parse(legacy) as Array<Omit<OfflineWeeklyEntry, 'type'>>;
      const migrated: OfflineEntry[] = entries.map(e => ({ ...e, type: 'weekly_stock_count' as const }));
      localStorage.removeItem(LEGACY_QUEUE_KEY);
      return migrated;
    }
  } catch { /* ignore */ }
  return [];
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const queryClient = useQueryClient();

  const getPendingEntries = useCallback((): OfflineEntry[] => {
    try {
      // Migrate legacy entries on first read
      const migrated = migrateLegacyQueue();
      const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
      const current: OfflineEntry[] = stored ? JSON.parse(stored) : [];
      if (migrated.length > 0) {
        const combined = [...current, ...migrated];
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(combined));
        return combined;
      }
      return current;
    } catch {
      return [];
    }
  }, []);

  const savePendingEntries = useCallback((entries: OfflineEntry[]) => {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(entries));
    setPendingCount(entries.length);
  }, []);

  // Add a weekly stock count entry
  const addWeeklyToQueue = useCallback((entry: Omit<OfflineWeeklyEntry, 'id' | 'created_at' | 'type'>) => {
    const entries = getPendingEntries();
    const newEntry: OfflineWeeklyEntry = {
      ...entry,
      type: 'weekly_stock_count',
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    entries.push(newEntry);
    savePendingEntries(entries);
    toast({ title: 'Saved offline', description: 'Will sync when connected' });
    return newEntry;
  }, [getPendingEntries, savePendingEntries]);

  // Add a daily stock sheet entry
  const addDailyToQueue = useCallback((entry: Omit<OfflineDailyEntry, 'id' | 'created_at' | 'type'>) => {
    const entries = getPendingEntries();
    const newEntry: OfflineDailyEntry = {
      ...entry,
      type: 'daily_stock_sheet',
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    entries.push(newEntry);
    savePendingEntries(entries);
    toast({ title: 'Saved offline', description: 'Will sync when connected' });
    return newEntry;
  }, [getPendingEntries, savePendingEntries]);

  // Legacy alias
  const addToQueue = addWeeklyToQueue;

  const syncPendingEntries = useCallback(async () => {
    const entries = getPendingEntries();
    if (entries.length === 0) return;

    setIsSyncing(true);
    const failedEntries: OfflineEntry[] = [];
    let successCount = 0;

    for (const entry of entries) {
      try {
        if (entry.type === 'weekly_stock_count') {
          const { error } = await supabase
            .from('weekly_stock_counts')
            .insert({
              date: entry.date,
              location: entry.location,
              item_id: entry.item_id,
              physical_count: entry.physical_count,
              notes: entry.notes,
            });
          if (error) { failedEntries.push(entry); } else { successCount++; }
        } else if (entry.type === 'daily_stock_sheet') {
          const { error } = await supabase
            .from('daily_stock_sheets')
            .insert({
              date: entry.date,
              retail_team_name: entry.retail_team_name,
              item_id: entry.item_id,
              open_qty: entry.open_qty,
              qty_in: entry.qty_in,
              close_qty: entry.close_qty,
              sales_qty: entry.sales_qty,
              reach: entry.reach,
              os_status: entry.os_status,
              remark: entry.remark,
            });
          if (error) { failedEntries.push(entry); } else { successCount++; }
        }
      } catch {
        failedEntries.push(entry);
      }
    }

    savePendingEntries(failedEntries);
    setIsSyncing(false);

    if (successCount > 0) {
      queryClient.invalidateQueries({ queryKey: ['weekly_stock_counts'] });
      queryClient.invalidateQueries({ queryKey: ['daily_stock_sheets'] });
      toast({
        title: 'Synced',
        description: `${successCount} offline ${successCount === 1 ? 'entry' : 'entries'} synced`,
      });
    }

    if (failedEntries.length > 0) {
      toast({
        title: 'Sync incomplete',
        description: `${failedEntries.length} ${failedEntries.length === 1 ? 'entry' : 'entries'} failed to sync`,
        variant: 'destructive',
      });
    }
  }, [getPendingEntries, savePendingEntries, queryClient]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({ title: 'Back online', description: 'Syncing pending entries...' });
      syncPendingEntries();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: 'Offline',
        description: 'Data will be saved locally',
        variant: 'destructive',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setPendingCount(getPendingEntries().length);

    if (navigator.onLine) {
      syncPendingEntries();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncPendingEntries, getPendingEntries]);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    addToQueue,
    addWeeklyToQueue,
    addDailyToQueue,
    getPendingEntries,
    syncPendingEntries,
  };
}
