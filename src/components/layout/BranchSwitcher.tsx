import React from 'react';
import { Building2, Check, ChevronDown, Lock } from 'lucide-react';
import { useBranch } from '@/contexts/BranchContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export function BranchSwitcher() {
  const { activeBranch, branches, setActiveBranch, loading, isBranchLocked } = useBranch();

  if (loading) {
    return (
      <div className="h-8 w-32 animate-pulse rounded-md bg-muted" />
    );
  }

  if (!activeBranch || branches.length === 0) {
    return null;
  }

  // Locked users (non-manager with a single assigned branch): show static badge
  if (isBranchLocked || branches.length === 1) {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted text-xs font-medium border border-border"
        title="Your branch access is managed by an admin"
      >
        <Building2 className="h-3.5 w-3.5 text-primary" />
        <span className="truncate max-w-[120px]">{activeBranch.name}</span>
        <Lock className="h-3 w-3 text-muted-foreground opacity-60" />
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 px-2.5 text-xs font-medium border-primary/20 hover:bg-primary/5"
        >
          <Building2 className="h-3.5 w-3.5 text-primary" />
          <span className="truncate max-w-[110px] md:max-w-[150px]">{activeBranch.name}</span>
          <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48 bg-background">
        <div className="px-2 py-1.5 text-[10px] uppercase font-bold tracking-wider text-muted-foreground border-b mb-1">
          Select Active Branch
        </div>
        {branches.map((branch) => {
          const isSelected = branch.id === activeBranch.id;
          return (
            <DropdownMenuItem
              key={branch.id}
              onClick={() => setActiveBranch(branch)}
              className="flex items-center justify-between text-xs cursor-pointer"
            >
              <span className="truncate">{branch.name}</span>
              {isSelected && <Check className="h-3.5 w-3.5 text-primary ml-2" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
