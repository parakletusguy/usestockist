import { useState } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Send, 
  ArrowLeftRight, 
  PackageCheck,
  Calendar,
  FileSpreadsheet,
  Building2,
  Sparkles,
  Menu,
  X,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Package as PackageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const ledgerItems = [
  { title: 'Received', url: '/ledgers/received', icon: PackageCheck },
  { title: 'Transfer', url: '/ledgers/transfers', icon: ArrowLeftRight },
  { title: 'Issuance', url: '/ledgers/issuance', icon: Send },
  { title: 'Stock Count', url: '/ledgers/stock-count', icon: Calendar },
  { title: 'Item Sales Report', url: '/ledgers/item-sales', icon: FileSpreadsheet },
  { title: 'Items Manager', url: '/ledgers/items', icon: Package },
];

const departmentItems = [
  { title: 'Retail', url: '/departments/retail' },
  { title: 'Cube', url: '/departments/cube' },
  { title: 'Bar', url: '/departments/bar' },
  { title: 'Nox', url: '/departments/nox' },
  { title: 'Housekeeping', url: '/departments/housekeeping' },
  { title: 'Kitchen (Nox)', url: '/departments/kitchen-nox' },
];

/** Mobile slide-out drawer — renders all nav links inside a Sheet */
export function MobileNavDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const linkClass = 'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors hover:bg-muted/60 min-h-[44px]';
  const activeLinkClass = 'bg-muted text-primary font-semibold';

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="left" className="w-72 p-0 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b shrink-0">
          <SheetTitle className="flex items-center gap-2 text-left">
            <PackageIcon className="h-5 w-5 text-primary" />
            Stockist
          </SheetTitle>
        </SheetHeader>

        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
          {/* Dashboard */}
          <NavLink
            to="/"
            end
            className={linkClass}
            activeClassName={activeLinkClass}
            onClick={onClose}
          >
            <LayoutDashboard className="h-5 w-5 shrink-0" />
            Dashboard
          </NavLink>

          {/* Ledgers section */}
          <div className="pt-3 pb-1">
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Ledgers
            </p>
          </div>
          {ledgerItems.map((item) => (
            <NavLink
              key={item.title}
              to={item.url}
              className={linkClass}
              activeClassName={activeLinkClass}
              onClick={onClose}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.title}
            </NavLink>
          ))}

          {/* Departments section */}
          <div className="pt-3 pb-1">
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Departments
            </p>
          </div>
          {departmentItems.map((dept) => (
            <NavLink
              key={dept.title}
              to={dept.url}
              className={linkClass}
              activeClassName={activeLinkClass}
              onClick={onClose}
            >
              <Building2 className="h-4.5 w-4.5 shrink-0" />
              {dept.title}
            </NavLink>
          ))}

          {/* AI Assistant */}
          <div className="pt-3 pb-1">
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Tools
            </p>
          </div>
          <NavLink
            to="/ai-assistant"
            className={cn(linkClass, 'text-primary font-medium hover:bg-primary/10')}
            activeClassName="bg-primary/15 text-primary font-bold"
            onClick={onClose}
          >
            <Sparkles className="h-5 w-5 shrink-0 text-primary" />
            AI Assistant
          </NavLink>
        </nav>
      </SheetContent>
    </Sheet>
  );
}

/** Desktop sidebar — uses shadcn Sidebar with collapsible icon mode */
export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon" className="hidden md:flex">
      <SidebarContent>
        {/* Top Level Dashboard */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Dashboard">
                  <NavLink 
                    to="/" 
                    end
                    className="flex items-center gap-2 hover:bg-muted/50" 
                    activeClassName="bg-muted text-primary font-medium"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    {!collapsed && <span>Dashboard</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Ledgers Group */}
        <SidebarGroup>
          <SidebarGroupLabel>{!collapsed && 'Ledgers'}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {ledgerItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink 
                      to={item.url} 
                      className="flex items-center gap-2 hover:bg-muted/50" 
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Departments Group */}
        <SidebarGroup>
          <SidebarGroupLabel>{!collapsed && 'Departments'}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {departmentItems.map((dept) => (
                <SidebarMenuItem key={dept.title}>
                  <SidebarMenuButton asChild tooltip={dept.title}>
                    <NavLink 
                      to={dept.url} 
                      className="flex items-center gap-2 hover:bg-muted/50 text-sm pl-3" 
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <Building2 className="h-3.5 w-3.5" />
                      {!collapsed && <span>{dept.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* AI Assistant */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="AI Assistant">
                  <NavLink 
                    to="/ai-assistant" 
                    className="flex items-center gap-2 text-primary font-medium hover:bg-primary/10" 
                    activeClassName="bg-primary/15 text-primary font-bold"
                  >
                    <Sparkles className="h-4 w-4 text-primary" />
                    {!collapsed && <span>AI Assistant</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
