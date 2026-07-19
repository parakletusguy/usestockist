import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

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

export type OfflineEntry = OfflineWeeklyEntry;

const OFFLINE_QUEUE_KEY = 'stockist_offline_queue';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const queryClient = useQueryClient();

  const getPendingEntries = useCallback((): OfflineEntry[] => {
    try {
      const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, []);

  const savePendingEntries = useCallback((entries: OfflineEntry[]) => {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(entries));
    setPendingCount(entries.length);
  }, []);

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

  const syncPendingEntries = useCallback(async () => {
    const entries = getPendingEntries();
    if (entries.length === 0) return;

    setIsSyncing(true);
    const failedEntries: OfflineEntry[] = [];
    let successCount = 0;

    for (const entry of entries) {
      try {
        if (entry.type === 'weekly_stock_count') {
          const { error } = await supabase.from('weekly_stock_counts').insert({
            date: entry.date,
            location: entry.location,
            item_id: entry.item_id,
            physical_count: entry.physical_count,
            notes: entry.notes ?? null,
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
    addWeeklyToQueue,
    getPendingEntries,
    syncPendingEntries,
  };
}
