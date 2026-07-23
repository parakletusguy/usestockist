import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, TrendingUp, ArrowRightLeft, PackageCheck, Send, ClipboardList, Plus, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

type IssuanceRow = {
  id: string;
  quantity: number;
  recipient_group: string | null;
  date: string;
  items: { name: string } | null;
};

function useDashboardData() {
  return useQuery({
    queryKey: ['dashboard'],
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];

      const [itemsRes, issuanceRes, transfersRes, receivedRes, todaysIssRes, sheetsRes] = await Promise.all([
        supabase.from('items').select('id, category, low_stock_threshold'),
        supabase.from('issuance_ledger').select('*, items(name)').order('date', { ascending: false }).limit(10),
        supabase.from('transfer_ledger').select('id', { count: 'exact', head: true }),
        supabase.from('received_ledger').select('id', { count: 'exact', head: true }),
        supabase.from('issuance_ledger').select('quantity').eq('date', today),
        supabase.from('daily_stock_sheets').select('item_id, close_qty').order('date', { ascending: false }).limit(500),
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

      // Latest close_qty per item from daily sheets
      const latestClose = new Map<string, number>();
      for (const s of (sheetsRes.data || [])) {
        const row = s as { item_id: string; close_qty: number | null };
        if (!latestClose.has(row.item_id)) latestClose.set(row.item_id, Number(row.close_qty || 0));
      }

      let outOfStock = 0;
      let lowStock = 0;
      for (const item of (itemsRes.data || [])) {
        const typed = item as { id: string; category: string; low_stock_threshold: number };
        const stock = latestClose.get(typed.id) ?? 0;
        const threshold = Number(typed.low_stock_threshold || 0);
        if (stock === 0) outOfStock++;
        else if (threshold > 0 && stock <= threshold) lowStock++;
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
      };
    },
  });
}



const Dashboard = () => {
  const { data, isLoading } = useDashboardData();

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
        <p className="text-muted-foreground text-sm sm:text-base">Overview of your inventory management</p>
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
              <span className="text-destructive">{data?.outOfStock || 0} out</span>
              {' · '}
              <span className="text-amber-600 dark:text-amber-500">{data?.lowStock || 0} low</span>
            </p>
            <Button asChild variant="link" size="sm" className="h-auto p-0 mt-1 text-xs">
              <Link to="/daily-stock-count?filter=flagged">View flagged</Link>
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
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
