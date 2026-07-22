-- Update get_daily_inventory_report to use item_departments junction table
-- so items assigned to multiple departments appear in each department's stock count

CREATE OR REPLACE FUNCTION public.get_daily_inventory_report(
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE,
  p_include_zero_activity BOOLEAN DEFAULT true,
  p_department TEXT DEFAULT NULL
)
RETURNS TABLE (
  item_id UUID,
  item_name TEXT,
  unit_of_measure TEXT,
  category TEXT,
  department TEXT,
  unit_cost NUMERIC,
  low_stock_threshold NUMERIC,
  opening_stock NUMERIC,
  qty_received NUMERIC,
  qty_sold NUMERIC,
  qty_issued NUMERIC,
  qty_transferred NUMERIC,
  damages NUMERIC,
  calculated_closing_stock NUMERIC,
  physical_count NUMERIC,
  variance NUMERIC,
  variance_value NUMERIC,
  comment TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH item_list AS (
    -- Use item_departments junction table for multi-department support
    SELECT DISTINCT ON (i.id)
      i.id, i.name, i.unit_of_measure, i.category,
      COALESCE(i.department, 'Retail') AS department,
      i.unit_cost, i.low_stock_threshold
    FROM public.items i
    LEFT JOIN public.item_departments id_map ON id_map.item_id = i.id
    WHERE (
      p_department IS NULL
      OR p_department = 'all'
      OR i.department = p_department
      OR id_map.department = p_department
    )
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
      AND (
        p_department IS NULL OR p_department = 'all'
        OR t.department = p_department
        OR EXISTS (
          SELECT 1 FROM public.item_departments id2
          WHERE id2.item_id = t.item_id AND id2.department = p_department
        )
      )
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
      SUM(CASE WHEN t.type = 'adjustment' THEN t.quantity ELSE 0 END) as adjusted,
      MAX(CASE WHEN t.type = 'adjustment' THEN t.metadata->>'comment' END) as comment
    FROM public.inventory_transactions t
    WHERE t.transaction_date >= p_start_date AND t.transaction_date <= p_end_date
      AND (
        p_department IS NULL OR p_department = 'all'
        OR t.department = p_department
        OR EXISTS (
          SELECT 1 FROM public.item_departments id3
          WHERE id3.item_id = t.item_id AND id3.department = p_department
        )
      )
    GROUP BY t.item_id
  )
  SELECT
    i.id as item_id,
    i.name as item_name,
    i.unit_of_measure,
    i.category,
    i.department,
    i.unit_cost,
    i.low_stock_threshold,
    COALESCE(ob.opening_stock, 0) as opening_stock,
    COALESCE(pt.received, 0) as qty_received,
    COALESCE(pt.sold, 0) as qty_sold,
    COALESCE(pt.issued, 0) as qty_issued,
    COALESCE(pt.transferred, 0) as qty_transferred,
    COALESCE(pt.damaged, 0) as damages,
    (COALESCE(ob.opening_stock, 0) + COALESCE(pt.received, 0) - COALESCE(pt.sold, 0) - COALESCE(pt.issued, 0) - COALESCE(pt.transferred, 0) - COALESCE(pt.damaged, 0) + COALESCE(pt.adjusted, 0)) as calculated_closing_stock,
    (COALESCE(ob.opening_stock, 0) + COALESCE(pt.received, 0) - COALESCE(pt.sold, 0) - COALESCE(pt.issued, 0) - COALESCE(pt.transferred, 0) - COALESCE(pt.damaged, 0) + COALESCE(pt.adjusted, 0)) as physical_count,
    COALESCE(pt.adjusted, 0) as variance,
    COALESCE(pt.adjusted, 0) * i.unit_cost as variance_value,
    pt.comment
  FROM item_list i
  LEFT JOIN opening_balances ob ON i.id = ob.item_id
  LEFT JOIN period_transactions pt ON i.id = pt.item_id
  WHERE p_include_zero_activity
     OR COALESCE(ob.opening_stock, 0) != 0
     OR COALESCE(pt.received, 0) != 0
     OR COALESCE(pt.sold, 0) != 0
     OR COALESCE(pt.issued, 0) != 0
     OR COALESCE(pt.transferred, 0) != 0
     OR COALESCE(pt.damaged, 0) != 0
     OR COALESCE(pt.adjusted, 0) != 0;
END;
$$;
