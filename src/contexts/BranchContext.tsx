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

  useEffect(() => {
    let isMounted = true;

    async function loadBranches() {
      setLoading(true);
      try {
        // Fetch all active branches
        const { data: allBranches, error } = await supabase
          .from('branches')
          .select('id, name, is_active')
          .eq('is_active', true)
          .order('name');

        if (error) throw error;
        const availableBranches: Branch[] = allBranches || [];

        if (!isMounted) return;

        setBranches(availableBranches);

        // Try restoring saved branch from localStorage
        const savedBranchId = localStorage.getItem(STORAGE_KEY);
        let selected = availableBranches.find((b) => b.id === savedBranchId) || null;

        // Default to Main Branch or first branch
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
    setActiveBranchState(branch);
    localStorage.setItem(STORAGE_KEY, branch.id);
  };

  return (
    <BranchContext.Provider value={{ activeBranch, branches, setActiveBranch, loading }}>
      {children}
    </BranchContext.Provider>
  );
};
