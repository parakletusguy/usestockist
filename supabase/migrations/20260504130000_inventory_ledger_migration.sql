-- Create inventory transaction type enum
CREATE TYPE public.inventory_transaction_type AS ENUM ('receive', 'sale', 'damage', 'adjustment');

-- Create inventory transactions table
CREATE TABLE public.inventory_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  type public.inventory_transaction_type NOT NULL,
  quantity NUMERIC NOT NULL,
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_inventory_transactions_item_id ON public.inventory_transactions(item_id);
CREATE INDEX idx_inventory_transactions_date ON public.inventory_transactions(transaction_date);
CREATE INDEX idx_inventory_transactions_type ON public.inventory_transactions(type);

-- Enable RLS
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for inventory_transactions
CREATE POLICY "Authenticated users can select inventory_transactions"
ON public.inventory_transactions FOR SELECT
TO authenticated
USING (public.is_authenticated());

CREATE POLICY "Authenticated users can insert inventory_transactions"
ON public.inventory_transactions FOR INSERT
TO authenticated
WITH CHECK (public.is_authenticated());

CREATE POLICY "Authenticated users can update inventory_transactions"
ON public.inventory_transactions FOR UPDATE
TO authenticated
USING (public.is_authenticated());

CREATE POLICY "Admins can delete inventory_transactions"
ON public.inventory_transactions FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Migration for get_daily_inventory_report RPC
CREATE OR REPLACE FUNCTION public.get_daily_inventory_report(p_start_date TIMESTAMP WITH TIME ZONE, p_end_date TIMESTAMP WITH TIME ZONE)
RETURNS TABLE (
  item_id UUID,
  item_name TEXT,
  unit_of_measure TEXT,
  category TEXT,
  opening_stock NUMERIC,
  qty_received NUMERIC,
  qty_sold NUMERIC,
  damages NUMERIC,
  calculated_closing_stock NUMERIC,
  physical_count NUMERIC,
  variance NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH item_list AS (
    SELECT id, name, unit_of_measure, category FROM public.items
  ),
  opening_balances AS (
    SELECT 
      t.item_id,
      SUM(
        CASE 
          WHEN t.type = 'receive' THEN t.quantity
          WHEN t.type = 'sale' THEN -t.quantity
          WHEN t.type = 'damage' THEN -t.quantity
          WHEN t.type = 'adjustment' THEN t.quantity -- adjustments should represent the DELTA from theoretical
          ELSE 0
        END
      ) as opening_stock
    FROM public.inventory_transactions t
    WHERE t.transaction_date < p_start_date
    GROUP BY t.item_id
  ),
  period_transactions AS (
    SELECT 
      t.item_id,
      SUM(CASE WHEN t.type = 'receive' THEN t.quantity ELSE 0 END) as received,
      SUM(CASE WHEN t.type = 'sale' THEN t.quantity ELSE 0 END) as sold,
      SUM(CASE WHEN t.type = 'damage' THEN t.quantity ELSE 0 END) as damaged,
      SUM(CASE WHEN t.type = 'adjustment' THEN t.quantity ELSE 0 END) as adjusted,
      -- Also get the latest physical count value if stored in notes or similar, 
      -- but usually adjustment is the delta. Let's assume adjustment IS the delta to reach physical count.
      -- If physical_count itself needs to be displayed, we might need a separate field. 
      -- Let's extract physical count from notes if it's formatted like 'Physical Count: 50' or similar, 
      -- otherwise we just calculate variance as the total adjustments in the period.
      SUM(CASE WHEN t.type = 'adjustment' THEN t.quantity ELSE 0 END) as variance_val
    FROM public.inventory_transactions t
    WHERE t.transaction_date >= p_start_date AND t.transaction_date <= p_end_date
    GROUP BY t.item_id
  )
  SELECT 
    i.id as item_id,
    i.name as item_name,
    i.unit_of_measure,
    i.category,
    COALESCE(ob.opening_stock, 0) as opening_stock,
    COALESCE(pt.received, 0) as qty_received,
    COALESCE(pt.sold, 0) as qty_sold,
    COALESCE(pt.damaged, 0) as damages,
    (COALESCE(ob.opening_stock, 0) + COALESCE(pt.received, 0) - COALESCE(pt.sold, 0) - COALESCE(pt.damaged, 0) + COALESCE(pt.adjusted, 0)) as calculated_closing_stock,
    -- If variance is adjustment, physical count is calculated_closing_stock (which includes adjustment).
    -- Wait, if calculated_closing_stock includes the adjustment, then it MATCHES physical count.
    -- Theoretical closing stock (before adjustment) = opening + received - sold - damages.
    -- Physical count = Theoretical closing stock + adjustment.
    -- Variance = adjustment.
    (COALESCE(ob.opening_stock, 0) + COALESCE(pt.received, 0) - COALESCE(pt.sold, 0) - COALESCE(pt.damaged, 0) + COALESCE(pt.adjusted, 0)) as physical_count,
    COALESCE(pt.adjusted, 0) as variance
  FROM item_list i
  LEFT JOIN opening_balances ob ON i.id = ob.item_id
  LEFT JOIN period_transactions pt ON i.id = pt.item_id
  WHERE COALESCE(ob.opening_stock, 0) != 0 
     OR COALESCE(pt.received, 0) != 0 
     OR COALESCE(pt.sold, 0) != 0 
     OR COALESCE(pt.damaged, 0) != 0 
     OR COALESCE(pt.adjusted, 0) != 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
