import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface DailyStockSheet {
  id: string;
  date: string;
  retail_team_name: string;
  item_id: string;
  open_qty: number;
  qty_in: number;
  close_qty: number;
  sales_qty: number;
  reach: string | null;
  os_status: string | null;
  remark: string | null;
  created_at: string;
  updated_at: string;
  items?: {
    name: string;
    unit_of_measure: string;
  };
}

export interface CreateDailyStockSheetInput {
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
}

export function useDailyStockSheets(date?: string, team?: string) {
  return useQuery({
    queryKey: ['daily_stock_sheets', date, team],
    queryFn: async () => {
      let query = supabase
        .from('daily_stock_sheets')
        .select('*, items(name, unit_of_measure)')
        .order('created_at', { ascending: false });
      
      if (date) {
        query = query.eq('date', date);
      }
      if (team) {
        query = query.eq('retail_team_name', team);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as DailyStockSheet[];
    },
  });
}

export function useCreateDailyStockSheet() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CreateDailyStockSheetInput) => {
      const { data, error } = await supabase
        .from('daily_stock_sheets')
        .insert(input)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily_stock_sheets'] });
      toast({ title: 'Success', description: 'Stock sheet entry saved' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateDailyStockSheet() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...input }: CreateDailyStockSheetInput & { id: string }) => {
      const { data, error } = await supabase
        .from('daily_stock_sheets')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily_stock_sheets'] });
      toast({ title: 'Success', description: 'Stock sheet entry updated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteDailyStockSheet() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('daily_stock_sheets')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily_stock_sheets'] });
      toast({ title: 'Success', description: 'Entry deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}
