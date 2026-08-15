import { useState, useEffect } from 'react';
import { Package, LogOut, Menu, Download, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { BranchSwitcher } from './BranchSwitcher';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MobileNavDrawer } from './AppSidebar';
import { useNavigate } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function AppHeader() {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const roleLabel = role === 'manager' ? 'Manager' : role === 'inventory' ? 'Inventory' : 'Viewer';
  const roleBadgeStyle = role === 'manager'
    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
    : role === 'inventory'
    ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30'
    : 'bg-muted text-muted-foreground border-border';

  return (
    <>
      <header className="sticky top-0 z-50 flex h-14 items-center gap-2 border-b bg-background px-4">
        {/* Mobile hamburger — visible only on mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 md:hidden"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Desktop sidebar trigger — visible only on md+ */}
        <div className="hidden md:flex">
          <SidebarTrigger>
            <Menu className="h-5 w-5" />
          </SidebarTrigger>
        </div>

        <div className="flex items-center gap-2">
          <Package className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">Stockist</span>
        </div>

        {/* Branch Switcher */}
        <div className="ml-4">
          <BranchSwitcher />
        </div>

        <div className="ml-auto flex items-center gap-2">
          {deferredPrompt && (
            <Button variant="outline" size="sm" onClick={handleInstall} className="hidden sm:inline-flex">
              <Download className="mr-1.5 h-4 w-4" />
              Install App
            </Button>
          )}
          {deferredPrompt && (
            <Button variant="outline" size="icon" onClick={handleInstall} className="sm:hidden h-8 w-8">
              <Download className="h-4 w-4" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {user?.email ? getInitials(user.email) : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-background" align="end" forceMount>
              <div className="flex flex-col space-y-1.5 p-2">
                <p className="text-sm font-medium leading-none truncate">{user?.email}</p>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${roleBadgeStyle}`}>
                    {roleLabel}
                  </span>
                </div>
              </div>
              <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={signOut} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile navigation drawer */}
      <MobileNavDrawer
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />
    </>
  );
}
