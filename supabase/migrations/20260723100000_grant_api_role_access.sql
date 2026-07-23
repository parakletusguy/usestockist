-- Migration: ensure PostgREST API roles have full access to all app tables
-- This prevents "schema cache" errors on the client side when tables
-- were created without explicit role grants.

-- reach_sales_reports
GRANT ALL ON public.reach_sales_reports TO authenticated;
GRANT ALL ON public.reach_sales_reports TO anon;
GRANT ALL ON public.reach_sales_reports TO service_role;

-- inventory_transactions
GRANT ALL ON public.inventory_transactions TO authenticated;
GRANT ALL ON public.inventory_transactions TO anon;
GRANT ALL ON public.inventory_transactions TO service_role;

-- item_departments
GRANT ALL ON public.item_departments TO authenticated;
GRANT ALL ON public.item_departments TO anon;
GRANT ALL ON public.item_departments TO service_role;

-- items
GRANT ALL ON public.items TO authenticated;
GRANT ALL ON public.items TO anon;
GRANT ALL ON public.items TO service_role;

-- issuance_ledger
GRANT ALL ON public.issuance_ledger TO authenticated;
GRANT ALL ON public.issuance_ledger TO anon;
GRANT ALL ON public.issuance_ledger TO service_role;

-- transfer_ledger
GRANT ALL ON public.transfer_ledger TO authenticated;
GRANT ALL ON public.transfer_ledger TO anon;
GRANT ALL ON public.transfer_ledger TO service_role;

-- received_ledger
GRANT ALL ON public.received_ledger TO authenticated;
GRANT ALL ON public.received_ledger TO anon;
GRANT ALL ON public.received_ledger TO service_role;

-- daily_stock_sheets
GRANT ALL ON public.daily_stock_sheets TO authenticated;
GRANT ALL ON public.daily_stock_sheets TO anon;
GRANT ALL ON public.daily_stock_sheets TO service_role;

-- Reload PostgREST schema cache so all tables become immediately visible to the API
NOTIFY pgrst, 'reload schema';
