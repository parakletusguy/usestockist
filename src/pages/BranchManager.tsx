import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBranches, useCreateBranch, useUpdateBranch } from '@/hooks/useBranches';
import { Building2, Plus, Pencil, Check, X, ArrowLeft, ToggleLeft, ToggleRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function BranchManager() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const { data: branches = [], isLoading } = useBranches();
  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();

  const [newBranchName, setNewBranchName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Guard: non-admins shouldn't land here
  if (role !== 'manager') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Building2 className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">You don't have permission to manage branches.</p>
        <Button variant="outline" onClick={() => navigate('/settings')}>
          Back to Settings
        </Button>
      </div>
    );
  }

  const handleCreate = () => {
    const name = newBranchName.trim();
    if (!name) return;
    createBranch.mutate(name, {
      onSuccess: () => setNewBranchName(''),
    });
  };

  const startEdit = (id: string, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
  };

  const saveEdit = (id: string) => {
    const name = editingName.trim();
    if (!name) return;
    updateBranch.mutate({ id, name }, {
      onSuccess: () => setEditingId(null),
    });
  };

  const toggleActive = (id: string, currentActive: boolean) => {
    updateBranch.mutate({ id, is_active: !currentActive });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-2">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/settings')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Branch Manager</h1>
          <p className="text-sm text-muted-foreground">Create and manage business branches</p>
        </div>
      </div>

      {/* Create new branch */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            Create New Branch
          </CardTitle>
          <CardDescription>Add a new branch location to your organisation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              id="new-branch-name"
              placeholder="Branch name (e.g. Lagos Main, Abuja Hub)"
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              className="flex-1"
            />
            <Button
              onClick={handleCreate}
              disabled={!newBranchName.trim() || createBranch.isPending}
              className="shrink-0"
            >
              {createBranch.isPending ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Branch list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            All Branches
          </CardTitle>
          <CardDescription>
            {branches.length} branch{branches.length !== 1 ? 'es' : ''} configured
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground text-sm">Loading branches…</div>
          ) : branches.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">No branches yet.</div>
          ) : (
            branches.map((branch, idx) => (
              <div key={branch.id}>
                {idx > 0 && <Separator className="my-1" />}
                <div className="flex items-center gap-3 py-2">
                  {editingId === branch.id ? (
                    <>
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit(branch.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="flex-1 h-8 text-sm"
                        autoFocus
                      />
                      <Button size="icon" className="h-7 w-7" variant="ghost" onClick={() => saveEdit(branch.id)}>
                        <Check className="h-3.5 w-3.5 text-green-600" />
                      </Button>
                      <Button size="icon" className="h-7 w-7" variant="ghost" onClick={() => setEditingId(null)}>
                        <X className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="flex-1 text-sm font-medium truncate">{branch.name}</span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] shrink-0 ${
                          branch.is_active
                            ? 'bg-green-500/10 text-green-600 border-green-500/30'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {branch.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        title={branch.is_active ? 'Deactivate branch' : 'Activate branch'}
                        onClick={() => toggleActive(branch.id, branch.is_active)}
                      >
                        {branch.is_active
                          ? <ToggleRight className="h-4 w-4 text-green-600" />
                          : <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                        }
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        title="Edit branch name"
                        onClick={() => startEdit(branch.id, branch.name)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
