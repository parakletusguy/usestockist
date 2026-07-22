-- Create item_departments junction table for many-to-many item-department assignments
CREATE TABLE IF NOT EXISTS public.item_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  department TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(item_id, department)
);

ALTER TABLE public.item_departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_item_departments" ON public.item_departments FOR SELECT USING (true);
CREATE POLICY "insert_item_departments" ON public.item_departments FOR INSERT WITH CHECK (true);
CREATE POLICY "delete_item_departments" ON public.item_departments FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS idx_item_departments_item_id ON public.item_departments(item_id);
CREATE INDEX IF NOT EXISTS idx_item_departments_department ON public.item_departments(department);

-- Permissive RLS on all ledger tables for fast loading
DROP POLICY IF EXISTS "select_issuance_ledger" ON public.issuance_ledger;
CREATE POLICY "select_issuance_ledger" ON public.issuance_ledger FOR SELECT USING (true);
DROP POLICY IF EXISTS "insert_issuance_ledger" ON public.issuance_ledger;
CREATE POLICY "insert_issuance_ledger" ON public.issuance_ledger FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "update_issuance_ledger" ON public.issuance_ledger;
CREATE POLICY "update_issuance_ledger" ON public.issuance_ledger FOR UPDATE USING (true);

DROP POLICY IF EXISTS "select_transfer_ledger" ON public.transfer_ledger;
CREATE POLICY "select_transfer_ledger" ON public.transfer_ledger FOR SELECT USING (true);
DROP POLICY IF EXISTS "insert_transfer_ledger" ON public.transfer_ledger;
CREATE POLICY "insert_transfer_ledger" ON public.transfer_ledger FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "update_transfer_ledger" ON public.transfer_ledger;
CREATE POLICY "update_transfer_ledger" ON public.transfer_ledger FOR UPDATE USING (true);

DROP POLICY IF EXISTS "select_received_ledger" ON public.received_ledger;
CREATE POLICY "select_received_ledger" ON public.received_ledger FOR SELECT USING (true);
DROP POLICY IF EXISTS "insert_received_ledger" ON public.received_ledger;
CREATE POLICY "insert_received_ledger" ON public.received_ledger FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "update_received_ledger" ON public.received_ledger;
CREATE POLICY "update_received_ledger" ON public.received_ledger FOR UPDATE USING (true);
