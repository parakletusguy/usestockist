
-- Fix 1: Restrict DELETE on remaining tables to admins only
-- items table
DROP POLICY IF EXISTS "Authenticated users can delete items" ON public.items;
CREATE POLICY "Admins can delete items"
  ON public.items FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- issuance_ledger
DROP POLICY IF EXISTS "Authenticated users can delete issuance_ledger" ON public.issuance_ledger;
CREATE POLICY "Admins can delete issuance_ledger"
  ON public.issuance_ledger FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- received_ledger
DROP POLICY IF EXISTS "Authenticated users can delete received_ledger" ON public.received_ledger;
CREATE POLICY "Admins can delete received_ledger"
  ON public.received_ledger FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- transfer_ledger
DROP POLICY IF EXISTS "Authenticated users can delete transfer_ledger" ON public.transfer_ledger;
CREATE POLICY "Admins can delete transfer_ledger"
  ON public.transfer_ledger FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- weekly_stock_counts
DROP POLICY IF EXISTS "Authenticated users can delete weekly_stock_counts" ON public.weekly_stock_counts;
CREATE POLICY "Admins can delete weekly_stock_counts"
  ON public.weekly_stock_counts FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Fix 2: user_roles - the SELECT policy already restricts to user_id = auth.uid()
-- which is correct. But let's make it explicit that non-admins can't enumerate others.
-- The existing policy is fine: "Users can view own roles" USING (user_id = auth.uid())
-- and "Admins can manage roles" USING (has_role(auth.uid(), 'admin'))
-- No change needed here - the finding is a false positive since users can only see their own rows.
