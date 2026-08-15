import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useBranches,
  useCreateBranch,
  useUpdateBranch,
  useUserBranches,
  useAssignUserBranch,
  useRemoveUserBranch,
} from '@/hooks/useBranches';
import { mockSupabase } from './setup';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  );
}

describe('useBranches Hooks & Multi-Branch Endpoints Audit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Branches (branches)', () => {
    it('fetches all active branches', async () => {
      const { result } = renderHook(() => useBranches(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.length).toBeGreaterThan(0);
      expect(result.current.data?.[0].name).toBe('Main Branch');
    });

    it('creates a new branch', async () => {
      const { result } = renderHook(() => useCreateBranch(), { wrapper: createWrapper() });

      await result.current.mutateAsync('Abuja Branch');

      expect(mockSupabase.from).toHaveBeenCalledWith('branches');
    });

    it('updates an existing branch', async () => {
      const { result } = renderHook(() => useUpdateBranch(), { wrapper: createWrapper() });

      await result.current.mutateAsync({ id: 'branch-2', name: 'Updated Branch', is_active: false });

      expect(mockSupabase.from).toHaveBeenCalledWith('branches');
    });
  });

  describe('User Branch Assignments (user_branches)', () => {
    it('fetches branches assigned to a user', async () => {
      const { result } = renderHook(() => useUserBranches('user-1'), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toBeDefined();
      expect(mockSupabase.from).toHaveBeenCalledWith('user_branches');
    });

    it('assigns a user to a branch', async () => {
      const { result } = renderHook(() => useAssignUserBranch(), { wrapper: createWrapper() });

      await result.current.mutateAsync({ userId: 'user-2', branchId: 'branch-2', isDefault: true });

      expect(mockSupabase.from).toHaveBeenCalledWith('user_branches');
    });

    it('removes a user branch assignment', async () => {
      const { result } = renderHook(() => useRemoveUserBranch(), { wrapper: createWrapper() });

      await result.current.mutateAsync({ userId: 'user-1', branchId: '00000000-0000-0000-0000-000000000001' });

      expect(mockSupabase.from).toHaveBeenCalledWith('user_branches');
    });
  });
});
