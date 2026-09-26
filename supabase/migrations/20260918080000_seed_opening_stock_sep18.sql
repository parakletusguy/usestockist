-- Migration: Seed Opening Stock as of 8am, September 18, 2026
CREATE OR REPLACE FUNCTION public.seed_opening_stock_18_09_2026()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item_id uuid;
  v_branch_id uuid := '00000000-0000-0000-0000-000000000001'::uuid;
  v_ledger_id uuid;
BEGIN
  -- 1. Clean prior seed entries for 2026-09-18
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' 
    AND remark LIKE '%8am Stock Count Sep 18%';

  DELETE FROM public.inventory_transactions 
  WHERE transaction_date::date = '2026-09-18' 
    AND (metadata->>'source' = 'stock_count_sep18' OR metadata->>'source' = 'opening_stock_18_09_2026');

  DELETE FROM public.issuance_ledger
  WHERE date = '2026-09-18'
    AND issued_by = 'Storekeeper (8am count Sep 18)';

  DELETE FROM public.received_ledger
  WHERE date = '2026-09-18'
    AND invoice_number = 'RCV-SEP18-SUNNY';


  -- Item: POS roll (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('POS roll')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%POS roll%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('POS roll', 'Supplies', 'Retail', 'roll', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Retail'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Retail');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Retail';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Retail', v_item_id, 68, 68, 0, '8am Stock Count Sep 18', v_branch_id);


  -- Item: Thermal roll (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('Thermal roll')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%Thermal roll%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Thermal roll', 'Supplies', 'Retail', 'roll', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Retail'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Retail');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Retail';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Retail', v_item_id, 14, 14, 0, '8am Stock Count Sep 18', v_branch_id);


  -- Item: Takeaway bags (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('Takeaway bags')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%Takeaway bags%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Takeaway bags', 'Supplies', 'Retail', 'pack', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Retail'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Retail');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Retail';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Retail', v_item_id, 400, 400, 0, '8am Stock Count Sep 18', v_branch_id);


  -- Item: Milk cups (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('Milk cups')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%Milk cups%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Milk cups', 'Supplies', 'Retail', 'pcs', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Retail'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Retail');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Retail';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Retail', v_item_id, 30, 30, 0, '8am Stock Count Sep 18', v_branch_id);


  -- Item: Vegetable oil (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('Vegetable oil')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%Vegetable oil%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Vegetable oil', 'Food', 'Retail', 'bottle', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Retail'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Retail');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Retail';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Retail', v_item_id, 2, 2, 0, '8am Stock Count Sep 18', v_branch_id);


  -- Item: Chamdor (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('Chamdor')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%Chamdor%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Chamdor', 'Beverages', 'Retail', 'bottle', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Retail'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Retail');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Retail';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Retail', v_item_id, 6, 6, 0, '8am Stock Count Sep 18', v_branch_id);


  -- Item: Lamothe Parrot (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('Lamothe Parrot')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%Lamothe Parrot%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Lamothe Parrot', 'Beverages', 'Retail', 'bottle', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Retail'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Retail');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Retail';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Retail', v_item_id, 6, 6, 0, '8am Stock Count Sep 18', v_branch_id);


  -- Item: Sugar (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('Sugar')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%Sugar%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Sugar', 'Food', 'Retail', 'bag', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Retail'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Retail');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Retail';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Retail', v_item_id, 1, 1, 0, '8am Stock Count Sep 18 (1 sugar bag)', v_branch_id);


  -- Item: Serviette (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('Serviette')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%Serviette%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Serviette', 'Supplies', 'Retail', 'pack', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Retail'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Retail');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Retail';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Retail', v_item_id, 99, 99, 0, '8am Stock Count Sep 18', v_branch_id);


  -- Item: Sweetened yoghurt (Kingrey) (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('Sweetened yoghurt (Kingrey)')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%Sweetened yoghurt (Kingrey)%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Sweetened yoghurt (Kingrey)', 'Food', 'Retail', 'bottle', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Retail'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Retail');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Retail';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Retail', v_item_id, 1, 1, 0, '8am Stock Count Sep 18', v_branch_id);


  -- Item: Zobo (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('Zobo')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%Zobo%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Zobo', 'Beverages', 'Retail', 'bottle', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Retail'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Retail');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Retail';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Retail', v_item_id, 20, 20, 0, '8am Stock Count Sep 18', v_branch_id);


  -- Item: Tigernut (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('Tigernut')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%Tigernut%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Tigernut', 'Beverages', 'Retail', 'bottle', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Retail'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Retail');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Retail';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Retail', v_item_id, 17, 17, 0, '8am Stock Count Sep 18', v_branch_id);


  -- Item: Maltina (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('Maltina')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%Maltina%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Maltina', 'Beverages', 'Retail', 'can', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Retail'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Retail');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Retail';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Retail', v_item_id, 44, 44, 0, '8am Stock Count Sep 18', v_branch_id);


  -- Item: Monster (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('Monster')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%Monster%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Monster', 'Beverages', 'Retail', 'can', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Retail'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Retail');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Retail';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Retail', v_item_id, 24, 24, 0, '8am Stock Count Sep 18', v_branch_id);


  -- Item: Schweppes can (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('Schweppes can')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%Schweppes can%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Schweppes can', 'Beverages', 'Retail', 'can', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Retail'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Retail');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Retail';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Retail', v_item_id, 48, 48, 0, '8am Stock Count Sep 18', v_branch_id);


  -- Item: Smallchops (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('Smallchops')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%Smallchops%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Smallchops', 'Food', 'Retail', 'pack', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Retail'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Retail');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Retail';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Retail', v_item_id, 16, 16, 0, '8am Stock Count Sep 18', v_branch_id);


  -- Item: Meatpies (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('Meatpies')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%Meatpies%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Meatpies', 'Food', 'Retail', 'pcs', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Retail'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Retail');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Retail';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Retail', v_item_id, 15, 15, 0, '8am Stock Count Sep 18', v_branch_id);


  -- Item: Raw corn (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('Raw corn')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%Raw corn%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Raw corn', 'Food', 'Retail', 'pack', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Retail'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Retail');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Retail';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Retail', v_item_id, 5, 5, 0, '8am Stock Count Sep 18', v_branch_id);


  -- Item: Rubber band (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('Rubber band')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%Rubber band%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Rubber band', 'Supplies', 'Retail', 'pack', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Retail'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Retail');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Retail';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Retail', v_item_id, 5, 5, 0, '8am Stock Count Sep 18 (5 packs)', v_branch_id);


  -- Item: Cups (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('Cups')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%Cups%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Cups', 'Supplies', 'Retail', 'pcs', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Retail'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Retail');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Retail';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Retail', v_item_id, 96, 96, 0, '8am Stock Count Sep 18', v_branch_id);


  -- Item: Straws (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('Straws')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%Straws%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Straws', 'Supplies', 'Retail', 'pack', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Retail'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Retail');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Retail';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Retail', v_item_id, 5, 5, 0, '8am Stock Count Sep 18 (5 packs)', v_branch_id);


  -- Item: Parfait (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('Parfait')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%Parfait%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Parfait', 'Food', 'Retail', 'pcs', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Retail'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Retail');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Retail';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Retail', v_item_id, 15, 15, 0, '8am Stock Count Sep 18', v_branch_id);


  -- Item: Soda (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('Soda')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%Soda%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Soda', 'Beverages', 'Retail', 'can', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Retail'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Retail');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Retail';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Retail', v_item_id, 711, 711, 0, '8am Stock Count Sep 18', v_branch_id);


  -- Item: Water (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('Water')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%Water%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Water', 'Beverages', 'Retail', 'bottle', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Retail'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Retail');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Retail';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Retail', v_item_id, 175, 175, 0, '8am Stock Count Sep 18', v_branch_id);


  -- Item: Regular popcorn (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('Regular popcorn')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%Regular popcorn%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Regular popcorn', 'Food', 'Retail', 'pack', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Retail'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Retail');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Retail';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Retail', v_item_id, 1750, 1750, 0, '8am Stock Count Sep 18', v_branch_id);


  -- Item: Medium popcorn (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('Medium popcorn')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%Medium popcorn%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Medium popcorn', 'Food', 'Retail', 'pack', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Retail'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Retail');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Retail';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Retail', v_item_id, 1050, 1050, 0, '8am Stock Count Sep 18', v_branch_id);


  -- Item: Large popcorn (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('Large popcorn')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%Large popcorn%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Large popcorn', 'Food', 'Retail', 'pack', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Retail'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Retail');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Retail';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Retail', v_item_id, 300, 300, 0, '8am Stock Count Sep 18', v_branch_id);


  -- Item: Bin bag (Housekeeping)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('Bin bag')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%Bin bag%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Bin bag', 'Cleaning', 'Housekeeping', 'pack', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Housekeeping'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Housekeeping');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Housekeeping';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Housekeeping', v_item_id, 33, 32, 0, '8am count 33, issued 1 to Housekeeping', v_branch_id);

  -- Issuance: 1 to Housekeeping
  v_ledger_id := gen_random_uuid();
  INSERT INTO public.issuance_ledger (id, date, recipient_group, item_id, quantity, issued_by, branch_id)
  VALUES (v_ledger_id, '2026-09-18', 'Housekeeping', v_item_id, 1, 'Storekeeper (8am count Sep 18)', v_branch_id);

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, branch_id, transaction_date, metadata)
  VALUES (v_item_id, 'issuance', 1, 'Housekeeping', v_branch_id, '2026-09-18 18:00:00+01', 
    jsonb_build_object('source', 'stock_count_sep18', 'recipient_group', 'Housekeeping', 'ledger_id', v_ledger_id));


  -- Item: Stapler pins (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('Stapler pins')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%Stapler pins%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Stapler pins', 'Supplies', 'Retail', 'pack', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Retail'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Retail');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Retail';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Retail', v_item_id, 10, 9, 0, '8am count 10 packs, issued 1 to Retail', v_branch_id);

  -- Issuance: 1 to Retail
  v_ledger_id := gen_random_uuid();
  INSERT INTO public.issuance_ledger (id, date, recipient_group, item_id, quantity, issued_by, branch_id)
  VALUES (v_ledger_id, '2026-09-18', 'Retail', v_item_id, 1, 'Storekeeper (8am count Sep 18)', v_branch_id);

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, branch_id, transaction_date, metadata)
  VALUES (v_item_id, 'issuance', 1, 'Retail', v_branch_id, '2026-09-18 18:00:00+01', 
    jsonb_build_object('source', 'stock_count_sep18', 'recipient_group', 'Retail', 'ledger_id', v_ledger_id));


  -- Item: Hand wash (Housekeeping)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('Hand wash')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%Hand wash%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Hand wash', 'Cleaning', 'Housekeeping', 'bottle', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Housekeeping'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Housekeeping');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Housekeeping';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Housekeeping', v_item_id, 7, 17, 0, '8am count 7, +12 from Mr Sunny, issued 2 to Housekeeping', v_branch_id);

  -- Receipt: 12 from Mr Sunny
  v_ledger_id := gen_random_uuid();
  INSERT INTO public.received_ledger (id, date, supplier, item_id, quantity, invoice_number, branch_id)
  VALUES (v_ledger_id, '2026-09-18', 'Mr Sunny', v_item_id, 12, 'RCV-SEP18-SUNNY', v_branch_id);

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, branch_id, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 12, 'Housekeeping', v_branch_id, '2026-09-18 10:00:00+01', 
    jsonb_build_object('source', 'stock_count_sep18', 'supplier', 'Mr Sunny', 'ledger_id', v_ledger_id));

  -- Issuance: 2 to Housekeeping
  v_ledger_id := gen_random_uuid();
  INSERT INTO public.issuance_ledger (id, date, recipient_group, item_id, quantity, issued_by, branch_id)
  VALUES (v_ledger_id, '2026-09-18', 'Housekeeping', v_item_id, 2, 'Storekeeper (8am count Sep 18)', v_branch_id);

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, branch_id, transaction_date, metadata)
  VALUES (v_item_id, 'issuance', 2, 'Housekeeping', v_branch_id, '2026-09-18 18:00:00+01', 
    jsonb_build_object('source', 'stock_count_sep18', 'recipient_group', 'Housekeeping', 'ledger_id', v_ledger_id));


  -- Item: Tissue (Housekeeping)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('Tissue')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%Tissue%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Tissue', 'Cleaning', 'Housekeeping', 'roll', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Housekeeping'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Housekeeping');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Housekeeping';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Housekeeping', v_item_id, 102, 90, 0, '8am count 102, issued 12 to Housekeeping', v_branch_id);

  -- Issuance: 12 to Housekeeping
  v_ledger_id := gen_random_uuid();
  INSERT INTO public.issuance_ledger (id, date, recipient_group, item_id, quantity, issued_by, branch_id)
  VALUES (v_ledger_id, '2026-09-18', 'Housekeeping', v_item_id, 12, 'Storekeeper (8am count Sep 18)', v_branch_id);

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, branch_id, transaction_date, metadata)
  VALUES (v_item_id, 'issuance', 12, 'Housekeeping', v_branch_id, '2026-09-18 18:00:00+01', 
    jsonb_build_object('source', 'stock_count_sep18', 'recipient_group', 'Housekeeping', 'ledger_id', v_ledger_id));


  -- Item: Chocolate syrup (Bar)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('Chocolate syrup')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%Chocolate syrup%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Chocolate syrup', 'Syrups', 'Bar', 'bottle', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Bar'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Bar');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Bar';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Bar', v_item_id, 1, 0, 0, '8am count 1, issued 1 to Bar evening', v_branch_id);

  -- Issuance: 1 to Bar
  v_ledger_id := gen_random_uuid();
  INSERT INTO public.issuance_ledger (id, date, recipient_group, item_id, quantity, issued_by, branch_id)
  VALUES (v_ledger_id, '2026-09-18', 'Bar', v_item_id, 1, 'Storekeeper (8am count Sep 18)', v_branch_id);

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, branch_id, transaction_date, metadata)
  VALUES (v_item_id, 'issuance', 1, 'Bar', v_branch_id, '2026-09-18 18:00:00+01', 
    jsonb_build_object('source', 'stock_count_sep18', 'recipient_group', 'Bar', 'ledger_id', v_ledger_id));


  -- Item: Oreos biscuits (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('Oreos biscuits')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%Oreos biscuits%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Oreos biscuits', 'Food', 'Retail', 'pack', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Retail'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Retail');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Retail';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Retail', v_item_id, 16, 12, 0, '8am count 16, issued 4 to Bar evening', v_branch_id);

  -- Issuance: 4 to Bar
  v_ledger_id := gen_random_uuid();
  INSERT INTO public.issuance_ledger (id, date, recipient_group, item_id, quantity, issued_by, branch_id)
  VALUES (v_ledger_id, '2026-09-18', 'Bar', v_item_id, 4, 'Storekeeper (8am count Sep 18)', v_branch_id);

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, branch_id, transaction_date, metadata)
  VALUES (v_item_id, 'issuance', 4, 'Retail', v_branch_id, '2026-09-18 18:00:00+01', 
    jsonb_build_object('source', 'stock_count_sep18', 'recipient_group', 'Bar', 'ledger_id', v_ledger_id));


  -- Item: Air freshner spray (Housekeeping)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('Air freshner spray')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%Air freshner spray%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Air freshner spray', 'Cleaning', 'Housekeeping', 'can', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Housekeeping'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Housekeeping');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Housekeeping';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Housekeeping', v_item_id, 12, 11, 0, '8am count 12, issued 1 to Housekeeping evening', v_branch_id);

  -- Issuance: 1 to Housekeeping
  v_ledger_id := gen_random_uuid();
  INSERT INTO public.issuance_ledger (id, date, recipient_group, item_id, quantity, issued_by, branch_id)
  VALUES (v_ledger_id, '2026-09-18', 'Housekeeping', v_item_id, 1, 'Storekeeper (8am count Sep 18)', v_branch_id);

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, branch_id, transaction_date, metadata)
  VALUES (v_item_id, 'issuance', 1, 'Housekeeping', v_branch_id, '2026-09-18 18:00:00+01', 
    jsonb_build_object('source', 'stock_count_sep18', 'recipient_group', 'Housekeeping', 'ledger_id', v_ledger_id));


  -- Item: Sponge (Housekeeping)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('Sponge')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%Sponge%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Sponge', 'Cleaning', 'Housekeeping', 'pcs', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Housekeeping'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Housekeeping');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Housekeeping';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Housekeeping', v_item_id, 2, 2, 0, '8am Stock Count Sep 18', v_branch_id);


  -- Item: Detergent (Housekeeping)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('Detergent')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%Detergent%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Detergent', 'Cleaning', 'Housekeeping', 'pack', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Housekeeping'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Housekeeping');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Housekeeping';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Housekeeping', v_item_id, 3, 3, 0, '8am Stock Count Sep 18', v_branch_id);


  -- Item: Windolene (Housekeeping)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('Windolene')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%Windolene%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Windolene', 'Cleaning', 'Housekeeping', 'bottle', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Housekeeping'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Housekeeping');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Housekeeping';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Housekeeping', v_item_id, 1, 1, 0, '8am Stock Count Sep 18', v_branch_id);


  -- Item: Hypo (Housekeeping)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('Hypo')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%Hypo%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Hypo', 'Cleaning', 'Housekeeping', 'bottle', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Housekeeping'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Housekeeping');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Housekeeping';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Housekeeping', v_item_id, 3, 3, 0, '8am Stock Count Sep 18', v_branch_id);


  -- Item: Strawberry syrup (Bar)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('Strawberry syrup')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%Strawberry syrup%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Strawberry syrup', 'Syrups', 'Bar', 'bottle', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Bar'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Bar');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Bar';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Bar', v_item_id, 2, 2, 0, '8am Stock Count Sep 18', v_branch_id);


  -- Item: Mojito syrup (Bar)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('Mojito syrup')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%Mojito syrup%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Mojito syrup', 'Syrups', 'Bar', 'bottle', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Bar'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Bar');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Bar';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Bar', v_item_id, 1, 1, 0, '8am Stock Count Sep 18', v_branch_id);


  -- Item: Vanilla syrup (Bar)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('Vanilla syrup')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%Vanilla syrup%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Vanilla syrup', 'Syrups', 'Bar', 'bottle', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Bar'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Bar');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Bar';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Bar', v_item_id, 1, 1, 0, '8am Stock Count Sep 18', v_branch_id);


  -- Item: Schnapps (Shamrock) (Bar)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('Schnapps (Shamrock)')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%Schnapps (Shamrock)%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Schnapps (Shamrock)', 'Beverages', 'Bar', 'bottle', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Bar'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Bar');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Bar';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Bar', v_item_id, 1, 1, 0, '8am Stock Count Sep 18', v_branch_id);


  -- Item: Triple Sec (Bardinet) (Bar)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('Triple Sec (Bardinet)')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%Triple Sec (Bardinet)%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Triple Sec (Bardinet)', 'Beverages', 'Bar', 'bottle', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Bar'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Bar');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Bar';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Bar', v_item_id, 1, 1, 0, '8am Stock Count Sep 18', v_branch_id);


  -- Item: Dailys Sweet and Sour (Bar)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('Dailys Sweet and Sour')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%Dailys Sweet and Sour%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Dailys Sweet and Sour', 'Beverages', 'Bar', 'bottle', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Bar'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Bar');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Bar';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Bar', v_item_id, 1, 1, 0, '8am Stock Count Sep 18', v_branch_id);


  -- Item: Grenadine (Bar)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('Grenadine')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%Grenadine%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Grenadine', 'Beverages', 'Bar', 'bottle', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Bar'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Bar');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Bar';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Bar', v_item_id, 1, 1, 0, '8am Stock Count Sep 18', v_branch_id);


  -- Item: Orange juice (Bar)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('Orange juice')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%Orange juice%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Orange juice', 'Beverages', 'Bar', 'pack', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Bar'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Bar');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Bar';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Bar', v_item_id, 7, 7, 0, '8am Stock Count Sep 18', v_branch_id);


  -- Item: Pineapple juice (Bar)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('Pineapple juice')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%Pineapple juice%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Pineapple juice', 'Beverages', 'Bar', 'pack', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Bar'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Bar');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Bar';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Bar', v_item_id, 5, 5, 0, '8am Stock Count Sep 18', v_branch_id);


  -- Item: Heineken Can (Bar)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('Heineken Can')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%Heineken Can%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Heineken Can', 'Beverages', 'Bar', 'can', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Bar'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Bar');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Bar';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Bar', v_item_id, 12, 12, 0, '8am Stock Count Sep 18 (12 cans)', v_branch_id);


  -- Item: Alita (Bar)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('Alita')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%Alita%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Alita', 'Beverages', 'Bar', 'bottle', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Bar'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Bar');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Bar';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Bar', v_item_id, 1, 1, 0, '8am Stock Count Sep 18 (Bar)', v_branch_id);


  -- Item: William Lawson (Bar)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('William Lawson')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%William Lawson%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('William Lawson', 'Beverages', 'Bar', 'bottle', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Bar'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Bar');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Bar';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Bar', v_item_id, 1, 1, 0, '8am Stock Count Sep 18 (Bar)', v_branch_id);


  -- Item: Chamdor (Bar)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('Chamdor')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%Chamdor%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Chamdor', 'Beverages', 'Bar', 'bottle', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Bar'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Bar');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Bar';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Bar', v_item_id, 1, 1, 0, '8am Stock Count Sep 18 (Bar)', v_branch_id);


  -- Item: Four Cousins (Bar)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('Four Cousins')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%Four Cousins%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Four Cousins', 'Beverages', 'Bar', 'bottle', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Bar'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Bar');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Bar';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Bar', v_item_id, 1, 1, 0, '8am Stock Count Sep 18 (Bar)', v_branch_id);


  -- Item: Triple Sec (BV Land) (Bar)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('Triple Sec (BV Land)')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%Triple Sec (BV Land)%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Triple Sec (BV Land)', 'Beverages', 'Bar', 'bottle', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Bar'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Bar');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Bar';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Bar', v_item_id, 1, 1, 0, '8am Stock Count Sep 18 (Bar)', v_branch_id);


  -- Item: Andre Rose (Bar)
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('Andre Rose')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%Andre Rose%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Andre Rose', 'Beverages', 'Bar', 'bottle', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = 'Bar'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, 'Bar');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = 'Bar';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', 'Bar', v_item_id, 1, 1, 0, '8am Stock Count Sep 18 (Bar)', v_branch_id);


  RETURN 'Opening stock as of 8am, September 18, 2026 successfully seeded!';
END;
$$;

GRANT EXECUTE ON FUNCTION public.seed_opening_stock_18_09_2026() TO authenticated, anon, service_role;

-- Execute function to seed database immediately
SELECT public.seed_opening_stock_18_09_2026();
