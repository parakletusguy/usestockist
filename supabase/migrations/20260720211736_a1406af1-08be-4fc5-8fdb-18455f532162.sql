
-- 1) Create private schema for authorization helpers (not exposed via PostgREST)
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

-- 2) Recreate helper functions inside private
CREATE OR REPLACE FUNCTION private.is_authenticated()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$ SELECT auth.uid() IS NOT NULL $$;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION private.user_belongs_to_team(_user_id uuid, _team_name text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_teams
    WHERE user_id = _user_id AND team_name = _team_name
  )
$$;

REVOKE ALL ON FUNCTION private.is_authenticated() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.user_belongs_to_team(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_authenticated() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.user_belongs_to_team(uuid, text) TO authenticated, service_role;

-- 3) Drop all existing policies that depend on public helper functions
DROP POLICY IF EXISTS "Admins can delete stock sheets" ON public.daily_stock_sheets;
DROP POLICY IF EXISTS "Users can insert own team stock sheets" ON public.daily_stock_sheets;
DROP POLICY IF EXISTS "Users can select own team stock sheets" ON public.daily_stock_sheets;
DROP POLICY IF EXISTS "Users can update own team stock sheets" ON public.daily_stock_sheets;

DROP POLICY IF EXISTS "Admins can delete issuance_ledger" ON public.issuance_ledger;
DROP POLICY IF EXISTS "Authenticated users can insert issuance_ledger" ON public.issuance_ledger;
DROP POLICY IF EXISTS "Authenticated users can select issuance_ledger" ON public.issuance_ledger;
DROP POLICY IF EXISTS "Authenticated users can update issuance_ledger" ON public.issuance_ledger;

DROP POLICY IF EXISTS "Admins can delete items" ON public.items;
DROP POLICY IF EXISTS "Authenticated users can insert items" ON public.items;
DROP POLICY IF EXISTS "Authenticated users can select items" ON public.items;
DROP POLICY IF EXISTS "Authenticated users can update items" ON public.items;

DROP POLICY IF EXISTS "Admins can delete received_ledger" ON public.received_ledger;
DROP POLICY IF EXISTS "Authenticated users can insert received_ledger" ON public.received_ledger;
DROP POLICY IF EXISTS "Authenticated users can select received_ledger" ON public.received_ledger;
DROP POLICY IF EXISTS "Authenticated users can update received_ledger" ON public.received_ledger;

DROP POLICY IF EXISTS "Admins can delete transfer_ledger" ON public.transfer_ledger;
DROP POLICY IF EXISTS "Authenticated users can insert transfer_ledger" ON public.transfer_ledger;
DROP POLICY IF EXISTS "Authenticated users can select transfer_ledger" ON public.transfer_ledger;
DROP POLICY IF EXISTS "Authenticated users can update transfer_ledger" ON public.transfer_ledger;

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage team assignments" ON public.user_teams;
DROP POLICY IF EXISTS "Users can view own team assignments" ON public.user_teams;

DROP POLICY IF EXISTS "Admins can delete weekly_stock_counts" ON public.weekly_stock_counts;
DROP POLICY IF EXISTS "Authenticated users can insert weekly_stock_counts" ON public.weekly_stock_counts;
DROP POLICY IF EXISTS "Authenticated users can select weekly_stock_counts" ON public.weekly_stock_counts;
DROP POLICY IF EXISTS "Authenticated users can update weekly_stock_counts" ON public.weekly_stock_counts;

-- 4) Drop old public helper functions now that no policy depends on them
DROP FUNCTION IF EXISTS public.is_authenticated();
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
DROP FUNCTION IF EXISTS public.user_belongs_to_team(uuid, text);

-- 5) Recreate policies using private.* helpers with tightened write access

-- daily_stock_sheets (team-scoped, unchanged intent)
CREATE POLICY "select_daily_stock_sheets" ON public.daily_stock_sheets FOR SELECT
  USING (private.user_belongs_to_team(auth.uid(), retail_team_name) OR private.has_role(auth.uid(), 'admin'));
CREATE POLICY "insert_daily_stock_sheets" ON public.daily_stock_sheets FOR INSERT
  WITH CHECK (private.user_belongs_to_team(auth.uid(), retail_team_name) OR private.has_role(auth.uid(), 'admin'));
CREATE POLICY "update_daily_stock_sheets" ON public.daily_stock_sheets FOR UPDATE
  USING (private.user_belongs_to_team(auth.uid(), retail_team_name) OR private.has_role(auth.uid(), 'admin'));
CREATE POLICY "delete_daily_stock_sheets" ON public.daily_stock_sheets FOR DELETE
  USING (private.has_role(auth.uid(), 'admin'));

-- items: read for authenticated; write restricted to admin/moderator
CREATE POLICY "select_items" ON public.items FOR SELECT
  USING (private.is_authenticated());
CREATE POLICY "insert_items" ON public.items FOR INSERT
  WITH CHECK (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'moderator'));
CREATE POLICY "update_items" ON public.items FOR UPDATE
  USING (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'moderator'));
CREATE POLICY "delete_items" ON public.items FOR DELETE
  USING (private.has_role(auth.uid(), 'admin'));

-- issuance_ledger
CREATE POLICY "select_issuance_ledger" ON public.issuance_ledger FOR SELECT
  USING (private.is_authenticated());
CREATE POLICY "insert_issuance_ledger" ON public.issuance_ledger FOR INSERT
  WITH CHECK (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'moderator'));
CREATE POLICY "update_issuance_ledger" ON public.issuance_ledger FOR UPDATE
  USING (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'moderator'));
CREATE POLICY "delete_issuance_ledger" ON public.issuance_ledger FOR DELETE
  USING (private.has_role(auth.uid(), 'admin'));

-- received_ledger
CREATE POLICY "select_received_ledger" ON public.received_ledger FOR SELECT
  USING (private.is_authenticated());
CREATE POLICY "insert_received_ledger" ON public.received_ledger FOR INSERT
  WITH CHECK (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'moderator'));
CREATE POLICY "update_received_ledger" ON public.received_ledger FOR UPDATE
  USING (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'moderator'));
CREATE POLICY "delete_received_ledger" ON public.received_ledger FOR DELETE
  USING (private.has_role(auth.uid(), 'admin'));

-- transfer_ledger
CREATE POLICY "select_transfer_ledger" ON public.transfer_ledger FOR SELECT
  USING (private.is_authenticated());
CREATE POLICY "insert_transfer_ledger" ON public.transfer_ledger FOR INSERT
  WITH CHECK (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'moderator'));
CREATE POLICY "update_transfer_ledger" ON public.transfer_ledger FOR UPDATE
  USING (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'moderator'));
CREATE POLICY "delete_transfer_ledger" ON public.transfer_ledger FOR DELETE
  USING (private.has_role(auth.uid(), 'admin'));

-- weekly_stock_counts
CREATE POLICY "select_weekly_stock_counts" ON public.weekly_stock_counts FOR SELECT
  USING (private.is_authenticated());
CREATE POLICY "insert_weekly_stock_counts" ON public.weekly_stock_counts FOR INSERT
  WITH CHECK (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'moderator'));
CREATE POLICY "update_weekly_stock_counts" ON public.weekly_stock_counts FOR UPDATE
  USING (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'moderator'));
CREATE POLICY "delete_weekly_stock_counts" ON public.weekly_stock_counts FOR DELETE
  USING (private.has_role(auth.uid(), 'admin'));

-- user_roles / user_teams (restored)
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own team assignments" ON public.user_teams FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "Admins can manage team assignments" ON public.user_teams FOR ALL
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));
