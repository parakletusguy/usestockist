import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ItemSchema } from '@/lib/validation';


export interface Item {
  id: string;
  name: string;
  category: string;
  unit_of_measure: string;
  low_stock_threshold: number;
  unit_cost: number;
  created_at: string;
  updated_at: string;
}

export interface CreateItemInput {
  name: string;
  category: string;
  unit_of_measure: string;
  low_stock_threshold: number;
  unit_cost: number;
}

export function useItems() {
  return useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Item[];
    },
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CreateItemInput) => {
      const validated = ItemSchema.parse(input);
      const { data, error } = await supabase
        .from('items')
        .insert(validated)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast({ title: 'Success', description: 'Item created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...input }: CreateItemInput & { id: string }) => {
      const validated = ItemSchema.parse(input);
      const { data, error } = await supabase
        .from('items')
        .update(validated)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast({ title: 'Success', description: 'Item updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast({ title: 'Success', description: 'Item deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}
