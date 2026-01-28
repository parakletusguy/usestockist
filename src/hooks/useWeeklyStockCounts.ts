import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface WeeklyStockCount {
  id: string;
  date: string;
  location: string;
  item_id: string;
  physical_count: number;
  notes: string | null;
  created_at: string;
  items?: {
    name: string;
    unit_of_measure: string;
  };
}

export interface CreateWeeklyStockCountInput {
  date: string;
  location: string;
  item_id: string;
  physical_count: number;
  notes?: string;
}

export function useWeeklyStockCounts(location?: string) {
  return useQuery({
    queryKey: ['weekly_stock_counts', location],
    queryFn: async () => {
      let query = supabase
        .from('weekly_stock_counts')
        .select('*, items(name, unit_of_measure)')
        .order('date', { ascending: false });
      
      if (location) {
        query = query.eq('location', location);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as WeeklyStockCount[];
    },
  });
}

export function useCreateWeeklyStockCount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CreateWeeklyStockCountInput) => {
      const { data, error } = await supabase
        .from('weekly_stock_counts')
        .insert(input)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly_stock_counts'] });
      toast({ title: 'Success', description: 'Stock count recorded' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}
