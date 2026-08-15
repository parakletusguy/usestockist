import { useMemo } from 'react';
import { Session } from '@supabase/supabase-js';

export type UserRole = 'manager' | 'inventory' | 'cube_staff' | 'viewer';

export interface RoleInfo {
  role: UserRole;
  isManager: boolean;
  isInventory: boolean;
  isCubeStaff: boolean;
  canWriteLedgers: boolean;
  canManageItems: boolean;
  canManageReorders: boolean;
  departmentLock: 'Cube' | null;
}

export function getUserRoleFromSession(session: Session | null): UserRole {
  if (!session?.user) return 'viewer';
  
  const appRole = session.user.app_metadata?.role as string | undefined;
  const userRole = session.user.user_metadata?.role as string | undefined;
  const email = (session.user.email || '').toLowerCase();
  const dept = (session.user.app_metadata?.department || session.user.user_metadata?.department || '').toLowerCase();

  if (appRole === 'manager' || userRole === 'manager') return 'manager';
  if (appRole === 'cube_staff' || userRole === 'cube_staff' || dept === 'cube' || email.startsWith('cube@') || email.includes('cube.dept')) {
    return 'cube_staff';
  }
  if (appRole === 'inventory' || userRole === 'inventory') return 'inventory';
  return 'viewer';
}

export function useRole(session: Session | null): RoleInfo {
  return useMemo(() => {
    const role = getUserRoleFromSession(session);
    const isManager = role === 'manager';
    const isInventory = role === 'inventory';
    const isCubeStaff = role === 'cube_staff';
    const canWriteLedgers = isManager || isInventory || isCubeStaff;
    const canManageItems = isManager;
    const canManageReorders = isManager;
    const departmentLock: 'Cube' | null = isCubeStaff ? 'Cube' : null;

    return {
      role,
      isManager,
      isInventory,
      isCubeStaff,
      canWriteLedgers,
      canManageItems,
      canManageReorders,
      departmentLock,
    };
  }, [session]);
}
