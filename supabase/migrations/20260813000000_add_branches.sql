-- Phase 1 Migration: Multi-Branch Infrastructure

-- 1. Create public.branches table
CREATE TABLE IF NOT EXISTS public.branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.branches TO authenticated, anon;
GRANT ALL ON public.branches TO service_role;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'branches' AND policyname = 'Anyone view active branches') THEN
    CREATE POLICY "Anyone view active branches" ON public.branches
      FOR SELECT TO authenticated, anon USING (is_active = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'branches' AND policyname = 'Admins manage branches') THEN
    CREATE POLICY "Admins manage branches" ON public.branches
      FOR ALL TO authenticated
      USING (private.has_role(auth.uid(), 'admin'::public.app_role))
      WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
  END IF;
END $$;

-- 2. Seed default "Main Branch" with a deterministic fixed UUID
INSERT INTO public.branches (id, name, is_active)
VALUES ('00000000-0000-0000-0000-000000000001', 'Main Branch', true)
ON CONFLICT (name) DO NOTHING;

-- 3. Create public.user_branches junction table
CREATE TABLE IF NOT EXISTS public.user_branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, branch_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_branches TO authenticated;
GRANT ALL ON public.user_branches TO service_role;
ALTER TABLE public.user_branches ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_branches' AND policyname = 'Users view own branch assignments') THEN
    CREATE POLICY "Users view own branch assignments" ON public.user_branches
      FOR SELECT TO authenticated
      USING (user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::public.app_role));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_branches' AND policyname = 'Admins manage branch assignments') THEN
    CREATE POLICY "Admins manage branch assignments" ON public.user_branches
      FOR ALL TO authenticated
      USING (private.has_role(auth.uid(), 'admin'::public.app_role))
      WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
  END IF;
END $$;

-- 4. Add branch_id to stock tables (with default Main Branch ID)
ALTER TABLE public.daily_stock_sheets
  ADD COLUMN IF NOT EXISTS branch_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES public.branches(id) ON DELETE RESTRICT;

ALTER TABLE public.received_ledger
  ADD COLUMN IF NOT EXISTS branch_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES public.branches(id) ON DELETE RESTRICT;

ALTER TABLE public.transfer_ledger
  ADD COLUMN IF NOT EXISTS branch_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES public.branches(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS destination_branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL;

ALTER TABLE public.issuance_ledger
  ADD COLUMN IF NOT EXISTS branch_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES public.branches(id) ON DELETE RESTRICT;

ALTER TABLE public.inventory_transactions
  ADD COLUMN IF NOT EXISTS branch_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES public.branches(id) ON DELETE RESTRICT;

ALTER TABLE public.weekly_stock_counts
  ADD COLUMN IF NOT EXISTS branch_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES public.branches(id) ON DELETE RESTRICT;

-- 5. Add branch-scoped indexes
CREATE INDEX IF NOT EXISTS dss_branch_date_idx ON public.daily_stock_sheets(branch_id, date DESC);
CREATE INDEX IF NOT EXISTS rcv_branch_date_idx ON public.received_ledger(branch_id, date DESC);
CREATE INDEX IF NOT EXISTS trn_branch_date_idx ON public.transfer_ledger(branch_id, date DESC);
CREATE INDEX IF NOT EXISTS trn_dest_branch_idx ON public.transfer_ledger(destination_branch_id) WHERE destination_branch_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS iss_branch_date_idx ON public.issuance_ledger(branch_id, date DESC);
CREATE INDEX IF NOT EXISTS invtx_branch_date_idx ON public.inventory_transactions(branch_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS wsc_branch_date_idx ON public.weekly_stock_counts(branch_id, date DESC);

-- 6. Helper function to check if current user has access to a branch
CREATE OR REPLACE FUNCTION public.user_has_branch_access(_branch_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_branches WHERE user_id = auth.uid() AND branch_id = _branch_id
  ) OR private.has_role(auth.uid(), 'admin'::public.app_role);
$$;

GRANT EXECUTE ON FUNCTION public.user_has_branch_access(uuid) TO authenticated, service_role;
