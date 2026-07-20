import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { WeeklyStockCountSchema } from '@/lib/validation';


export interface WeeklyStockCount {
  id: string;
  date: string;
  location: string;
  item_id: string;
  physical_count: number;
  notes: string | null;
  created_at: string;
  items?: { name: string; unit_of_measure: string };
}

export interface CreateWeeklyStockCountInput {
  date: string;
  location: string;
  item_id: string;
  physical_count: number;
  notes?: string;
}

export function useWeeklyStockCounts(location?: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['weekly_stock_counts', location, startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('weekly_stock_counts')
        .select('*, items(name, unit_of_measure)')
        .order('date', { ascending: false });
      if (location) query = query.eq('location', location);
      if (startDate) query = query.gte('date', startDate);
      if (endDate) query = query.lte('date', endDate);
      const { data, error } = await query;
      if (error) throw error;
      return data as WeeklyStockCount[];
    },
  });
}

export function useCreateWeeklyStockCount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateWeeklyStockCountInput) => {
      const validated = WeeklyStockCountSchema.parse(input);
      const { data, error } = await supabase.from('weekly_stock_counts').insert(validated).select().single();
      if (error) throw error;
      return data;
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['weekly_stock_counts'] });
      toast({ title: 'Success', description: 'Stock count recorded' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useUpdateWeeklyStockCount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<CreateWeeklyStockCountInput> & { id: string }) => {
      const validated = WeeklyStockCountSchema.partial().parse(input);
      const { data, error } = await supabase.from('weekly_stock_counts').update(validated).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['weekly_stock_counts'] });
      toast({ title: 'Success', description: 'Stock count updated' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useDeleteWeeklyStockCount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('weekly_stock_counts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['weekly_stock_counts'] });
      toast({ title: 'Success', description: 'Stock count deleted' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}
