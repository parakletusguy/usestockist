import os

# Definition of stock items as of 8am, September 18, 2026
items_data = [
    # ── Retail ──
    {"name": "POS roll", "category": "Supplies", "unit": "roll", "dept": "Retail", "open_qty": 68, "close_qty": 68, "remark": "8am Stock Count Sep 18"},
    {"name": "Thermal roll", "category": "Supplies", "unit": "roll", "dept": "Retail", "open_qty": 14, "close_qty": 14, "remark": "8am Stock Count Sep 18"},
    {"name": "Take Away Bags", "category": "Supplies", "unit": "pack", "dept": "Retail", "open_qty": 400, "close_qty": 400, "remark": "8am Stock Count Sep 18"},
    {"name": "Milk cups", "category": "Supplies", "unit": "pcs", "dept": "Retail", "open_qty": 30, "close_qty": 30, "remark": "8am Stock Count Sep 18"},
    {"name": "Vegetable oil", "category": "Food", "unit": "bottle", "dept": "Retail", "open_qty": 2, "close_qty": 2, "remark": "8am Stock Count Sep 18"},
    {"name": "Chamdor", "category": "Beverages", "unit": "bottle", "dept": "Retail", "open_qty": 6, "close_qty": 6, "remark": "8am Stock Count Sep 18"},
    {"name": "Lamothe Parrot", "category": "Beverages", "unit": "bottle", "dept": "Retail", "open_qty": 6, "close_qty": 6, "remark": "8am Stock Count Sep 18"},
    {"name": "Sugar", "category": "Food", "unit": "bag", "dept": "Retail", "open_qty": 1, "close_qty": 1, "remark": "8am Stock Count Sep 18 (1 sugar bag)"},
    {"name": "Serviette", "category": "Supplies", "unit": "pack", "dept": "Retail", "open_qty": 99, "close_qty": 99, "remark": "8am Stock Count Sep 18"},
    {"name": "Sweetened yoghurt (Kingrey)", "category": "Food", "unit": "bottle", "dept": "Retail", "open_qty": 1, "close_qty": 1, "remark": "8am Stock Count Sep 18"},
    {"name": "Zobo", "category": "Beverages", "unit": "bottle", "dept": "Retail", "open_qty": 20, "close_qty": 20, "remark": "8am Stock Count Sep 18"},
    {"name": "Tigernut", "category": "Beverages", "unit": "bottle", "dept": "Retail", "open_qty": 17, "close_qty": 17, "remark": "8am Stock Count Sep 18"},
    {"name": "Maltina", "category": "Beverages", "unit": "can", "dept": "Retail", "open_qty": 44, "close_qty": 44, "remark": "8am Stock Count Sep 18"},
    {"name": "Monster", "category": "Beverages", "unit": "can", "dept": "Retail", "open_qty": 24, "close_qty": 24, "remark": "8am Stock Count Sep 18"},
    {"name": "Schweppes Chapman Can", "category": "Beverages", "unit": "can", "dept": "Retail", "open_qty": 48, "close_qty": 48, "remark": "8am Stock Count Sep 18"},
    {"name": "Small Chops", "category": "Food", "unit": "pack", "dept": "Retail", "open_qty": 16, "close_qty": 16, "remark": "8am Stock Count Sep 18"},
    {"name": "Meat Pie", "category": "Food", "unit": "pcs", "dept": "Retail", "open_qty": 15, "close_qty": 15, "remark": "8am Stock Count Sep 18"},
    {"name": "Raw corn", "category": "Food", "unit": "pack", "dept": "Retail", "open_qty": 5, "close_qty": 5, "remark": "8am Stock Count Sep 18"},
    {"name": "Rubber band", "category": "Supplies", "unit": "pack", "dept": "Retail", "open_qty": 5, "close_qty": 5, "remark": "8am Stock Count Sep 18 (5 packs)"},
    {"name": "Cups", "category": "Supplies", "unit": "pcs", "dept": "Retail", "open_qty": 96, "close_qty": 96, "remark": "8am Stock Count Sep 18"},
    {"name": "Straw", "category": "Supplies", "unit": "pack", "dept": "Retail", "open_qty": 5, "close_qty": 5, "remark": "8am Stock Count Sep 18 (5 packs)"},
    {"name": "Parfait", "category": "Food", "unit": "pcs", "dept": "Retail", "open_qty": 15, "close_qty": 15, "remark": "8am Stock Count Sep 18"},
    {"name": "Soda", "category": "Beverages", "unit": "can", "dept": "Retail", "open_qty": 711, "close_qty": 711, "remark": "8am Stock Count Sep 18"},
    {"name": "Water", "category": "Beverages", "unit": "bottle", "dept": "Retail", "open_qty": 175, "close_qty": 175, "remark": "8am Stock Count Sep 18"},
    {"name": "Regular popcorn", "category": "Food", "unit": "pack", "dept": "Retail", "open_qty": 1750, "close_qty": 1750, "remark": "8am Stock Count Sep 18"},
    {"name": "Medium popcorn", "category": "Food", "unit": "pack", "dept": "Retail", "open_qty": 1050, "close_qty": 1050, "remark": "8am Stock Count Sep 18"},
    {"name": "Large popcorn", "category": "Food", "unit": "pack", "dept": "Retail", "open_qty": 300, "close_qty": 300, "remark": "8am Stock Count Sep 18"},

    # ── Retail & Housekeeping with Movements ──
    {
        "name": "Bin bag", "category": "Cleaning", "unit": "pack", "dept": "Housekeeping",
        "open_qty": 33, "close_qty": 32, "remark": "8am count 33, issued 1 to Housekeeping",
        "issuances": [{"qty": 1, "to": "Housekeeping"}]
    },
    {
        "name": "Stapler pins", "category": "Supplies", "unit": "pack", "dept": "Retail",
        "open_qty": 10, "close_qty": 9, "remark": "8am count 10 packs, issued 1 to Retail",
        "issuances": [{"qty": 1, "to": "Retail"}]
    },
    {
        "name": "Hand wash", "category": "Cleaning", "unit": "bottle", "dept": "Housekeeping",
        "open_qty": 7, "close_qty": 17, "remark": "8am count 7, +12 from Mr Sunny, issued 2 to Housekeeping",
        "receipts": [{"qty": 12, "from": "Mr Sunny"}],
        "issuances": [{"qty": 2, "to": "Housekeeping"}]
    },
    {
        "name": "Tissue", "category": "Cleaning", "unit": "roll", "dept": "Housekeeping",
        "open_qty": 102, "close_qty": 90, "remark": "8am count 102, issued 12 to Housekeeping",
        "issuances": [{"qty": 12, "to": "Housekeeping"}]
    },
    {
        "name": "Chocolate syrup", "category": "Syrups", "unit": "bottle", "dept": "Bar",
        "open_qty": 1, "close_qty": 0, "remark": "8am count 1, issued 1 to Bar evening",
        "issuances": [{"qty": 1, "to": "Bar"}]
    },
    {
        "name": "Oreos biscuits", "category": "Food", "unit": "pack", "dept": "Retail",
        "open_qty": 16, "close_qty": 12, "remark": "8am count 16, issued 4 to Bar evening",
        "issuances": [{"qty": 4, "to": "Bar"}]
    },
    {
        "name": "Air freshner spray", "category": "Cleaning", "unit": "can", "dept": "Housekeeping",
        "open_qty": 12, "close_qty": 11, "remark": "8am count 12, issued 1 to Housekeeping evening",
        "issuances": [{"qty": 1, "to": "Housekeeping"}]
    },

    # ── Housekeeping ──
    {"name": "Sponge", "category": "Cleaning", "unit": "pcs", "dept": "Housekeeping", "open_qty": 2, "close_qty": 2, "remark": "8am Stock Count Sep 18"},
    {"name": "Detergent", "category": "Cleaning", "unit": "pack", "dept": "Housekeeping", "open_qty": 3, "close_qty": 3, "remark": "8am Stock Count Sep 18"},
    {"name": "Windolene", "category": "Cleaning", "unit": "bottle", "dept": "Housekeeping", "open_qty": 1, "close_qty": 1, "remark": "8am Stock Count Sep 18"},
    {"name": "Hypo", "category": "Cleaning", "unit": "bottle", "dept": "Housekeeping", "open_qty": 3, "close_qty": 3, "remark": "8am Stock Count Sep 18"},

    # ── Bar ──
    {"name": "Strawberry syrup", "category": "Syrups", "unit": "bottle", "dept": "Bar", "open_qty": 2, "close_qty": 2, "remark": "8am Stock Count Sep 18"},
    {"name": "Mojito syrup", "category": "Syrups", "unit": "bottle", "dept": "Bar", "open_qty": 1, "close_qty": 1, "remark": "8am Stock Count Sep 18"},
    {"name": "Vanilla syrup", "category": "Syrups", "unit": "bottle", "dept": "Bar", "open_qty": 1, "close_qty": 1, "remark": "8am Stock Count Sep 18"},
    {"name": "Schnapps (Shamrock)", "category": "Beverages", "unit": "bottle", "dept": "Bar", "open_qty": 1, "close_qty": 1, "remark": "8am Stock Count Sep 18"},
    {"name": "Triple Sec (Bardinet)", "category": "Beverages", "unit": "bottle", "dept": "Bar", "open_qty": 1, "close_qty": 1, "remark": "8am Stock Count Sep 18"},
    {"name": "Dailys Sweet and Sour", "category": "Beverages", "unit": "bottle", "dept": "Bar", "open_qty": 1, "close_qty": 1, "remark": "8am Stock Count Sep 18"},
    {"name": "Grenadine", "category": "Beverages", "unit": "bottle", "dept": "Bar", "open_qty": 1, "close_qty": 1, "remark": "8am Stock Count Sep 18"},
    {"name": "Orange juice", "category": "Beverages", "unit": "pack", "dept": "Bar", "open_qty": 7, "close_qty": 7, "remark": "8am Stock Count Sep 18"},
    {"name": "Pineapple juice", "category": "Beverages", "unit": "pack", "dept": "Bar", "open_qty": 5, "close_qty": 5, "remark": "8am Stock Count Sep 18"},
    {"name": "Heineken Can", "category": "Beverages", "unit": "can", "dept": "Bar", "open_qty": 12, "close_qty": 12, "remark": "8am Stock Count Sep 18 (12 cans)"},
    {"name": "Alita", "category": "Beverages", "unit": "bottle", "dept": "Bar", "open_qty": 1, "close_qty": 1, "remark": "8am Stock Count Sep 18 (Bar)"},
    {"name": "William Lawson", "category": "Beverages", "unit": "bottle", "dept": "Bar", "open_qty": 1, "close_qty": 1, "remark": "8am Stock Count Sep 18 (Bar)"},
    {"name": "Chamdor", "category": "Beverages", "unit": "bottle", "dept": "Bar", "open_qty": 1, "close_qty": 1, "remark": "8am Stock Count Sep 18 (Bar)"},
    {"name": "Four Cousins", "category": "Beverages", "unit": "bottle", "dept": "Bar", "open_qty": 1, "close_qty": 1, "remark": "8am Stock Count Sep 18 (Bar)"},
    {"name": "Triple Sec (BV Land)", "category": "Beverages", "unit": "bottle", "dept": "Bar", "open_qty": 1, "close_qty": 1, "remark": "8am Stock Count Sep 18 (Bar)"},
    {"name": "Andre Rose", "category": "Beverages", "unit": "bottle", "dept": "Bar", "open_qty": 1, "close_qty": 1, "remark": "8am Stock Count Sep 18 (Bar)"},
]

sql_parts = []
sql_parts.append("""-- Migration: Seed Opening Stock as of 8am, September 18, 2026
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
""")

for item in items_data:
    name_esc = item["name"].replace("'", "''")
    cat_esc = item["category"].replace("'", "''")
    unit_esc = item["unit"].replace("'", "''")
    dept_esc = item["dept"].replace("'", "''")
    remark_esc = item["remark"].replace("'", "''")
    open_qty = item["open_qty"]
    close_qty = item["close_qty"]

    block = f"""
  -- Item: {item['name']} ({item['dept']})
  SELECT id INTO v_item_id FROM public.items WHERE lower(trim(name)) = lower(trim('{name_esc}')) LIMIT 1;
  IF v_item_id IS NULL THEN
    -- Fallback loose search
    SELECT id INTO v_item_id FROM public.items WHERE lower(name) LIKE lower('%{name_esc}%') LIMIT 1;
  END IF;

  IF v_item_id IS NULL THEN
    INSERT INTO public.items (name, category, department, unit_of_measure, unit_cost, low_stock_threshold)
    VALUES ('{name_esc}', '{cat_esc}', '{dept_esc}', '{unit_esc}', 0, 5)
    RETURNING id INTO v_item_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.item_departments WHERE item_id = v_item_id AND department = '{dept_esc}'
  ) THEN
    INSERT INTO public.item_departments (item_id, department) VALUES (v_item_id, '{dept_esc}');
  END IF;

  -- Insert daily_stock_sheets (clean prior entry for this item to ensure idempotency)
  DELETE FROM public.daily_stock_sheets 
  WHERE date = '2026-09-18' AND item_id = v_item_id AND retail_team_name = '{dept_esc}';

  INSERT INTO public.daily_stock_sheets (date, retail_team_name, item_id, open_qty, close_qty, sales_qty, remark, branch_id)
  VALUES ('2026-09-18', '{dept_esc}', v_item_id, {open_qty}, {close_qty}, 0, '{remark_esc}', v_branch_id);
"""

    # Receipts if any
    if "receipts" in item:
        for r in item["receipts"]:
            r_qty = r["qty"]
            r_from = r["from"].replace("'", "''")
            block += f"""
  -- Receipt: {r_qty} from {r_from}
  v_ledger_id := gen_random_uuid();
  INSERT INTO public.received_ledger (id, date, supplier, item_id, quantity, invoice_number, branch_id)
  VALUES (v_ledger_id, '2026-09-18', '{r_from}', v_item_id, {r_qty}, 'RCV-SEP18-SUNNY', v_branch_id);

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, branch_id, transaction_date, metadata)
  VALUES (v_item_id, 'receive', {r_qty}, '{dept_esc}', v_branch_id, '2026-09-18 10:00:00+01', 
    jsonb_build_object('source', 'stock_count_sep18', 'supplier', '{r_from}', 'ledger_id', v_ledger_id));
"""

    # Issuances if any
    if "issuances" in item:
        for iss in item["issuances"]:
            iss_qty = iss["qty"]
            iss_to = iss["to"].replace("'", "''")
            block += f"""
  -- Issuance: {iss_qty} to {iss_to}
  v_ledger_id := gen_random_uuid();
  INSERT INTO public.issuance_ledger (id, date, recipient_group, item_id, quantity, issued_by, branch_id)
  VALUES (v_ledger_id, '2026-09-18', '{iss_to}', v_item_id, {iss_qty}, 'Storekeeper (8am count Sep 18)', v_branch_id);

  INSERT INTO public.inventory_transactions (item_id, type, quantity, department, branch_id, transaction_date, metadata)
  VALUES (v_item_id, 'issuance', {iss_qty}, '{dept_esc}', v_branch_id, '2026-09-18 18:00:00+01', 
    jsonb_build_object('source', 'stock_count_sep18', 'recipient_group', '{iss_to}', 'ledger_id', v_ledger_id));
"""

    sql_parts.append(block)

sql_parts.append("""
  RETURN 'Opening stock as of 8am, September 18, 2026 successfully seeded!';
END;
$$;

GRANT EXECUTE ON FUNCTION public.seed_opening_stock_18_09_2026() TO authenticated, anon, service_role;

-- Execute function to seed database immediately
SELECT public.seed_opening_stock_18_09_2026();
""")

full_sql = "\n".join(sql_parts)
out_path = os.path.join("supabase", "migrations", "20260918080000_seed_opening_stock_sep18.sql")
with open(out_path, "w", encoding="utf-8") as f:
    f.write(full_sql)

print(f"Generated migration at: {out_path} ({len(items_data)} items processed)")
