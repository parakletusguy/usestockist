import { useMemo } from 'react';
import { Session } from '@supabase/supabase-js';

export type UserRole = 'manager' | 'inventory' | 'viewer';

export interface RoleInfo {
  role: UserRole;
  isManager: boolean;
  isInventory: boolean;
  canWriteLedgers: boolean;
  canManageItems: boolean;
}

export function getUserRoleFromSession(session: Session | null): UserRole {
  if (!session?.user) return 'viewer';
  const role = session.user.app_metadata?.role as string | undefined;
  if (role === 'manager') return 'manager';
  if (role === 'inventory') return 'inventory';
  return 'viewer';
}

export function useRole(session: Session | null): RoleInfo {
  return useMemo(() => {
    const role = getUserRoleFromSession(session);
    const isManager = role === 'manager';
    const isInventory = role === 'inventory';
    const canWriteLedgers = isManager || isInventory;
    const canManageItems = isManager;

    return {
      role,
      isManager,
      isInventory,
      canWriteLedgers,
      canManageItems,
    };
  }, [session]);
}
