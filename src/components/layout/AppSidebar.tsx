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

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon">
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
