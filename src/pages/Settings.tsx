import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Lock, Users, Save, Loader2, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

type AppRole = 'manager' | 'inventory' | 'viewer';

interface AppUser {
  id: string;
  email: string;
  role: AppRole;
  created_at: string;
}

const roleBadgeClass = (r: string) => {
  switch (r) {
    case 'manager':
      return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
    case 'inventory':
      return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

const roleLabel = (r: string) => {
  switch (r) {
    case 'manager': return 'Manager';
    case 'inventory': return 'Inventory';
    default: return 'Viewer';
  }
};

export default function Settings() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Profile state
  const [displayName, setDisplayName] = useState(user?.user_metadata?.full_name || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Fetch all users (managers only)
  const { data: allUsers, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('get_all_users');
      if (error) throw error;
      return data as AppUser[];
    },
    enabled: role === 'manager',
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: AppRole }) => {
      const { error } = await (supabase as any).rpc('set_user_role', {
        p_user_id: userId,
        p_role: newRole,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      toast({ title: 'Role updated', description: 'User role has been updated successfully.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      const { error } = await supabase.auth.updateUser({ data: { full_name: displayName } });
      if (error) throw error;
      toast({ title: 'Profile saved', description: 'Your display name has been updated.' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: 'Password too short', description: 'Password must be at least 6 characters.', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Passwords do not match', description: 'New password and confirm password must match.', variant: 'destructive' });
      return;
    }
    setIsSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: 'Password updated', description: 'Your password has been changed successfully.' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const otherUsers = allUsers?.filter((u) => u.id !== user?.id) ?? [];

  return (
    <div className="container max-w-2xl py-8 space-y-8">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your account and team settings.
        </p>
      </div>

      {/* ── Section 1: Profile ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-muted-foreground" />
            My Profile
          </CardTitle>
          <CardDescription>Update your personal information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email (read-only) */}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email ?? ''} readOnly className="bg-muted/50 cursor-not-allowed" />
          </div>

          {/* Role badge */}
          <div className="space-y-1.5">
            <Label>Role</Label>
            <div className="flex items-center gap-2 h-9">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline" className={roleBadgeClass(role ?? 'viewer')}>
                {roleLabel(role ?? 'viewer')}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Display name */}
          <div className="space-y-1.5">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your full name"
            />
          </div>

          <Button onClick={handleSaveProfile} disabled={isSavingProfile} className="w-full sm:w-auto">
            {isSavingProfile ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Profile
          </Button>
        </CardContent>
      </Card>

      {/* ── Section 2: Change Password ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4 text-muted-foreground" />
            Change Password
          </CardTitle>
          <CardDescription>Set a new password for your account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 6 characters"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
            />
          </div>

          <Button
            onClick={handleSavePassword}
            disabled={isSavingPassword || !newPassword || !confirmPassword}
            className="w-full sm:w-auto"
          >
            {isSavingPassword ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Lock className="h-4 w-4 mr-2" />
            )}
            Update Password
          </Button>
        </CardContent>
      </Card>

      {/* ── Section 3: User Management (managers only) ── */}
      {role === 'manager' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-muted-foreground" />
              User Management
            </CardTitle>
            <CardDescription>
              View and manage roles for all team members.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingUsers ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : otherUsers.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                No other users found.
              </p>
            ) : (
              <div className="rounded-md border overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-2.5 bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b">
                  <div>Email</div>
                  <div>Role</div>
                  <div>Joined</div>
                </div>
                {/* Rows */}
                <div className="divide-y">
                  {otherUsers.map((u) => (
                    <div
                      key={u.id}
                      className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-3 items-center"
                    >
                      <div className="truncate text-sm">{u.email}</div>
                      <div>
                        <Select
                          value={u.role}
                          onValueChange={(val) =>
                            updateRoleMutation.mutate({
                              userId: u.id,
                              newRole: val as AppRole,
                            })
                          }
                        >
                          <SelectTrigger className="h-7 w-[130px] text-xs">
                            <SelectValue>
                              <Badge variant="outline" className={`text-[10px] ${roleBadgeClass(u.role)}`}>
                                {roleLabel(u.role)}
                              </Badge>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="inventory">Inventory</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(u.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
