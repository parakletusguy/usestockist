import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, TrendingUp, ArrowRightLeft, PackageCheck, Send, ClipboardList, Plus, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

function useDashboardData() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const sb = supabase as any;
      const [itemsRes, issuanceRes, transfersRes, receivedRes, todaysTransRes, stockStatusRes] = await Promise.all([
        sb.from('items').select('id, category', { count: 'exact' }),
        sb.from('inventory_transactions').select('*, items(name)').eq('type', 'issuance').order('transaction_date', { ascending: false }).limit(10),
        sb.from('inventory_transactions').select('id', { count: 'exact' }).eq('type', 'transfer'),
        sb.from('inventory_transactions').select('id', { count: 'exact' }).eq('type', 'receive'),
        sb.from('inventory_transactions').select('quantity').eq('transaction_date', today).in('type', ['issuance', 'sale']),
        sb.rpc('get_daily_inventory_report', {
          p_start_date: `${today}T00:00:00Z`,
          p_end_date: `${today}T23:59:59.999Z`,
          p_include_zero_activity: true,
        }),
      ]);

      // Calculate category distribution
      const categoryCount: Record<string, number> = {};
      (itemsRes.data || []).forEach(item => {
        categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
      });
      const categoryData = Object.entries(categoryCount).map(([name, value]) => ({ name, value }));

      // Calculate today's total outward quantity
      const todaysOutward = (todaysTransRes.data || []).reduce((sum, trans) => sum + Number(trans.quantity), 0);

      // Low/out-of-stock counts for today
      let outOfStock = 0;
      let lowStock = 0;
      (stockStatusRes.data || []).forEach((row) => {
        const balance = Number(row.calculated_closing_stock) || 0;
        const threshold = Number(row.low_stock_threshold) || 0;
        if (balance <= 0) outOfStock++;
        else if (balance <= threshold) lowStock++;
      });

      return {
        totalItems: itemsRes.count || 0,
        totalTransactions: (issuanceRes.data?.length || 0) + (transfersRes.count || 0) + (receivedRes.count || 0),
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
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your inventory management</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(data?.outOfStock || 0) + (data?.lowStock || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-destructive">{data?.outOfStock || 0} out</span>
              {' · '}
              <span className="text-amber-600 dark:text-amber-500">{data?.lowStock || 0} low</span>
            </p>
            <Button asChild variant="link" size="sm" className="h-auto p-0 mt-1">
              <Link to="/daily-stock-count?filter=flagged">View flagged items</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalItems || 0}</div>
            <p className="text-xs text-muted-foreground">Items in catalog</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Issuance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.todaysSales || 0}</div>
            <p className="text-xs text-muted-foreground">Units issued today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalTransactions || 0}</div>
            <p className="text-xs text-muted-foreground">Total transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.categoryData?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Item categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Issuances</CardTitle>
            <CardDescription>Latest outward stock movements</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.recentIssuances && data.recentIssuances.length > 0 ? (
              <div className="space-y-4">
                {data.recentIssuances.map((issuance: any) => (
                  <div key={issuance.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{issuance.items?.name}</p>
                      <p className="text-xs text-muted-foreground">To: {issuance.recipient_group || 'Unknown'}</p>
                    </div>
                    <div className="font-medium text-destructive">
                      -{issuance.quantity}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No recent issuances
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Items by Category</CardTitle>
            <CardDescription>Distribution of items across categories</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.categoryData && data.categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
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
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No items in catalog yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks you can perform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Button asChild variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <Link to="/issuance">
                <Send className="h-5 w-5" />
                <span>New Issuance</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <Link to="/received">
                <PackageCheck className="h-5 w-5" />
                <span>Record Receipt</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <Link to="/transfers">
                <ArrowRightLeft className="h-5 w-5" />
                <span>Create Transfer</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <Link to="/reports">
                <ClipboardList className="h-5 w-5" />
                <span>Reports</span>
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
            <Button asChild>
              <Link to="/items">
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
