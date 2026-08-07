CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

CREATE TABLE public.user_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  team_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, team_name)
);
GRANT SELECT ON public.user_teams TO authenticated;
GRANT ALL ON public.user_teams TO service_role;
ALTER TABLE public.user_teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own teams" ON public.user_teams FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  department text NOT NULL DEFAULT 'Retail',
  unit_of_measure text NOT NULL,
  low_stock_threshold numeric NOT NULL DEFAULT 0,
  unit_cost numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.items TO authenticated;
GRANT ALL ON public.items TO service_role;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users view items" ON public.items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers create items" ON public.items FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "Managers update items" ON public.items FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "Admins delete items" ON public.items FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.item_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  department text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (item_id, department)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.item_departments TO authenticated;
GRANT ALL ON public.item_departments TO service_role;
ALTER TABLE public.item_departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users view item departments" ON public.item_departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers create item departments" ON public.item_departments FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "Managers update item departments" ON public.item_departments FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "Admins delete item departments" ON public.item_departments FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.daily_stock_sheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  retail_team_name text NOT NULL,
  item_id uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  open_qty numeric NOT NULL DEFAULT 0,
  qty_in numeric NOT NULL DEFAULT 0,
  close_qty numeric NOT NULL DEFAULT 0,
  sales_qty numeric NOT NULL DEFAULT 0,
  reach numeric NOT NULL DEFAULT 0,
  os_status text,
  remark text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (date, retail_team_name, item_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_stock_sheets TO authenticated;
GRANT ALL ON public.daily_stock_sheets TO service_role;
ALTER TABLE public.daily_stock_sheets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users view daily sheets" ON public.daily_stock_sheets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers create daily sheets" ON public.daily_stock_sheets FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "Managers update daily sheets" ON public.daily_stock_sheets FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "Admins delete daily sheets" ON public.daily_stock_sheets FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.weekly_stock_counts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  location text NOT NULL,
  item_id uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  physical_count numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weekly_stock_counts TO authenticated;
GRANT ALL ON public.weekly_stock_counts TO service_role;
ALTER TABLE public.weekly_stock_counts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users view weekly counts" ON public.weekly_stock_counts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers create weekly counts" ON public.weekly_stock_counts FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "Managers update weekly counts" ON public.weekly_stock_counts FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "Admins delete weekly counts" ON public.weekly_stock_counts FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.issuance_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  recipient_group text NOT NULL,
  item_id uuid NOT NULL REFERENCES public.items(id) ON DELETE RESTRICT,
  quantity numeric NOT NULL CHECK (quantity > 0),
  issued_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.issuance_ledger TO authenticated;
GRANT ALL ON public.issuance_ledger TO service_role;
ALTER TABLE public.issuance_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users view issuance" ON public.issuance_ledger FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers create issuance" ON public.issuance_ledger FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "Managers update issuance" ON public.issuance_ledger FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "Admins delete issuance" ON public.issuance_ledger FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.transfer_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  destination text NOT NULL,
  item_id uuid NOT NULL REFERENCES public.items(id) ON DELETE RESTRICT,
  quantity numeric NOT NULL CHECK (quantity > 0),
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transfer_ledger TO authenticated;
GRANT ALL ON public.transfer_ledger TO service_role;
ALTER TABLE public.transfer_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users view transfers" ON public.transfer_ledger FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers create transfers" ON public.transfer_ledger FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "Managers update transfers" ON public.transfer_ledger FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "Admins delete transfers" ON public.transfer_ledger FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.received_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  supplier text NOT NULL,
  item_id uuid NOT NULL REFERENCES public.items(id) ON DELETE RESTRICT,
  quantity numeric NOT NULL CHECK (quantity > 0),
  invoice_number text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.received_ledger TO authenticated;
GRANT ALL ON public.received_ledger TO service_role;
ALTER TABLE public.received_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users view receipts" ON public.received_ledger FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers create receipts" ON public.received_ledger FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "Managers update receipts" ON public.received_ledger FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "Admins delete receipts" ON public.received_ledger FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('receive', 'issuance', 'transfer', 'sale', 'damage')),
  quantity numeric NOT NULL DEFAULT 0,
  transaction_date timestamptz NOT NULL DEFAULT now(),
  department text NOT NULL DEFAULT 'Retail',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_transactions TO authenticated;
GRANT ALL ON public.inventory_transactions TO service_role;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users view transactions" ON public.inventory_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers create transactions" ON public.inventory_transactions FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "Managers update transactions" ON public.inventory_transactions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "Admins delete transactions" ON public.inventory_transactions FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER items_updated_at BEFORE UPDATE ON public.items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER daily_stock_sheets_updated_at BEFORE UPDATE ON public.daily_stock_sheets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER weekly_stock_counts_updated_at BEFORE UPDATE ON public.weekly_stock_counts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER issuance_ledger_updated_at BEFORE UPDATE ON public.issuance_ledger FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER transfer_ledger_updated_at BEFORE UPDATE ON public.transfer_ledger FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER received_ledger_updated_at BEFORE UPDATE ON public.received_ledger FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX item_departments_item_idx ON public.item_departments(item_id);
CREATE INDEX daily_stock_sheets_date_item_idx ON public.daily_stock_sheets(date, item_id);
CREATE INDEX weekly_stock_counts_date_item_idx ON public.weekly_stock_counts(date, item_id);
CREATE INDEX issuance_ledger_date_idx ON public.issuance_ledger(date DESC);
CREATE INDEX transfer_ledger_date_idx ON public.transfer_ledger(date DESC);
CREATE INDEX received_ledger_date_idx ON public.received_ledger(date DESC);
CREATE INDEX inventory_transactions_date_item_idx ON public.inventory_transactions(transaction_date DESC, item_id);