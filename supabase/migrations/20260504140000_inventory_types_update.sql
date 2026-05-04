-- Add new types to the enum
ALTER TYPE public.inventory_transaction_type ADD VALUE IF NOT EXISTS 'issuance';
ALTER TYPE public.inventory_transaction_type ADD VALUE IF NOT EXISTS 'transfer';

-- Add metadata column to store extra fields like supplier, recipient, etc.
ALTER TABLE public.inventory_transactions ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Drop the existing function to recreate it with the new return table structure
DROP FUNCTION IF EXISTS public.get_daily_inventory_report(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE);

-- Recreate the function with the updated columns
CREATE OR REPLACE FUNCTION public.get_daily_inventory_report(p_start_date TIMESTAMP WITH TIME ZONE, p_end_date TIMESTAMP WITH TIME ZONE)
RETURNS TABLE (
  item_id UUID,
  item_name TEXT,
  unit_of_measure TEXT,
  category TEXT,
  opening_stock NUMERIC,
  qty_received NUMERIC,
  qty_sold NUMERIC,
  qty_issued NUMERIC,
  qty_transferred NUMERIC,
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
          WHEN t.type = 'issuance' THEN -t.quantity
          WHEN t.type = 'transfer' THEN -t.quantity
          WHEN t.type = 'damage' THEN -t.quantity
          WHEN t.type = 'adjustment' THEN t.quantity
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
      SUM(CASE WHEN t.type = 'issuance' THEN t.quantity ELSE 0 END) as issued,
      SUM(CASE WHEN t.type = 'transfer' THEN t.quantity ELSE 0 END) as transferred,
      SUM(CASE WHEN t.type = 'damage' THEN t.quantity ELSE 0 END) as damaged,
      SUM(CASE WHEN t.type = 'adjustment' THEN t.quantity ELSE 0 END) as adjusted
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
    COALESCE(pt.issued, 0) as qty_issued,
    COALESCE(pt.transferred, 0) as qty_transferred,
    COALESCE(pt.damaged, 0) as damages,
    (COALESCE(ob.opening_stock, 0) + COALESCE(pt.received, 0) - COALESCE(pt.sold, 0) - COALESCE(pt.issued, 0) - COALESCE(pt.transferred, 0) - COALESCE(pt.damaged, 0) + COALESCE(pt.adjusted, 0)) as calculated_closing_stock,
    (COALESCE(ob.opening_stock, 0) + COALESCE(pt.received, 0) - COALESCE(pt.sold, 0) - COALESCE(pt.issued, 0) - COALESCE(pt.transferred, 0) - COALESCE(pt.damaged, 0) + COALESCE(pt.adjusted, 0)) as physical_count,
    COALESCE(pt.adjusted, 0) as variance
  FROM item_list i
  LEFT JOIN opening_balances ob ON i.id = ob.item_id
  LEFT JOIN period_transactions pt ON i.id = pt.item_id
  WHERE COALESCE(ob.opening_stock, 0) != 0 
     OR COALESCE(pt.received, 0) != 0 
     OR COALESCE(pt.sold, 0) != 0 
     OR COALESCE(pt.issued, 0) != 0 
     OR COALESCE(pt.transferred, 0) != 0 
     OR COALESCE(pt.damaged, 0) != 0 
     OR COALESCE(pt.adjusted, 0) != 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
