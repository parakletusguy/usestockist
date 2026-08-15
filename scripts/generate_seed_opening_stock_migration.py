import os

items_data = [
    # Cube
    {"name": "Louis Roderer (Cristal)", "category": "Beverages", "unit": "bottle", "dept": "Cube", "qty": 1},
    {"name": "Alita", "category": "Beverages", "unit": "bottle", "dept": "Cube", "qty": 1},
    {"name": "Bombay", "category": "Beverages", "unit": "bottle", "dept": "Cube", "qty": 1},
    {"name": "Hennessey XO", "category": "Beverages", "unit": "bottle", "dept": "Cube", "qty": 1},
    {"name": "Chamdor", "category": "Beverages", "unit": "bottle", "dept": "Cube", "qty": 2},
    {"name": "Lamothe Parrot", "category": "Beverages", "unit": "bottle", "dept": "Cube", "qty": 4},
    {"name": "Castillo Grande", "category": "Beverages", "unit": "bottle", "dept": "Cube", "qty": 4},
    {"name": "Soda", "category": "Beverages", "unit": "can", "dept": "Cube", "qty": 16},
    {"name": "Water", "category": "Beverages", "unit": "bottle", "dept": "Cube", "qty": 10},

    # Bar
    {"name": "Sport sirop (Coconut)", "category": "Syrups", "unit": "bottle", "dept": "Bar", "qty": 1},
    {"name": "Sport sirop (Passion)", "category": "Syrups", "unit": "bottle", "dept": "Bar", "qty": 1},
    {"name": "Sport sirop (Mojito)", "category": "Syrups", "unit": "bottle", "dept": "Bar", "qty": 1},
    {"name": "Sport sirop (Vanilla)", "category": "Syrups", "unit": "bottle", "dept": "Bar", "qty": 1},
    {"name": "Chocolate syrup", "category": "Syrups", "unit": "bottle", "dept": "Bar", "qty": 1},
    {"name": "Triple Sec (Bardinet)", "category": "Beverages", "unit": "bottle", "dept": "Bar", "qty": 1},
    {"name": "Triple Sec (BV Land)", "category": "Beverages", "unit": "bottle", "dept": "Bar", "qty": 1},
    {"name": "Best Cream Liqueur", "category": "Beverages", "unit": "bottle", "dept": "Bar", "qty": 1},
    {"name": "Orange juice", "category": "Beverages", "unit": "pack", "dept": "Bar", "qty": 1},
    {"name": "Cups", "category": "Supplies", "unit": "pcs", "dept": "Bar", "qty": 45},
    {"name": "Straws", "category": "Supplies", "unit": "packs", "dept": "Bar", "qty": 2},
    {"name": "William Lawson", "category": "Beverages", "unit": "bottle", "dept": "Bar", "qty": 1},
    {"name": "Alita", "category": "Beverages", "unit": "bottle", "dept": "Bar", "qty": 1},
    {"name": "Four Cousins", "category": "Beverages", "unit": "bottle", "dept": "Bar", "qty": 1},

    # Retail & Housekeeping
    {"name": "Disposable cups", "category": "Supplies", "unit": "pcs", "dept": "Retail", "qty": 50},
    {"name": "Carrier/Takeaway bags", "category": "Supplies", "unit": "pcs", "dept": "Retail", "qty": 500},
    {"name": "Rubber bands", "category": "Supplies", "unit": "pack", "dept": "Retail", "qty": 1},
    {"name": "Foil", "category": "Supplies", "unit": "roll", "dept": "Retail", "qty": 5},
    {"name": "BBQ Sauce", "category": "Food", "unit": "bottle", "dept": "Retail", "qty": 1},
    {"name": "Grill thongs", "category": "Supplies", "unit": "pcs", "dept": "Retail", "qty": 3},
    {"name": "Chafing gel", "category": "Supplies", "unit": "pcs", "dept": "Retail", "qty": 12},
    {"name": "Gloves", "category": "Supplies", "unit": "pairs", "dept": "Housekeeping", "qty": 90},
    {"name": "Sponge", "category": "Supplies", "unit": "pcs", "dept": "Housekeeping", "qty": 4},
    {"name": "Milk cups", "category": "Supplies", "unit": "pcs", "dept": "Retail", "qty": 30},
    {"name": "Bin bags", "category": "Supplies", "unit": "roll", "dept": "Housekeeping", "qty": 10},
    {"name": "Detergent", "category": "Supplies", "unit": "pack", "dept": "Housekeeping", "qty": 8},
    {"name": "Thermal roll", "category": "Supplies", "unit": "roll", "dept": "Retail", "qty": 2},
    {"name": "POS roll", "category": "Supplies", "unit": "roll", "dept": "Retail", "qty": 20},
    {"name": "Mayonnaise", "category": "Food", "unit": "bottle", "dept": "Retail", "qty": 7},
    {"name": "Hypo", "category": "Supplies", "unit": "bottle", "dept": "Housekeeping", "qty": 7},
    {"name": "Surface cleaner (windolene)", "category": "Supplies", "unit": "bottle", "dept": "Housekeeping", "qty": 1},
    {"name": "Hand wash", "category": "Supplies", "unit": "bottle", "dept": "Housekeeping", "qty": 5},
    {"name": "Vegetable oil", "category": "Food", "unit": "bottle", "dept": "Retail", "qty": 1},
    {"name": "Peak yoghurt", "category": "Food", "unit": "pcs", "dept": "Retail", "qty": 39},
    {"name": "Serviette", "category": "Supplies", "unit": "pack", "dept": "Retail", "qty": 72},
    {"name": "Tissue", "category": "Supplies", "unit": "roll", "dept": "Housekeeping", "qty": 90},
    {"name": "Water", "category": "Beverages", "unit": "bottle", "dept": "Retail", "qty": 794},
    {"name": "Soda", "category": "Beverages", "unit": "can", "dept": "Retail", "qty": 260},
    {"name": "Cabbages", "category": "Food", "unit": "pcs", "dept": "Retail", "qty": 7},
    {"name": "Carrots", "category": "Food", "unit": "pcs", "dept": "Retail", "qty": 10},
    {"name": "Sausages", "category": "Food", "unit": "pcs", "dept": "Retail", "qty": 32},
    {"name": "Shawarma bread", "category": "Food", "unit": "pack", "dept": "Retail", "qty": 27},
    {"name": "Raw corn", "category": "Food", "unit": "pcs", "dept": "Retail", "qty": 3},
    {"name": "Milk", "category": "Food", "unit": "kgs", "dept": "Retail", "qty": 5},
    {"name": "Maltina", "category": "Beverages", "unit": "can", "dept": "Retail", "qty": 25},
    {"name": "Smallchops", "category": "Food", "unit": "pack", "dept": "Retail", "qty": 15},
    {"name": "Meatpies", "category": "Food", "unit": "pcs", "dept": "Retail", "qty": 20},
    {"name": "Sweetened yoghurt (Kingrey)", "category": "Food", "unit": "pcs", "dept": "Retail", "qty": 31},
    {"name": "Parfait", "category": "Food", "unit": "pcs", "dept": "Retail", "qty": 4},
    {"name": "Tigernut", "category": "Beverages", "unit": "bottle", "dept": "Retail", "qty": 9},
    {"name": "Zobo", "category": "Beverages", "unit": "bottle", "dept": "Retail", "qty": 5},
    {"name": "Pringles", "category": "Food", "unit": "can", "dept": "Retail", "qty": 3},
    {"name": "Regular popcorn", "category": "Food", "unit": "pack", "dept": "Retail", "qty": 1632},
    {"name": "Medium popcorn", "category": "Food", "unit": "pack", "dept": "Retail", "qty": 782},
    {"name": "Large popcorn", "category": "Food", "unit": "pack", "dept": "Retail", "qty": 1023},
]

sql_statements = []
sql_statements.append("""-- Migration: Seed Catalog Items & Opening Stock for 07-08-2026
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
""")

for item in items_data:
    name_escaped = item['name'].replace("'", "''")
    cat_escaped = item['category'].replace("'", "''")
    unit_escaped = item['unit'].replace("'", "''")
    dept_escaped = item['dept'].replace("'", "''")
    qty = item['qty']

    block = f"""
  -- Item: {item['name']} ({item['dept']})
  SELECT id INTO v_item_id FROM public.items WHERE lower(name) = lower('{name_escaped}') LIMIT 1;
  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('{name_escaped}', '{cat_escaped}', '{dept_escaped}', '{unit_escaped}', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  INSERT INTO public.item_departments (item_id, department)
  VALUES (v_item_id, '{dept_escaped}')
  ON CONFLICT (item_id, department) DO NOTHING;

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark)
  VALUES ('2026-08-07', '{dept_escaped}', v_item_id, {qty}, {qty}, 0, 'Opening Stock for 07-08-2026');

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, transaction_date, metadata)
  VALUES (v_item_id, 'receive', {qty}, '{dept_escaped}', '2026-08-07 00:00:00+00', '{{\"source\": \"opening_stock_07_08_2026\", \"note\": \"Opening Stock for 07-08-2026\"}}');
"""
    sql_statements.append(block)

sql_statements.append("""
  RETURN 'Opening stock for 07-08-2026 successfully seeded!';
END;
$$;

GRANT EXECUTE ON FUNCTION public.seed_opening_stock_07_08_2026() TO authenticated, anon, service_role;

-- Execute function to seed database immediately
SELECT public.seed_opening_stock_07_08_2026();
""")

full_sql = "\n".join(sql_statements)
out_path = os.path.join("supabase", "migrations", "20260808131000_seed_opening_stock_aug7.sql")
with open(out_path, "w", encoding="utf-8") as f:
    f.write(full_sql)

print(f"Migration file generated at: {out_path}")
