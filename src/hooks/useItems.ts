import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ItemSchema } from '@/lib/validation';

export interface Item {
  id: string;
  name: string;
  category: string;
  department: string;
  departments?: string[];  // from item_departments junction
  unit_of_measure: string;
  low_stock_threshold: number;
  unit_cost: number;
  created_at: string;
  updated_at: string;
}

export interface CreateItemInput {
  name: string;
  category: string;
  department?: string;
  departments?: string[];  // multi-department assignment
  unit_of_measure: string;
  low_stock_threshold: number;
  unit_cost: number;
}

export function useItems(departmentFilter?: string) {
  return useQuery({
    queryKey: ['items', departmentFilter || 'all'],
    queryFn: async () => {
      // Execute both queries concurrently for maximum speed
      const [{ data: itemData, error: itemError }, { data: deptData, error: deptError }] = await Promise.all([
        supabase.from('items').select('*').order('name'),
        (supabase as any).from('item_departments').select('item_id, department'),
      ]);

      if (itemError) throw itemError;
      if (deptError) throw deptError;

      // Build a map of item_id -> departments[]
      const deptMap = new Map<string, string[]>();
      (deptData || []).forEach((row: { item_id: string; department: string }) => {
        const existing = deptMap.get(row.item_id) || [];
        existing.push(row.department);
        deptMap.set(row.item_id, existing);
      });

      const items = (itemData || []).map((item: any) => ({
        ...item,
        departments: deptMap.get(item.id) || [item.department || 'Retail'],
      })) as Item[];

      // Filter by department if specified
      if (departmentFilter && departmentFilter !== 'all') {
        return items.filter(item =>
          item.departments?.includes(departmentFilter) || item.department === departmentFilter
        );
      }

      return items;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes for instant navigation
  });
}

async function syncItemDepartments(itemId: string, departments: string[]) {
  // Delete existing assignments for this item
  await (supabase as any).from('item_departments').delete().eq('item_id', itemId);

  if (departments.length === 0) return;

  // Insert new assignments
  const rows = departments.map(dept => ({ item_id: itemId, department: dept }));
  const { error } = await (supabase as any).from('item_departments').insert(rows);
  if (error) throw error;
}

export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateItemInput) => {
      const { departments, ...rest } = input;
      const validated = ItemSchema.parse(rest);

      // Use first department as primary
      const primaryDept = departments?.[0] || input.department || 'Retail';

      const { data, error } = await supabase
        .from('items')
        .insert({ ...validated as any, department: primaryDept })
        .select()
        .single();

      if (error) throw error;

      // Sync department assignments
      if (departments && departments.length > 0) {
        await syncItemDepartments(data.id, departments);
      }

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
    mutationFn: async ({ id, departments, ...input }: CreateItemInput & { id: string }) => {
      const validated = ItemSchema.parse(input);
      const primaryDept = departments?.[0] || input.department || 'Retail';

      const { data, error } = await supabase
        .from('items')
        .update({ ...validated as any, department: primaryDept })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Sync department assignments
      if (departments && departments.length > 0) {
        await syncItemDepartments(id, departments);
      }

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
      const { error } = await supabase.from('items').delete().eq('id', id);
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
