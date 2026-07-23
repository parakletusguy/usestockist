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

      // 2. Fetch department mappings from item_departments table safely
      let deptData: { item_id: string; department: string }[] = [];
      try {
        const { data, error } = await (supabase as any)
          .from('item_departments')
          .select('item_id, department');
        
        if (!error && data) {
          deptData = data;
        }
      } catch (err) {
        console.warn('item_departments fetch notice:', err);
      }

      // Build map of item_id -> departments[]
      const deptMap = new Map<string, string[]>();
      deptData.forEach((row) => {
        const existing = deptMap.get(row.item_id) || [];
        if (!existing.includes(row.department)) {
          existing.push(row.department);
        }
        deptMap.set(row.item_id, existing);
      });

      const items = (itemData || []).map((item) => {
        const deptsFromJunction = deptMap.get(item.id);
        const departments = deptsFromJunction && deptsFromJunction.length > 0
          ? deptsFromJunction
          : [item.department || 'Retail'];
        return {
          ...item,
          departments,
        };
      }) as Item[];

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

async function syncItemDepartments(itemId: string, departments: string[]) {
  try {
    // Delete existing assignments for this item
    await (supabase as any).from('item_departments').delete().eq('item_id', itemId);

    if (!departments || departments.length === 0) return;

    // Insert new assignments
    const rows = departments.map(dept => ({ item_id: itemId, department: dept }));
    const { error } = await (supabase as any).from('item_departments').insert(rows);
    if (error) {
      console.warn('Error saving to item_departments:', error);
    }
  } catch (err) {
    console.warn('syncItemDepartments notice:', err);
  }
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
