import { describe, it, expect } from 'vitest';
import { getUserRoleFromSession, useRole } from '@/hooks/useRole';
import { renderHook } from '@testing-library/react';
import { Session } from '@supabase/supabase-js';

describe('useRole RBAC Calculation Audit', () => {
  it('correctly maps manager session role and permissions', () => {
    const managerSession = {
      user: { id: 'u-1', app_metadata: { role: 'manager' } },
    } as unknown as Session;

    expect(getUserRoleFromSession(managerSession)).toBe('manager');

    const { result } = renderHook(() => useRole(managerSession));

    expect(result.current.role).toBe('manager');
    expect(result.current.isManager).toBe(true);
    expect(result.current.canWriteLedgers).toBe(true);
    expect(result.current.canManageItems).toBe(true);
    expect(result.current.canManageReorders).toBe(true);
  });

  it('correctly maps inventory session role and permissions', () => {
    const inventorySession = {
      user: { id: 'u-2', app_metadata: { role: 'inventory' } },
    } as unknown as Session;

    expect(getUserRoleFromSession(inventorySession)).toBe('inventory');

    const { result } = renderHook(() => useRole(inventorySession));

    expect(result.current.role).toBe('inventory');
    expect(result.current.isInventory).toBe(true);
    expect(result.current.canWriteLedgers).toBe(true);
    expect(result.current.canManageItems).toBe(false);
    expect(result.current.canManageReorders).toBe(false);
  });

  it('defaults to viewer role when session or app_metadata is missing', () => {
    expect(getUserRoleFromSession(null)).toBe('viewer');

    const { result } = renderHook(() => useRole(null));

    expect(result.current.role).toBe('viewer');
    expect(result.current.isManager).toBe(false);
    expect(result.current.isInventory).toBe(false);
    expect(result.current.canWriteLedgers).toBe(false);
    expect(result.current.canManageItems).toBe(false);
  });
});
