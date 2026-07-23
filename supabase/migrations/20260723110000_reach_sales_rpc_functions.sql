-- Migration: Create RPC functions for reach sales upload
-- Uses SECURITY DEFINER to bypass PostgREST table schema cache limitations
-- that occur in managed Supabase infrastructure with dynamically created tables.

CREATE OR REPLACE FUNCTION public.upload_reach_sales_report(
  p_report_date       DATE,
  p_retail_member     TEXT,
  p_file_name         TEXT,
  p_total_items_sold  INTEGER,
  p_total_sales_value NUMERIC,
  p_items             JSONB   -- [{item_id, qty_sold, unit_price, department}, ...]
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_report_id UUID;
  v_item      JSONB;
BEGIN
  -- 1. Insert report header into reach_sales_reports
  INSERT INTO public.reach_sales_reports (
    report_date,
    retail_member_name,
    file_name,
    total_items_sold,
    total_sales_value
  ) VALUES (
    p_report_date,
    p_retail_member,
    p_file_name,
    p_total_items_sold,
    p_total_sales_value
  )
  RETURNING id INTO v_report_id;

  -- 2. Insert individual item sales into inventory_transactions
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.inventory_transactions (
      item_id,
      type,
      quantity,
      transaction_date,
      department,
      metadata
    ) VALUES (
      (v_item->>'item_id')::UUID,
      'sale',
      (v_item->>'qty_sold')::NUMERIC,
      p_report_date,
      COALESCE(v_item->>'department', 'Retail'),
      jsonb_build_object(
        'retail_member_name', p_retail_member,
        'unit_price', (v_item->>'unit_price')::NUMERIC,
        'report_id', v_report_id
      )
    );
  END LOOP;

  RETURN jsonb_build_object('report_id', v_report_id, 'success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Fetch function for report history
CREATE OR REPLACE FUNCTION public.get_reach_sales_reports()
RETURNS SETOF public.reach_sales_reports
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM public.reach_sales_reports ORDER BY uploaded_at DESC;
$$;

-- Grant execute to API roles
GRANT EXECUTE ON FUNCTION public.upload_reach_sales_report TO authenticated;
GRANT EXECUTE ON FUNCTION public.upload_reach_sales_report TO anon;
GRANT EXECUTE ON FUNCTION public.upload_reach_sales_report TO service_role;

GRANT EXECUTE ON FUNCTION public.get_reach_sales_reports TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_reach_sales_reports TO anon;
GRANT EXECUTE ON FUNCTION public.get_reach_sales_reports TO service_role;

NOTIFY pgrst, 'reload schema';
