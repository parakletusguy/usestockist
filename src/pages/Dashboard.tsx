import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { useRole } from '@/hooks/useRole';
import { usePredictiveReordering } from '@/hooks/usePredictiveReordering';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, TrendingUp, ArrowRightLeft, PackageCheck, Send, ClipboardList, Plus, AlertTriangle, Sparkles, ShoppingCart } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const CHART_COLORS = [
  '#3b82f6', // Blue (Retail / Beverages)
  '#10b981', // Emerald (Food)
  '#f59e0b', // Amber (Supplies)
  '#8b5cf6', // Violet (Alcohol / Spirits)
  '#ec4899', // Pink (Syrups)
  '#06b6d4', // Cyan (Packaging)
  '#f97316', // Orange (Snacks)
  '#6366f1', // Indigo
];

type IssuanceRow = {
  id: string;
  quantity: number;
  recipient_group: string | null;
  date: string;
  items: { name: string } | null;
};

function useDashboardData(branchId?: string) {
  return useQuery({
    queryKey: ['dashboard', branchId || 'all'],
    staleTime: 5_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];

      let issQuery = supabase.from('issuance_ledger').select('*, items(name)').order('date', { ascending: false }).limit(10);
      let trnQuery = supabase.from('transfer_ledger').select('id', { count: 'exact', head: true });
      let rcvQuery = supabase.from('received_ledger').select('id', { count: 'exact', head: true });
      let todaysIssQuery = supabase.from('issuance_ledger').select('quantity').eq('date', today);
      let sheetsQuery = supabase.from('daily_stock_sheets').select('item_id, close_qty').order('date', { ascending: false }).limit(500);

      if (branchId) {
        issQuery = issQuery.eq('branch_id', branchId);
        trnQuery = trnQuery.eq('branch_id', branchId);
        rcvQuery = rcvQuery.eq('branch_id', branchId);
        todaysIssQuery = todaysIssQuery.eq('branch_id', branchId);
        sheetsQuery = sheetsQuery.eq('branch_id', branchId);
      }

      const [itemsRes, issuanceRes, transfersRes, receivedRes, todaysIssRes, sheetsRes] = await Promise.all([
        supabase.from('items').select('id, category, low_stock_threshold'),
        issQuery,
        trnQuery,
        rcvQuery,
        todaysIssQuery,
        sheetsQuery,
      ]);

      // Category distribution
      const categoryCount: Record<string, number> = {};
      (itemsRes.data || []).forEach((item) => {
        categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
      });
      const categoryData = Object.entries(categoryCount).map(([name, value]) => ({ name, value }));

      const todaysOutward = (todaysIssRes.data || []).reduce(
        (sum: number, t) => sum + Number((t as { quantity: number }).quantity || 0), 0
      );

      // Latest close_qty per item from daily sheets for this branch
      const hasBranchSheets = (sheetsRes.data || []).length > 0;
      const latestClose = new Map<string, number>();
      for (const s of (sheetsRes.data || [])) {
        const row = s as { item_id: string; close_qty: number | null };
        if (!latestClose.has(row.item_id)) latestClose.set(row.item_id, Number(row.close_qty || 0));
      }

      let outOfStock = 0;
      let lowStock = 0;
      if (hasBranchSheets) {
        for (const item of (itemsRes.data || [])) {
          const typed = item as { id: string; category: string; low_stock_threshold: number };
          const stock = latestClose.get(typed.id) ?? 0;
          const threshold = Number(typed.low_stock_threshold || 0);
          if (stock === 0) outOfStock++;
          else if (threshold > 0 && stock <= threshold) lowStock++;
        }
      }

      return {
        totalItems: (itemsRes.data || []).length,
        totalTransactions:
          (issuanceRes.data?.length || 0) + (transfersRes.count || 0) + (receivedRes.count || 0),
        todaysSales: todaysOutward,
        recentIssuances: issuanceRes.data || [],
        categoryData,
        outOfStock,
        lowStock,
        hasBranchSheets,
      };
    },
  });
}

const Dashboard = () => {
  const { activeBranch } = useBranch();
  const { data, isLoading } = useDashboardData(activeBranch?.id);
  const { session } = useAuth();
  const { canManageReorders } = useRole(session);
  const { purchaseOrders } = usePredictiveReordering(activeBranch?.id);

  const draftPOs = purchaseOrders.filter((po) => po.status === 'draft');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Overview of inventory management for {activeBranch?.name || 'All Branches'}
        </p>
      </div>

      {/* Metrics Cards — 2 cols on mobile, 3 on sm, 5 on lg */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">
              {(data?.outOfStock || 0) + (data?.lowStock || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data?.hasBranchSheets ? (
                <>
                  <span className="text-destructive">{data?.outOfStock || 0} out</span>
                  {' · '}
                  <span className="text-amber-600 dark:text-amber-500">{data?.lowStock || 0} low</span>
                </>
              ) : (
                <span className="text-muted-foreground">Awaiting initial count</span>
              )}
            </p>
            <Button asChild variant="link" size="sm" className="h-auto p-0 mt-1 text-xs">
              <Link to="/ledgers/stock-count">
                {data?.hasBranchSheets ? 'View flagged' : 'Start count'}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">{data?.totalItems || 0}</div>
            <p className="text-xs text-muted-foreground">Items in catalog</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Today's Issuance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">{data?.todaysSales || 0}</div>
            <p className="text-xs text-muted-foreground">Units issued today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Transactions</CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">{data?.totalTransactions || 0}</div>
            <p className="text-xs text-muted-foreground">Total transactions</p>
          </CardContent>
        </Card>

        <Card className="col-span-2 sm:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Categories</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">{data?.categoryData?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Item categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Recent Issuances</CardTitle>
            <CardDescription>Latest outward stock movements</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.recentIssuances && data.recentIssuances.length > 0 ? (
              <div className="space-y-3">
                {(data.recentIssuances as IssuanceRow[]).map((issuance) => (
                  <div key={issuance.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{issuance.items?.name}</p>
                      <p className="text-xs text-muted-foreground">To: {issuance.recipient_group || 'Unknown'}</p>
                    </div>
                    <div className="font-medium text-destructive shrink-0">
                      -{issuance.quantity}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] sm:h-[300px] text-muted-foreground text-sm">
                No recent issuances
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Items by Category</CardTitle>
            <CardDescription>Distribution of items across categories</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.categoryData && data.categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={data.categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                No items in catalog yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Manager Predictive Reorders Alert Card */}
      {canManageReorders && (
        <Card className="border-indigo-200 dark:border-indigo-900 bg-gradient-to-r from-indigo-50/50 via-background to-violet-50/50 dark:from-indigo-950/20 dark:to-violet-950/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                Predictive Reorder Pipeline
              </CardTitle>
              <CardDescription>
                Automated demand forecasting &amp; velocity alerts
              </CardDescription>
            </div>
            <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Link to="/ledgers/purchase-orders">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Manage POs ({draftPOs.length})
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {draftPOs.length > 0 ? (
              <div className="space-y-2 mt-1">
                <p className="text-xs text-muted-foreground font-medium">
                  {draftPOs.length} item{draftPOs.length === 1 ? '' : 's'} predicted to reach stockout thresholds soon:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {draftPOs.slice(0, 3).map((po) => (
                    <div
                      key={po.id}
                      className="p-2.5 rounded-lg border bg-card/60 flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-medium truncate">{po.items?.name}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {po.days_to_stockout !== null && po.days_to_stockout <= 3 ? (
                            <span className="text-rose-600 font-semibold">Stockout in {po.days_to_stockout}d</span>
                          ) : (
                            <span>Velocity: {po.daily_velocity}/day</span>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="shrink-0 text-[10px]">
                        Order {po.suggested_quantity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-1">
                No critical stockout predictions currently pending. All items operating within safe inventory thresholds.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
          <CardDescription>Common tasks you can perform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Button asChild variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <Link to="/ledgers/issuance">
                <Send className="h-5 w-5" />
                <span className="text-xs sm:text-sm">New Issuance</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <Link to="/ledgers/received">
                <PackageCheck className="h-5 w-5" />
                <span className="text-xs sm:text-sm">Record Receipt</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <Link to="/ledgers/transfers">
                <ArrowRightLeft className="h-5 w-5" />
                <span className="text-xs sm:text-sm">Create Transfer</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <Link to="/ledgers/stock-count">
                <ClipboardList className="h-5 w-5" />
                <span className="text-xs sm:text-sm">Stock Count</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Getting Started */}
      {data?.totalItems === 0 && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Start by adding items to your inventory catalog</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full sm:w-auto">
              <Link to="/ledgers/items">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Item
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
