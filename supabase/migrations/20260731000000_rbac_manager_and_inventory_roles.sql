-- Migration: RBAC Access Control for Manager and Inventory Roles
-- 1. Helper functions to retrieve user role from JWT app_metadata
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    auth.jwt() -> 'app_metadata' ->> 'role',
    'viewer'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_role() = 'manager';
$$;

CREATE OR REPLACE FUNCTION public.has_ledger_write_access()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_role() IN ('manager', 'inventory');
$$;

-- 2. Drop existing permissive policies
DROP POLICY IF EXISTS "allow_all_items" ON public.items;
DROP POLICY IF EXISTS "allow_all_item_departments" ON public.item_departments;
DROP POLICY IF EXISTS "allow_all_inventory_transactions" ON public.inventory_transactions;
DROP POLICY IF EXISTS "allow_all_reach_sales_reports" ON public.reach_sales_reports;
DROP POLICY IF EXISTS "allow_all_issuance_ledger" ON public.issuance_ledger;
DROP POLICY IF EXISTS "allow_all_received_ledger" ON public.received_ledger;
DROP POLICY IF EXISTS "allow_all_transfer_ledger" ON public.transfer_ledger;
DROP POLICY IF EXISTS "allow_all_daily_stock_sheets" ON public.daily_stock_sheets;

DROP POLICY IF EXISTS "Authenticated users can select items" ON public.items;
DROP POLICY IF EXISTS "Authenticated users can insert items" ON public.items;
DROP POLICY IF EXISTS "Authenticated users can update items" ON public.items;
DROP POLICY IF EXISTS "Authenticated users can delete items" ON public.items;

DROP POLICY IF EXISTS "Authenticated users can select daily_stock_sheets" ON public.daily_stock_sheets;
DROP POLICY IF EXISTS "Authenticated users can insert daily_stock_sheets" ON public.daily_stock_sheets;
DROP POLICY IF EXISTS "Authenticated users can update daily_stock_sheets" ON public.daily_stock_sheets;
DROP POLICY IF EXISTS "Authenticated users can delete daily_stock_sheets" ON public.daily_stock_sheets;

DROP POLICY IF EXISTS "Authenticated users can select weekly_stock_counts" ON public.weekly_stock_counts;
DROP POLICY IF EXISTS "Authenticated users can insert weekly_stock_counts" ON public.weekly_stock_counts;
DROP POLICY IF EXISTS "Authenticated users can update weekly_stock_counts" ON public.weekly_stock_counts;
DROP POLICY IF EXISTS "Authenticated users can delete weekly_stock_counts" ON public.weekly_stock_counts;

DROP POLICY IF EXISTS "Authenticated users can select issuance_ledger" ON public.issuance_ledger;
DROP POLICY IF EXISTS "Authenticated users can insert issuance_ledger" ON public.issuance_ledger;
DROP POLICY IF EXISTS "Authenticated users can update issuance_ledger" ON public.issuance_ledger;
DROP POLICY IF EXISTS "Authenticated users can delete issuance_ledger" ON public.issuance_ledger;

DROP POLICY IF EXISTS "Authenticated users can select transfer_ledger" ON public.transfer_ledger;
DROP POLICY IF EXISTS "Authenticated users can insert transfer_ledger" ON public.transfer_ledger;
DROP POLICY IF EXISTS "Authenticated users can update transfer_ledger" ON public.transfer_ledger;
DROP POLICY IF EXISTS "Authenticated users can delete transfer_ledger" ON public.transfer_ledger;

DROP POLICY IF EXISTS "Authenticated users can select received_ledger" ON public.received_ledger;
DROP POLICY IF EXISTS "Authenticated users can insert received_ledger" ON public.received_ledger;
DROP POLICY IF EXISTS "Authenticated users can update received_ledger" ON public.received_ledger;
DROP POLICY IF EXISTS "Authenticated users can delete received_ledger" ON public.received_ledger;

-- 3. Create fine-grained policies for items & item_departments (Manager write only, Authenticated read)
CREATE POLICY "items_select_policy" ON public.items FOR SELECT TO authenticated USING (true);
CREATE POLICY "items_insert_policy" ON public.items FOR INSERT TO authenticated WITH CHECK (public.is_manager());
CREATE POLICY "items_update_policy" ON public.items FOR UPDATE TO authenticated USING (public.is_manager()) WITH CHECK (public.is_manager());
CREATE POLICY "items_delete_policy" ON public.items FOR DELETE TO authenticated USING (public.is_manager());

CREATE POLICY "item_departments_select_policy" ON public.item_departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "item_departments_insert_policy" ON public.item_departments FOR INSERT TO authenticated WITH CHECK (public.is_manager());
CREATE POLICY "item_departments_update_policy" ON public.item_departments FOR UPDATE TO authenticated USING (public.is_manager()) WITH CHECK (public.is_manager());
CREATE POLICY "item_departments_delete_policy" ON public.item_departments FOR DELETE TO authenticated USING (public.is_manager());

-- 4. Create policies for ledger tables (Manager + Inventory staff write, Authenticated read)
-- Received Ledger
CREATE POLICY "received_ledger_select" ON public.received_ledger FOR SELECT TO authenticated USING (true);
CREATE POLICY "received_ledger_insert" ON public.received_ledger FOR INSERT TO authenticated WITH CHECK (public.has_ledger_write_access());
CREATE POLICY "received_ledger_update" ON public.received_ledger FOR UPDATE TO authenticated USING (public.has_ledger_write_access()) WITH CHECK (public.has_ledger_write_access());
CREATE POLICY "received_ledger_delete" ON public.received_ledger FOR DELETE TO authenticated USING (public.has_ledger_write_access());

-- Transfer Ledger
CREATE POLICY "transfer_ledger_select" ON public.transfer_ledger FOR SELECT TO authenticated USING (true);
CREATE POLICY "transfer_ledger_insert" ON public.transfer_ledger FOR INSERT TO authenticated WITH CHECK (public.has_ledger_write_access());
CREATE POLICY "transfer_ledger_update" ON public.transfer_ledger FOR UPDATE TO authenticated USING (public.has_ledger_write_access()) WITH CHECK (public.has_ledger_write_access());
CREATE POLICY "transfer_ledger_delete" ON public.transfer_ledger FOR DELETE TO authenticated USING (public.has_ledger_write_access());

-- Issuance Ledger
CREATE POLICY "issuance_ledger_select" ON public.issuance_ledger FOR SELECT TO authenticated USING (true);
CREATE POLICY "issuance_ledger_insert" ON public.issuance_ledger FOR INSERT TO authenticated WITH CHECK (public.has_ledger_write_access());
CREATE POLICY "issuance_ledger_update" ON public.issuance_ledger FOR UPDATE TO authenticated USING (public.has_ledger_write_access()) WITH CHECK (public.has_ledger_write_access());
CREATE POLICY "issuance_ledger_delete" ON public.issuance_ledger FOR DELETE TO authenticated USING (public.has_ledger_write_access());

-- Daily Stock Sheets
CREATE POLICY "daily_stock_sheets_select" ON public.daily_stock_sheets FOR SELECT TO authenticated USING (true);
CREATE POLICY "daily_stock_sheets_insert" ON public.daily_stock_sheets FOR INSERT TO authenticated WITH CHECK (public.has_ledger_write_access());
CREATE POLICY "daily_stock_sheets_update" ON public.daily_stock_sheets FOR UPDATE TO authenticated USING (public.has_ledger_write_access()) WITH CHECK (public.has_ledger_write_access());
CREATE POLICY "daily_stock_sheets_delete" ON public.daily_stock_sheets FOR DELETE TO authenticated USING (public.has_ledger_write_access());

-- Inventory Transactions
CREATE POLICY "inventory_transactions_select" ON public.inventory_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "inventory_transactions_insert" ON public.inventory_transactions FOR INSERT TO authenticated WITH CHECK (public.has_ledger_write_access());
CREATE POLICY "inventory_transactions_update" ON public.inventory_transactions FOR UPDATE TO authenticated USING (public.has_ledger_write_access()) WITH CHECK (public.has_ledger_write_access());
CREATE POLICY "inventory_transactions_delete" ON public.inventory_transactions FOR DELETE TO authenticated USING (public.has_ledger_write_access());

-- Reach Sales Reports
CREATE POLICY "reach_sales_reports_select" ON public.reach_sales_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "reach_sales_reports_insert" ON public.reach_sales_reports FOR INSERT TO authenticated WITH CHECK (public.has_ledger_write_access());
CREATE POLICY "reach_sales_reports_update" ON public.reach_sales_reports FOR UPDATE TO authenticated USING (public.has_ledger_write_access()) WITH CHECK (public.has_ledger_write_access());
CREATE POLICY "reach_sales_reports_delete" ON public.reach_sales_reports FOR DELETE TO authenticated USING (public.has_ledger_write_access());
