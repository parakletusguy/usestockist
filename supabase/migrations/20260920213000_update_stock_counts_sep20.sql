-- Migration: Update physical stock counts for Sep 20, 2026
-- Retail: Water = 2
-- Bar: Ice Cream Mix = 15

CREATE OR REPLACE FUNCTION public.seed_stock_counts_sep20()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_branch_id uuid := '00000000-0000-0000-0000-000000000001'::uuid;
  v_water_id uuid := '0355adfc-a476-441f-93d1-d1d9451e5a14'::uuid;
  v_icecream_id uuid := '33f9c650-a608-41f6-83fb-9fa86a2a017e'::uuid;
  v_existing_id uuid;
BEGIN
  -- 1. Retail: Water = 2
  SELECT id INTO v_existing_id
  FROM public.daily_stock_sheets
  WHERE item_id = v_water_id
    AND date = '2026-09-20'::date
    AND retail_team_name = 'Retail'
    AND branch_id = v_branch_id
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    UPDATE public.daily_stock_sheets
    SET close_qty = 2,
        open_qty = 2,
        remark = 'Physical count Sep 20 2026 (Retail)'
    WHERE id = v_existing_id;
  ELSE
    INSERT INTO public.daily_stock_sheets
      (item_id, date, retail_team_name, branch_id, open_qty, close_qty, sales_qty, remark)
    VALUES
      (v_water_id, '2026-09-20'::date, 'Retail', v_branch_id, 2, 2, 0, 'Physical count Sep 20 2026 (Retail)');
  END IF;

  -- 2. Bar: Ice Cream Mix = 15
  SELECT id INTO v_existing_id
  FROM public.daily_stock_sheets
  WHERE item_id = v_icecream_id
    AND date = '2026-09-20'::date
    AND retail_team_name = 'Bar'
    AND branch_id = v_branch_id
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    UPDATE public.daily_stock_sheets
    SET close_qty = 15,
        open_qty = 15,
        remark = 'Physical count Sep 20 2026 (Bar)'
    WHERE id = v_existing_id;
  ELSE
    INSERT INTO public.daily_stock_sheets
      (item_id, date, retail_team_name, branch_id, open_qty, close_qty, sales_qty, remark)
    VALUES
      (v_icecream_id, '2026-09-20'::date, 'Bar', v_branch_id, 15, 15, 0, 'Physical count Sep 20 2026 (Bar)');
  END IF;

  RETURN 'Successfully updated physical stock counts for Sep 20, 2026: Retail Water = 2, Bar Ice Cream Mix = 15';
END;
$$;

GRANT EXECUTE ON FUNCTION public.seed_stock_counts_sep20() TO authenticated, anon, service_role;

-- Execute immediately
SELECT public.seed_stock_counts_sep20();
