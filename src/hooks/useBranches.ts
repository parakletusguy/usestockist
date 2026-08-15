import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Branch } from '@/contexts/BranchContext';

export interface UserBranchAssignment {
  id: string;
  user_id: string;
  branch_id: string;
  is_default: boolean;
  branches?: Branch;
}

export function useBranches() {
  return useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .order('name');
      if (error) throw error;
      return (data ?? []) as Branch[];
    },
    staleTime: 1000 * 60 * 5, // 5 min cache
  });
}

export function useCreateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('branches')
        .insert({ name, is_active: true })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['branches'] });
      toast({ title: 'Success', description: 'Branch created successfully' });
    },
    onError: (e: Error) => {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    },
  });
}

export function useUpdateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<Branch> & { id: string }) => {
      const { data, error } = await supabase
        .from('branches')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['branches'] });
      toast({ title: 'Success', description: 'Branch updated successfully' });
    },
    onError: (e: Error) => {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    },
  });
}

export function useUserBranches(userId?: string) {
  return useQuery({
    queryKey: ['user_branches', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_branches')
        .select('*, branches(*)')
        .eq('user_id', userId!);
      if (error) throw error;
      return (data ?? []) as UserBranchAssignment[];
    },
  });
}

export function useAssignUserBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, branchId, isDefault = false }: { userId: string; branchId: string; isDefault?: boolean }) => {
      const { data, error } = await supabase
        .from('user_branches')
        .insert({ user_id: userId, branch_id: branchId, is_default: isDefault })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['user_branches', variables.userId] });
      toast({ title: 'Success', description: 'User assigned to branch' });
    },
    onError: (e: Error) => {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    },
  });
}

export function useRemoveUserBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, branchId }: { userId: string; branchId: string }) => {
      const { error } = await supabase
        .from('user_branches')
        .delete()
        .eq('user_id', userId)
        .eq('branch_id', branchId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['user_branches', variables.userId] });
      toast({ title: 'Success', description: 'User removed from branch' });
    },
    onError: (e: Error) => {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    },
  });
}
