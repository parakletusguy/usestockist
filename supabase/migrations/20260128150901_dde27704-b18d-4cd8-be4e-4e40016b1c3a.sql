-- Helper function to check if user is authenticated
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
$$;

-- Create items table (master list)
CREATE TABLE public.items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit_of_measure TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create daily_stock_sheets table
CREATE TABLE public.daily_stock_sheets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  retail_team_name TEXT NOT NULL,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  open_qty NUMERIC NOT NULL DEFAULT 0,
  qty_in NUMERIC NOT NULL DEFAULT 0,
  close_qty NUMERIC NOT NULL DEFAULT 0,
  sales_qty NUMERIC NOT NULL DEFAULT 0,
  reach TEXT,
  os_status TEXT,
  remark TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create weekly_stock_counts table
CREATE TABLE public.weekly_stock_counts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  location TEXT NOT NULL,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  physical_count NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create issuance_ledger table
CREATE TABLE public.issuance_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  recipient_group TEXT NOT NULL,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL DEFAULT 0,
  issued_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transfer_ledger table
CREATE TABLE public.transfer_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  destination TEXT NOT NULL,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL DEFAULT 0,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create received_ledger table
CREATE TABLE public.received_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  supplier TEXT NOT NULL,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL DEFAULT 0,
  invoice_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_stock_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_stock_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issuance_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.received_ledger ENABLE ROW LEVEL SECURITY;

-- RLS policies for items
CREATE POLICY "Authenticated users can select items"
ON public.items FOR SELECT
TO authenticated
USING (public.is_authenticated());

CREATE POLICY "Authenticated users can insert items"
ON public.items FOR INSERT
TO authenticated
WITH CHECK (public.is_authenticated());

CREATE POLICY "Authenticated users can update items"
ON public.items FOR UPDATE
TO authenticated
USING (public.is_authenticated());

CREATE POLICY "Authenticated users can delete items"
ON public.items FOR DELETE
TO authenticated
USING (public.is_authenticated());

-- RLS policies for daily_stock_sheets
CREATE POLICY "Authenticated users can select daily_stock_sheets"
ON public.daily_stock_sheets FOR SELECT
TO authenticated
USING (public.is_authenticated());

CREATE POLICY "Authenticated users can insert daily_stock_sheets"
ON public.daily_stock_sheets FOR INSERT
TO authenticated
WITH CHECK (public.is_authenticated());

CREATE POLICY "Authenticated users can update daily_stock_sheets"
ON public.daily_stock_sheets FOR UPDATE
TO authenticated
USING (public.is_authenticated());

CREATE POLICY "Authenticated users can delete daily_stock_sheets"
ON public.daily_stock_sheets FOR DELETE
TO authenticated
USING (public.is_authenticated());

-- RLS policies for weekly_stock_counts
CREATE POLICY "Authenticated users can select weekly_stock_counts"
ON public.weekly_stock_counts FOR SELECT
TO authenticated
USING (public.is_authenticated());

CREATE POLICY "Authenticated users can insert weekly_stock_counts"
ON public.weekly_stock_counts FOR INSERT
TO authenticated
WITH CHECK (public.is_authenticated());

CREATE POLICY "Authenticated users can update weekly_stock_counts"
ON public.weekly_stock_counts FOR UPDATE
TO authenticated
USING (public.is_authenticated());

CREATE POLICY "Authenticated users can delete weekly_stock_counts"
ON public.weekly_stock_counts FOR DELETE
TO authenticated
USING (public.is_authenticated());

-- RLS policies for issuance_ledger
CREATE POLICY "Authenticated users can select issuance_ledger"
ON public.issuance_ledger FOR SELECT
TO authenticated
USING (public.is_authenticated());

CREATE POLICY "Authenticated users can insert issuance_ledger"
ON public.issuance_ledger FOR INSERT
TO authenticated
WITH CHECK (public.is_authenticated());

CREATE POLICY "Authenticated users can update issuance_ledger"
ON public.issuance_ledger FOR UPDATE
TO authenticated
USING (public.is_authenticated());

CREATE POLICY "Authenticated users can delete issuance_ledger"
ON public.issuance_ledger FOR DELETE
TO authenticated
USING (public.is_authenticated());

-- RLS policies for transfer_ledger
CREATE POLICY "Authenticated users can select transfer_ledger"
ON public.transfer_ledger FOR SELECT
TO authenticated
USING (public.is_authenticated());

CREATE POLICY "Authenticated users can insert transfer_ledger"
ON public.transfer_ledger FOR INSERT
TO authenticated
WITH CHECK (public.is_authenticated());

CREATE POLICY "Authenticated users can update transfer_ledger"
ON public.transfer_ledger FOR UPDATE
TO authenticated
USING (public.is_authenticated());

CREATE POLICY "Authenticated users can delete transfer_ledger"
ON public.transfer_ledger FOR DELETE
TO authenticated
USING (public.is_authenticated());

-- RLS policies for received_ledger
CREATE POLICY "Authenticated users can select received_ledger"
ON public.received_ledger FOR SELECT
TO authenticated
USING (public.is_authenticated());

CREATE POLICY "Authenticated users can insert received_ledger"
ON public.received_ledger FOR INSERT
TO authenticated
WITH CHECK (public.is_authenticated());

CREATE POLICY "Authenticated users can update received_ledger"
ON public.received_ledger FOR UPDATE
TO authenticated
USING (public.is_authenticated());

CREATE POLICY "Authenticated users can delete received_ledger"
ON public.received_ledger FOR DELETE
TO authenticated
USING (public.is_authenticated());

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for tables with updated_at
CREATE TRIGGER update_items_updated_at
BEFORE UPDATE ON public.items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_stock_sheets_updated_at
BEFORE UPDATE ON public.daily_stock_sheets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX idx_daily_stock_sheets_date ON public.daily_stock_sheets(date);
CREATE INDEX idx_daily_stock_sheets_team ON public.daily_stock_sheets(retail_team_name);
CREATE INDEX idx_weekly_stock_counts_date ON public.weekly_stock_counts(date);
CREATE INDEX idx_weekly_stock_counts_location ON public.weekly_stock_counts(location);
CREATE INDEX idx_issuance_ledger_date ON public.issuance_ledger(date);
CREATE INDEX idx_transfer_ledger_date ON public.transfer_ledger(date);
CREATE INDEX idx_received_ledger_date ON public.received_ledger(date);