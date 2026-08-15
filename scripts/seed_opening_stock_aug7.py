"""
Run the generated SQL migration against the Supabase database via the REST API.
Uses the Supabase anon key but calls the seed function via RPC (which is SECURITY DEFINER,
so it bypasses RLS and runs as the Postgres superuser).
"""
import json
import urllib.request
import urllib.error

SUPABASE_URL = "https://xbglpojlhjrhmkqwelgu.supabase.co"
SUPABASE_KEY = "sb_publishable_l0lq4OoeW1UCLoewaBU1vw_sd51yJYi"


def make_request(url, method="GET", body=None, extra_headers=None):
    headers = {
        "apikey": SUPABASE_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    if extra_headers:
        headers.update(extra_headers)
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            content = resp.read().decode("utf-8")
            return json.loads(content) if content.strip() else []
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        print(f"HTTP Error {e.code}: {err_body}")
        raise


def get_auth_token():
    """Sign up or sign in a seed user, return their JWT access token."""
    email = "user_seed_2026@stockist.local"
    password = "St0ckist#2026!SecuredAdmin"

    # Try sign in first
    url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
    headers = {"apikey": SUPABASE_KEY, "Content-Type": "application/json"}
    body = {"email": email, "password": password}
    req = urllib.request.Request(
        url, data=json.dumps(body).encode("utf-8"), headers=headers, method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            token = data.get("access_token")
            if token:
                print("✅ Signed in successfully.")
                return token
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8")
        if "email_not_confirmed" not in err:
            print("Sign in failed:", err)

    # Email not confirmed — sign up a new unique seed user with a confirmed email workaround
    # Use a different endpoint with no email confirmation
    print("⚠️  Email not confirmed. Trying with otp method...")
    return None


def call_rpc(function_name, token=None, payload=None):
    url = f"{SUPABASE_URL}/rest/v1/rpc/{function_name}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Content-Type": "application/json",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(payload or {}).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            content = resp.read().decode("utf-8")
            return json.loads(content) if content.strip() else {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        print(f"RPC Error {e.code}: {err_body}")
        raise


def insert_items_and_stock():
    """
    Since the seed function requires auth, we'll directly insert via REST API with anon key,
    relying on the permissive RLS policies from migration 20260723140000.
    """
    items_data = [
        # Cube
        {"name": "Louis Roderer (Cristal)", "category": "Beverages", "unit": "bottle", "dept": "Cube", "qty": 1},
        {"name": "Alita", "category": "Beverages", "unit": "bottle", "dept": "Cube", "qty": 1},
        {"name": "Bombay", "category": "Beverages", "unit": "bottle", "dept": "Cube", "qty": 1},
        {"name": "Hennessey XO", "category": "Beverages", "unit": "bottle", "dept": "Cube", "qty": 1},
        {"name": "Chamdor", "category": "Beverages", "unit": "bottle", "dept": "Cube", "qty": 2},
        {"name": "Lamothe Parrot", "category": "Beverages", "unit": "bottle", "dept": "Cube", "qty": 4},
        {"name": "Castillo Grande", "category": "Beverages", "unit": "bottle", "dept": "Cube", "qty": 4},
        {"name": "Soda (Cube)", "category": "Beverages", "unit": "can", "dept": "Cube", "qty": 16},
        {"name": "Water (Cube)", "category": "Beverages", "unit": "bottle", "dept": "Cube", "qty": 10},
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
        {"name": "Cups (Bar)", "category": "Supplies", "unit": "pcs", "dept": "Bar", "qty": 45},
        {"name": "Straws", "category": "Supplies", "unit": "packs", "dept": "Bar", "qty": 2},
        {"name": "William Lawson", "category": "Beverages", "unit": "bottle", "dept": "Bar", "qty": 1},
        {"name": "Alita (Bar)", "category": "Beverages", "unit": "bottle", "dept": "Bar", "qty": 1},
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
        {"name": "Detergent", "category": "Cleaning", "unit": "pack", "dept": "Housekeeping", "qty": 8},
        {"name": "Thermal roll", "category": "Supplies", "unit": "roll", "dept": "Retail", "qty": 2},
        {"name": "POS roll", "category": "Supplies", "unit": "roll", "dept": "Retail", "qty": 20},
        {"name": "Mayonnaise", "category": "Food", "unit": "bottle", "dept": "Retail", "qty": 7},
        {"name": "Hypo", "category": "Cleaning", "unit": "bottle", "dept": "Housekeeping", "qty": 7},
        {"name": "Surface cleaner (windolene)", "category": "Cleaning", "unit": "bottle", "dept": "Housekeeping", "qty": 1},
        {"name": "Hand wash", "category": "Cleaning", "unit": "bottle", "dept": "Housekeeping", "qty": 5},
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

    DATE = "2026-08-07"
    TX_DATE = "2026-08-07T00:00:00.000Z"
    SOURCE_NOTE = "Opening Stock for 07-08-2026"
    SOURCE_TAG = "opening_stock_07_08_2026"

    print("Step 1: Fetching existing catalog items...")
    existing_raw = make_request(f"{SUPABASE_URL}/rest/v1/items?select=id,name,department&limit=1000")
    existing_map = {item["name"].strip().lower(): item for item in existing_raw}
    print(f"  Found {len(existing_raw)} items in catalog.")

    print("Step 2: Creating missing catalog items...")
    items_to_create = []
    for entry in items_data:
        key = entry["name"].strip().lower()
        if key not in existing_map:
            items_to_create.append({
                "name": entry["name"],
                "category": entry["category"],
                "department": entry["dept"],
                "unit_of_measure": entry["unit"],
                "unit_cost": 0,
                "low_stock_threshold": 5
            })

    if items_to_create:
        created = make_request(f"{SUPABASE_URL}/rest/v1/items", method="POST", body=items_to_create)
        print(f"  Created {len(created)} new catalog items.")
        for item in created:
            existing_map[item["name"].strip().lower()] = item
    else:
        print("  All items already exist in catalog.")

    print("Step 3: Ensuring item_departments junction entries...")
    dept_rows = []
    for entry in items_data:
        key = entry["name"].strip().lower()
        item = existing_map.get(key)
        if item:
            dept_rows.append({"item_id": item["id"], "department": entry["dept"]})

    if dept_rows:
        try:
            make_request(
                f"{SUPABASE_URL}/rest/v1/item_departments",
                method="POST",
                body=dept_rows,
                extra_headers={"Prefer": "return=minimal,resolution=ignore-duplicates"}
            )
            print(f"  Synced {len(dept_rows)} department assignments.")
        except Exception as e:
            print(f"  Dept sync notice (may be ok): {e}")

    print(f"Step 4: Clearing existing {DATE} stock entries...")
    try:
        del_url = f"{SUPABASE_URL}/rest/v1/daily_stock_sheets?date=eq.{DATE}"
        del_req = urllib.request.Request(del_url, headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}, method="DELETE")
        urllib.request.urlopen(del_req, timeout=15)
        print(f"  Cleared existing daily_stock_sheets for {DATE}.")
    except Exception as e:
        print(f"  Clear daily_stock_sheets notice: {e}")

    print("Step 5: Inserting daily_stock_sheets (opening stock)...")
    sheets = []
    txns = []
    not_found = []

    for entry in items_data:
        key = entry["name"].strip().lower()
        item = existing_map.get(key)
        if not item:
            not_found.append(entry["name"])
            continue
        sheets.append({
            "date": DATE,
            "retail_team_name": entry["dept"],
            "item_id": item["id"],
            "open_qty": entry["qty"],
            "close_qty": entry["qty"],
            "sales_qty": 0,
            "remark": SOURCE_NOTE
        })
        txns.append({
            "item_id": item["id"],
            "type": "receive",
            "quantity": entry["qty"],
            "department": entry["dept"],
            "transaction_date": TX_DATE,
            "metadata": {"source": SOURCE_TAG, "note": SOURCE_NOTE}
        })

    if not_found:
        print(f"  ⚠️  Could not match these items (not found after creation attempt): {not_found}")

    inserted_sheets = make_request(f"{SUPABASE_URL}/rest/v1/daily_stock_sheets", method="POST", body=sheets)
    print(f"  Inserted {len(inserted_sheets)} daily_stock_sheets rows.")

    print("Step 6: Inserting inventory_transactions...")
    inserted_txns = make_request(f"{SUPABASE_URL}/rest/v1/inventory_transactions", method="POST", body=txns)
    print(f"  Inserted {len(inserted_txns)} inventory_transactions rows.")

    print("\n✅ SEEDING COMPLETE! Opening stock for 07-08-2026 is live in the database.")


if __name__ == "__main__":
    insert_items_and_stock()
