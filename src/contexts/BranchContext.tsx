import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

export interface Branch {
  id: string;
  name: string;
  is_active: boolean;
}

interface BranchContextType {
  activeBranch: Branch | null;
  branches: Branch[];
  setActiveBranch: (branch: Branch) => void;
  loading: boolean;
  /** True when the user is locked to exactly one branch (non-manager with a single assignment) */
  isBranchLocked: boolean;
}

const STORAGE_KEY = 'ub_active_branch';
const MAIN_BRANCH_ID = '00000000-0000-0000-0000-000000000001';

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export const useBranch = () => {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
};

export const BranchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isManager } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [activeBranch, setActiveBranchState] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBranchLocked, setIsBranchLocked] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadBranches() {
      if (!user) {
        setBranches([]);
        setActiveBranchState(null);
        setIsBranchLocked(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Step 1: Fetch all active branches
        const { data: allBranches, error: branchError } = await supabase
          .from('branches')
          .select('id, name, is_active')
          .eq('is_active', true)
          .order('name');

        if (branchError) throw branchError;
        const allActiveBranches: Branch[] = allBranches || [];

        let availableBranches = allActiveBranches;
        let locked = false;

        // Step 2: For non-managers, restrict to assigned branches
        if (!isManager) {
          const { data: userBranchRows, error: ubError } = await supabase
            .from('user_branches')
            .select('branch_id, is_default')
            .eq('user_id', user.id)
            .order('is_default', { ascending: false });

          if (!ubError && userBranchRows && userBranchRows.length > 0) {
            const assignedIds = new Set(userBranchRows.map((r) => r.branch_id));
            availableBranches = allActiveBranches.filter((b) => assignedIds.has(b.id));
          } else {
            // No explicit assignment: restrict to main branch as safe default
            availableBranches = allActiveBranches.filter((b) => b.id === MAIN_BRANCH_ID);
          }

          // Lock when user can only access one branch
          locked = availableBranches.length <= 1;
        }

        if (!isMounted) return;

        setBranches(availableBranches);
        setIsBranchLocked(locked);

        // When locked, always force the single allowed branch
        if (locked && availableBranches.length > 0) {
          setActiveBranchState(availableBranches[0]);
          localStorage.setItem(STORAGE_KEY, availableBranches[0].id);
          return;
        }

        // Restore saved branch from localStorage (only if it's an allowed branch)
        const savedBranchId = localStorage.getItem(STORAGE_KEY);
        let selected = availableBranches.find((b) => b.id === savedBranchId) || null;

        // Fallback to main branch or first available
        if (!selected && availableBranches.length > 0) {
          selected = availableBranches.find((b) => b.id === MAIN_BRANCH_ID) || availableBranches[0];
        }

        setActiveBranchState(selected);
      } catch (err) {
        console.error('Error loading branches:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadBranches();

    return () => {
      isMounted = false;
    };
  }, [user?.id, isManager]);

  const setActiveBranch = (branch: Branch) => {
    if (isBranchLocked) return; // Prevent locked users from switching
    setActiveBranchState(branch);
    localStorage.setItem(STORAGE_KEY, branch.id);
  };

  return (
    <BranchContext.Provider value={{ activeBranch, branches, setActiveBranch, loading, isBranchLocked }}>
      {children}
    </BranchContext.Provider>
  );
};
