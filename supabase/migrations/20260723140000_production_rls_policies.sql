-- Migration: Production RLS Policies and API Role Grants
-- Enforces Row Level Security (RLS) across all application tables
-- with clean access policies for authenticated and anon app operations.

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reach_sales_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issuance_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.received_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_stock_sheets ENABLE ROW LEVEL SECURITY;

-- Permissive RLS policies for application operations
DROP POLICY IF EXISTS "allow_all_items" ON public.items;
CREATE POLICY "allow_all_items" ON public.items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_item_departments" ON public.item_departments;
CREATE POLICY "allow_all_item_departments" ON public.item_departments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_inventory_transactions" ON public.inventory_transactions;
CREATE POLICY "allow_all_inventory_transactions" ON public.inventory_transactions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_reach_sales_reports" ON public.reach_sales_reports;
CREATE POLICY "allow_all_reach_sales_reports" ON public.reach_sales_reports FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_issuance_ledger" ON public.issuance_ledger;
CREATE POLICY "allow_all_issuance_ledger" ON public.issuance_ledger FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_received_ledger" ON public.received_ledger;
CREATE POLICY "allow_all_received_ledger" ON public.received_ledger FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_transfer_ledger" ON public.transfer_ledger;
CREATE POLICY "allow_all_transfer_ledger" ON public.transfer_ledger FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_daily_stock_sheets" ON public.daily_stock_sheets;
CREATE POLICY "allow_all_daily_stock_sheets" ON public.daily_stock_sheets FOR ALL USING (true) WITH CHECK (true);

-- Ensure grants for API roles
GRANT ALL ON public.items TO authenticated, anon, service_role;
GRANT ALL ON public.item_departments TO authenticated, anon, service_role;
GRANT ALL ON public.inventory_transactions TO authenticated, anon, service_role;
GRANT ALL ON public.reach_sales_reports TO authenticated, anon, service_role;
GRANT ALL ON public.issuance_ledger TO authenticated, anon, service_role;
GRANT ALL ON public.received_ledger TO authenticated, anon, service_role;
GRANT ALL ON public.transfer_ledger TO authenticated, anon, service_role;
GRANT ALL ON public.daily_stock_sheets TO authenticated, anon, service_role;
