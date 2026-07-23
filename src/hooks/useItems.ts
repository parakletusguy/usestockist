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
      // 1. Fetch catalog items (primary query)
      const { data: itemData, error: itemError } = await supabase
        .from('items')
        .select('*')
        .order('name');

      if (itemError) {
        console.error('Error fetching items:', itemError);
        throw itemError;
      }

      // Optional department mapping table — silently skip if not provisioned
      const deptData: { item_id: string; department: string }[] = [];


      // Build map of item_id -> departments[]
      const deptMap = new Map<string, string[]>();
      deptData.forEach((row) => {
        const existing = deptMap.get(row.item_id) || [];
        existing.push(row.department);
        deptMap.set(row.item_id, existing);
      });

      const items = (itemData || []).map((item) => ({
        ...item,
        departments: deptMap.get(item.id)?.length
          ? deptMap.get(item.id)
          : [item.department || 'Retail'],
      })) as Item[];

      // Filter by department if specified
      if (departmentFilter && departmentFilter !== 'all') {
        return items.filter(item =>
          item.departments?.includes(departmentFilter) || item.department === departmentFilter
        );
      }

      return items;
    },
  });
}

async function syncItemDepartments(_itemId: string, _departments: string[]) {
  // item_departments table not provisioned — skip silently.
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
        .insert({ ...validated, department: primaryDept })
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
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['stock_count'] });
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
        .update({ ...validated, department: primaryDept })
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
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['stock_count'] });
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
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['stock_count'] });
      toast({ title: 'Success', description: 'Item deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}
