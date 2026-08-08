-- Migration: Seed Catalog Items & Opening Stock for 07-08-2026
CREATE OR REPLACE FUNCTION public.seed_opening_stock_07_08_2026()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item_id uuid;
BEGIN
  -- Delete existing entries for 2026-08-07 to ensure clean idempotency
  DELETE FROM public.daily_stock_sheets WHERE date = '2026-08-07';
  DELETE FROM public.inventory_transactions WHERE transaction_date::date = '2026-08-07' AND metadata->>'source' = 'opening_stock_07_08_2026';


  -- Item: Louis Roderer (Cristal) (Cube)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Louis Roderer (Cristal)') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Louis Roderer (Cristal)', 'Beverages', 'Cube', 'bottle', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Cube')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Cube', v_item_id, 1, 1, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 1, 'Cube', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Alita (Cube)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Alita') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Alita', 'Beverages', 'Cube', 'bottle', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Cube')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Cube', v_item_id, 1, 1, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 1, 'Cube', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Bombay (Cube)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Bombay') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Bombay', 'Beverages', 'Cube', 'bottle', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Cube')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Cube', v_item_id, 1, 1, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 1, 'Cube', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Hennessey XO (Cube)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Hennessey XO') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Hennessey XO', 'Beverages', 'Cube', 'bottle', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Cube')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Cube', v_item_id, 1, 1, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 1, 'Cube', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Chamdor (Cube)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Chamdor') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Chamdor', 'Beverages', 'Cube', 'bottle', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Cube')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Cube', v_item_id, 2, 2, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 2, 'Cube', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Lamothe Parrot (Cube)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Lamothe Parrot') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Lamothe Parrot', 'Beverages', 'Cube', 'bottle', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Cube')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Cube', v_item_id, 4, 4, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 4, 'Cube', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Castillo Grande (Cube)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Castillo Grande') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Castillo Grande', 'Beverages', 'Cube', 'bottle', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Cube')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Cube', v_item_id, 4, 4, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 4, 'Cube', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Soda (Cube)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Soda') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Soda', 'Beverages', 'Cube', 'can', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Cube')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Cube', v_item_id, 16, 16, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 16, 'Cube', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Water (Cube)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Water') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Water', 'Beverages', 'Cube', 'bottle', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Cube')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Cube', v_item_id, 10, 10, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 10, 'Cube', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Sport sirop (Coconut) (Bar)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Sport sirop (Coconut)') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Sport sirop (Coconut)', 'Syrups', 'Bar', 'bottle', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Bar')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Bar', v_item_id, 1, 1, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 1, 'Bar', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Sport sirop (Passion) (Bar)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Sport sirop (Passion)') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Sport sirop (Passion)', 'Syrups', 'Bar', 'bottle', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Bar')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Bar', v_item_id, 1, 1, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 1, 'Bar', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Sport sirop (Mojito) (Bar)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Sport sirop (Mojito)') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Sport sirop (Mojito)', 'Syrups', 'Bar', 'bottle', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Bar')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Bar', v_item_id, 1, 1, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 1, 'Bar', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Sport sirop (Vanilla) (Bar)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Sport sirop (Vanilla)') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Sport sirop (Vanilla)', 'Syrups', 'Bar', 'bottle', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Bar')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Bar', v_item_id, 1, 1, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 1, 'Bar', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Chocolate syrup (Bar)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Chocolate syrup') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Chocolate syrup', 'Syrups', 'Bar', 'bottle', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Bar')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Bar', v_item_id, 1, 1, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 1, 'Bar', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Triple Sec (Bardinet) (Bar)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Triple Sec (Bardinet)') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Triple Sec (Bardinet)', 'Beverages', 'Bar', 'bottle', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Bar')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Bar', v_item_id, 1, 1, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 1, 'Bar', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Triple Sec (BV Land) (Bar)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Triple Sec (BV Land)') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Triple Sec (BV Land)', 'Beverages', 'Bar', 'bottle', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Bar')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Bar', v_item_id, 1, 1, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 1, 'Bar', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Best Cream Liqueur (Bar)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Best Cream Liqueur') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Best Cream Liqueur', 'Beverages', 'Bar', 'bottle', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Bar')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Bar', v_item_id, 1, 1, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 1, 'Bar', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Orange juice (Bar)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Orange juice') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Orange juice', 'Beverages', 'Bar', 'pack', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Bar')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Bar', v_item_id, 1, 1, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 1, 'Bar', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Cups (Bar)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Cups') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Cups', 'Supplies', 'Bar', 'pcs', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Bar')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Bar', v_item_id, 45, 45, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 45, 'Bar', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Straws (Bar)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Straws') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Straws', 'Supplies', 'Bar', 'packs', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Bar')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Bar', v_item_id, 2, 2, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 2, 'Bar', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: William Lawson (Bar)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('William Lawson') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('William Lawson', 'Beverages', 'Bar', 'bottle', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Bar')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Bar', v_item_id, 1, 1, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 1, 'Bar', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Alita (Bar)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Alita') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Alita', 'Beverages', 'Bar', 'bottle', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Bar')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Bar', v_item_id, 1, 1, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 1, 'Bar', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Four Cousins (Bar)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Four Cousins') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Four Cousins', 'Beverages', 'Bar', 'bottle', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Bar')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Bar', v_item_id, 1, 1, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 1, 'Bar', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Disposable cups (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Disposable cups') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Disposable cups', 'Supplies', 'Retail', 'pcs', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Retail')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Retail', v_item_id, 50, 50, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 50, 'Retail', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Carrier/Takeaway bags (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Carrier/Takeaway bags') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Carrier/Takeaway bags', 'Supplies', 'Retail', 'pcs', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Retail')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Retail', v_item_id, 500, 500, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 500, 'Retail', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Rubber bands (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Rubber bands') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Rubber bands', 'Supplies', 'Retail', 'pack', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Retail')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Retail', v_item_id, 1, 1, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 1, 'Retail', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Foil (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Foil') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Foil', 'Supplies', 'Retail', 'roll', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Retail')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Retail', v_item_id, 5, 5, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 5, 'Retail', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: BBQ Sauce (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('BBQ Sauce') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('BBQ Sauce', 'Food', 'Retail', 'bottle', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Retail')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Retail', v_item_id, 1, 1, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 1, 'Retail', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Grill thongs (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Grill thongs') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Grill thongs', 'Supplies', 'Retail', 'pcs', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Retail')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Retail', v_item_id, 3, 3, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 3, 'Retail', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Chafing gel (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Chafing gel') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Chafing gel', 'Supplies', 'Retail', 'pcs', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Retail')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Retail', v_item_id, 12, 12, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 12, 'Retail', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Gloves (Housekeeping)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Gloves') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Gloves', 'Supplies', 'Housekeeping', 'pairs', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Housekeeping')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Housekeeping', v_item_id, 90, 90, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 90, 'Housekeeping', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Sponge (Housekeeping)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Sponge') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Sponge', 'Supplies', 'Housekeeping', 'pcs', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Housekeeping')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Housekeeping', v_item_id, 4, 4, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 4, 'Housekeeping', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Milk cups (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Milk cups') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Milk cups', 'Supplies', 'Retail', 'pcs', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Retail')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Retail', v_item_id, 30, 30, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 30, 'Retail', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Bin bags (Housekeeping)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Bin bags') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Bin bags', 'Supplies', 'Housekeeping', 'roll', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Housekeeping')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Housekeeping', v_item_id, 10, 10, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 10, 'Housekeeping', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Detergent (Housekeeping)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Detergent') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Detergent', 'Supplies', 'Housekeeping', 'pack', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Housekeeping')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Housekeeping', v_item_id, 8, 8, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 8, 'Housekeeping', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Thermal roll (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Thermal roll') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Thermal roll', 'Supplies', 'Retail', 'roll', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Retail')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Retail', v_item_id, 2, 2, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 2, 'Retail', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: POS roll (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('POS roll') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('POS roll', 'Supplies', 'Retail', 'roll', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Retail')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Retail', v_item_id, 20, 20, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 20, 'Retail', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Mayonnaise (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Mayonnaise') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Mayonnaise', 'Food', 'Retail', 'bottle', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Retail')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Retail', v_item_id, 7, 7, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 7, 'Retail', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Hypo (Housekeeping)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Hypo') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Hypo', 'Supplies', 'Housekeeping', 'bottle', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Housekeeping')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Housekeeping', v_item_id, 7, 7, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 7, 'Housekeeping', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Surface cleaner (windolene) (Housekeeping)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Surface cleaner (windolene)') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Surface cleaner (windolene)', 'Supplies', 'Housekeeping', 'bottle', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Housekeeping')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Housekeeping', v_item_id, 1, 1, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 1, 'Housekeeping', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Hand wash (Housekeeping)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Hand wash') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Hand wash', 'Supplies', 'Housekeeping', 'bottle', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Housekeeping')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Housekeeping', v_item_id, 5, 5, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 5, 'Housekeeping', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Vegetable oil (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Vegetable oil') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Vegetable oil', 'Food', 'Retail', 'bottle', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Retail')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Retail', v_item_id, 1, 1, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 1, 'Retail', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Peak yoghurt (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Peak yoghurt') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Peak yoghurt', 'Food', 'Retail', 'pcs', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Retail')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Retail', v_item_id, 39, 39, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 39, 'Retail', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Serviette (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Serviette') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Serviette', 'Supplies', 'Retail', 'pack', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Retail')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Retail', v_item_id, 72, 72, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 72, 'Retail', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Tissue (Housekeeping)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Tissue') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Tissue', 'Supplies', 'Housekeeping', 'roll', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Housekeeping')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Housekeeping', v_item_id, 90, 90, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 90, 'Housekeeping', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Water (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Water') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Water', 'Beverages', 'Retail', 'bottle', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Retail')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Retail', v_item_id, 794, 794, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 794, 'Retail', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Soda (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Soda') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Soda', 'Beverages', 'Retail', 'can', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Retail')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Retail', v_item_id, 260, 260, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 260, 'Retail', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Cabbages (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Cabbages') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Cabbages', 'Food', 'Retail', 'pcs', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Retail')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Retail', v_item_id, 7, 7, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 7, 'Retail', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Carrots (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Carrots') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Carrots', 'Food', 'Retail', 'pcs', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Retail')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Retail', v_item_id, 10, 10, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 10, 'Retail', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Sausages (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Sausages') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Sausages', 'Food', 'Retail', 'pcs', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Retail')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Retail', v_item_id, 32, 32, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 32, 'Retail', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Shawarma bread (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Shawarma bread') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Shawarma bread', 'Food', 'Retail', 'pack', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Retail')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Retail', v_item_id, 27, 27, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 27, 'Retail', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Raw corn (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Raw corn') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Raw corn', 'Food', 'Retail', 'pcs', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Retail')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Retail', v_item_id, 3, 3, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 3, 'Retail', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Milk (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Milk') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Milk', 'Food', 'Retail', 'kgs', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Retail')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Retail', v_item_id, 5, 5, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 5, 'Retail', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Maltina (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Maltina') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Maltina', 'Beverages', 'Retail', 'can', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Retail')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Retail', v_item_id, 25, 25, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 25, 'Retail', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Smallchops (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Smallchops') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Smallchops', 'Food', 'Retail', 'pack', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Retail')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Retail', v_item_id, 15, 15, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 15, 'Retail', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Meatpies (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Meatpies') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Meatpies', 'Food', 'Retail', 'pcs', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Retail')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Retail', v_item_id, 20, 20, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 20, 'Retail', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Sweetened yoghurt (Kingrey) (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Sweetened yoghurt (Kingrey)') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Sweetened yoghurt (Kingrey)', 'Food', 'Retail', 'pcs', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Retail')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Retail', v_item_id, 31, 31, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 31, 'Retail', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Parfait (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Parfait') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Parfait', 'Food', 'Retail', 'pcs', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Retail')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Retail', v_item_id, 4, 4, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 4, 'Retail', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Tigernut (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Tigernut') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Tigernut', 'Beverages', 'Retail', 'bottle', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Retail')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Retail', v_item_id, 9, 9, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 9, 'Retail', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Zobo (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Zobo') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Zobo', 'Beverages', 'Retail', 'bottle', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Retail')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Retail', v_item_id, 5, 5, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 5, 'Retail', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Pringles (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Pringles') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Pringles', 'Food', 'Retail', 'can', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Retail')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Retail', v_item_id, 3, 3, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 3, 'Retail', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Regular popcorn (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Regular popcorn') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Regular popcorn', 'Food', 'Retail', 'pack', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Retail')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Retail', v_item_id, 1632, 1632, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 1632, 'Retail', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Medium popcorn (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Medium popcorn') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Medium popcorn', 'Food', 'Retail', 'pack', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Retail')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Retail', v_item_id, 782, 782, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 782, 'Retail', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  -- Item: Large popcorn (Retail)
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('Large popcorn') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('Large popcorn', 'Food', 'Retail', 'pack', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, 'Retail')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', 'Retail', v_item_id, 1023, 1023, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', 1023, 'Retail', '2026-08-07 00:00:00+00', '{"source": "opening_stock_07_08_2026", "note": "Opening Stock for 07-08-2026"}');


  RETURN 'Opening stock for 07-08-2026 successfully seeded!';
END;
$$;

GRANT EXECUTE ON FUNCTION public.seed_opening_stock_07_08_2026() TO authenticated, anon, service_role;

-- Execute function to seed database immediately
SELECT public.seed_opening_stock_07_08_2026();
