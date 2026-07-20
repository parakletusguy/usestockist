import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { saveDailyStockEntries, DailyStockEntryInput } from '@/hooks/useDailyStockCount';

export interface OfflineDailyStockEntry extends DailyStockEntryInput {
  id: string;
  created_at: string;
}

export type OfflineEntry = OfflineDailyStockEntry;

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

  const addToQueue = useCallback((entry: DailyStockEntryInput) => {
    const entries = getPendingEntries();
    const newEntry: OfflineDailyStockEntry = {
      ...entry,
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
        await saveDailyStockEntries([entry]);
        successCount++;
      } catch {
        failedEntries.push(entry);
      }
    }

    savePendingEntries(failedEntries);
    setIsSyncing(false);

    if (successCount > 0) {
      queryClient.invalidateQueries({ queryKey: ['daily_stock_count'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
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
    getPendingEntries,
    syncPendingEntries,
  };
}
