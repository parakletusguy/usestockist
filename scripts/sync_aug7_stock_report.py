import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

SUPABASE_URL = "https://insenbrtdrwfomazehna.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imluc2VuYnJ0ZHJ3Zm9tYXplaG5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1Nzk0MTcsImV4cCI6MjEwMDE1NTQxN30.wcLPIj8f2UhfZKN7z3r0ux7bvim6sq5d1beZWemXa00"

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

REPORT_DATE = "2026-08-07"

# Raw entries from August 7th Report PDF
# Tuple: (name, qty_received, opening_stock, issuance, transfer, qty_sold, damages, phy_count, comment)
ENTRIES = [
    ("Cube Pack", 0, 0, 0, 18, 0, 0, 4, "18 CUBE"),
    ("Castilo Grande", 0, 4, 0, 0, 0, 0, 1, ""),
    ("Bombay", 0, 1, 0, 0, 0, 0, 1, ""),
    ("Hennesy XO", 0, 1, 0, 0, 0, 0, 1, ""),
    ("Louis Roederer", 0, 1, 0, 0, 0, 0, 1, ""),
    ("Alita", 0, 2, 0, 0, 0, 0, 5, ""),
    ("Lamothe Parrot", 0, 4, 0, 0, 0, 0, 2, ""),
    ("Chamdor", 0, 3, 0, 0, 0, 0, 1, ""),
    ("Water", 0, 10, 0, 12, 0, 0, 26, ""),
    ("Soda", 0, 16, 0, 12, 51, 0, 937, ""),
    ("POS Roll", 0, 30, 0, 4, 82, 0, 612, ""),
    ("Large Popcorn", 0, 988, 0, 70, 26, 0, 1485, ""),
    ("Medium Popcorn", 0, 694, 0, 90, 0, 0, 1, ""),
    ("Regular Popcorn", 0, 1529, 0, 40, 0, 0, 0, ""),
    ("Thermal Roll", 0, 2, 0, 1, 0, 0, 0, ""),
    ("Soda", 480, 260, 0, 345, 110, 0, 630, ""),
    ("Maltina", 0, 25, 0, 25, 4, 0, 21, ""),
    ("Schweppes Chapman Can", 48, 0, 0, 0, 0, 0, 48, ""),
    ("Black Bullet", 0, 22, 0, 22, 6, 0, 16, ""),
    ("Eva Water 75cl", 0, 794, 0, 101, 90, 0, 704, ""),
    ("BBQ Sauce", 0, 1, 0, 0, 0, 0, 1, ""),
    ("Pringles", 19, 3, 0, 10, 2, 0, 17, ""),
    ("Mayonnaise", 0, 7, 0, 1, 0, 0, 6, ""),
    ("Meat Pie", 34, 24, 0, 58, 58, 0, 0, ""),
    ("Parfait", 11, 4, 0, 15, 13, 0, 2, ""),
    ("Shawarma Bread", 0, 30, 0, 17, 17, 0, 13, ""),
    ("Portioned Chicken", 0, 20, 0, 20, 17, 0, 3, ""),
    ("Hotdog Sausages", 0, 34, 0, 34, 34, 0, 0, ""),
    ("Small Chops", 21, 15, 0, 36, 36, 0, 0, ""),
    ("Peak Yoghurt", 0, 39, 0, 19, 0, 0, 39, ""),
    ("Kingrey Yoghurt", 0, 31, 0, 21, 2, 0, 19, ""),
    ("Tigernut Drink", 0, 9, 0, 8, 2, 0, 7, ""),
    ("Zobo Drink", 0, 5, 0, 5, 1, 0, 4, ""),
    ("Hotdog Bread Bun", 0, 0, 0, 0, 0, 0, 0, ""),
    ("Raw Corn", 5, 3, 0, 2, 0, 0, 6, ""),
    ("Vegetable Oil", 2, 1, 0, 0, 0, 0, 3, ""),
    ("Foil", 0, 5, 0, 0, 0, 0, 5, ""),
    ("Rubber Band", 3, 1, 0, 1, 0, 0, 3, ""),
    ("Serviette: White", 0, 72, 0, 13, 0, 0, 59, ""),
    ("Take Away Bags", 0, 500, 0, 100, 0, 0, 400, ""),
    ("Air Freshner Spray", 0, 7, 0, 0, 0, 0, 7, ""),
    ("Bin Bag", 0, 10, 0, 2, 0, 0, 8, ""),
    ("Camphor", 0, 7, 0, 0, 0, 0, 7, ""),
    ("Detergent", 0, 8, 0, 1, 0, 0, 7, ""),
    ("Hair Net", 0, 100, 0, 0, 0, 0, 100, ""),
    ("Hand Wash", 0, 7, 0, 2, 0, 0, 5, ""),
    ("Hypo 500ml", 0, 7, 0, 0, 0, 0, 7, ""),
    ("Iron Sponge", 0, 4, 0, 0, 0, 0, 4, ""),
    ("Mop", 0, 1, 0, 0, 0, 0, 1, ""),
    ("Mopping/Brush Stick", 0, 1, 0, 0, 0, 0, 1, ""),
    ("Parker/Sweeper", 0, 1, 0, 0, 0, 0, 1, ""),
    ("Toilet Roll", 0, 90, 0, 8, 0, 0, 82, ""),
    ("Windolene", 0, 1, 0, 0, 0, 0, 1, ""),
    ("Tequilla", 0, 1, 0, 1, 0, 0, 0, ""),
    ("Pineapple Juice", 0, 1, 0, 1, 0, 0, 0, ""),
    ("Orange Juice", 0, 1, 0, 0, 0, 0, 1, ""),
    ("Blue Curacao", 0, 1, 0, 0, 0, 0, 1, ""),
    ("Da Montare Spray", 0, 1, 0, 0, 0, 0, 1, ""),
    ("William Lawson Whisky", 0, 1, 0, 0, 0, 0, 1, ""),
    ("Caramel Syrup", 0, 1, 0, 0, 0, 0, 1, ""),
    ("Mojito Syrup", 0, 1, 0, 0, 0, 0, 1, ""),
    ("Vanilla Syrup", 0, 1, 0, 0, 0, 0, 1, ""),
    ("Passion Syrup", 0, 1, 0, 0, 0, 0, 1, ""),
    ("Coconut Syrup", 0, 1, 0, 0, 0, 0, 1, ""),
    ("Grenadine", 0, 1, 0, 0, 0, 0, 1, ""),
    ("Malibu Syrup", 0, 1, 0, 0, 0, 0, 1, ""),
    ("Ice Cream Mix", 0, 8, 0, 0, 0, 0, 8, ""),
    ("Bitters", 0, 1, 0, 1, 0, 0, 0, ""),
    ("Andre Rose", 0, 1, 0, 0, 0, 0, 1, ""),
    ("Four Cousins", 0, 1, 0, 0, 0, 0, 1, ""),
    ("Ziploc Bag", 0, 52, 0, 0, 0, 0, 52, "")
]

def normalize(s):
    return s.lower().replace(" ", "").replace("-", "").replace(":", "")

def get_catalog_items():
    url = f"{SUPABASE_URL}/rest/v1/items?select=id,name,category,department,unit_cost"
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def create_item(name, category="General", cost=0):
    url = f"{SUPABASE_URL}/rest/v1/items"
    payload = {
        "name": name,
        "category": category,
        "unit_of_measure": "pcs",
        "unit_cost": cost,
        "department": "Retail",
        "low_stock_threshold": 10
    }
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers=HEADERS, method='POST')
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        return res[0]['id']

def match_item(raw_name, catalog):
    raw_norm = normalize(raw_name)
    for it in catalog:
        if normalize(it['name']) == raw_norm:
            return it['id']
    for it in catalog:
        if raw_norm in normalize(it['name']) or normalize(it['name']) in raw_norm:
            return it['id']
    return None

def upsert_daily_stock_sheet(row):
    # Check if exists
    chk_url = f"{SUPABASE_URL}/rest/v1/daily_stock_sheets?item_id=eq.{row['item_id']}&date=eq.{REPORT_DATE}"
    chk_req = urllib.request.Request(chk_url, headers=HEADERS)
    with urllib.request.urlopen(chk_req) as resp:
        existing = json.loads(resp.read().decode('utf-8'))

    if existing:
        sheet_id = existing[0]['id']
        url = f"{SUPABASE_URL}/rest/v1/daily_stock_sheets?id=eq.{sheet_id}"
        data = json.dumps(row).encode('utf-8')
        req = urllib.request.Request(url, data=data, headers=HEADERS, method='PATCH')
        with urllib.request.urlopen(req) as resp:
            pass
    else:
        url = f"{SUPABASE_URL}/rest/v1/daily_stock_sheets"
        data = json.dumps(row).encode('utf-8')
        req = urllib.request.Request(url, data=data, headers=HEADERS, method='POST')
        with urllib.request.urlopen(req) as resp:
            pass

def insert_tx(item_id, tx_type, qty, notes="Aug 7 Report Sync"):
    if qty <= 0:
        return
    url = f"{SUPABASE_URL}/rest/v1/inventory_transactions"
    payload = {
        "item_id": item_id,
        "type": tx_type,
        "quantity": qty,
        "transaction_date": f"{REPORT_DATE}T08:00:00.000Z",
        "department": "Retail",
        "notes": notes
    }
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers=HEADERS, method='POST')
    try:
        with urllib.request.urlopen(req) as resp:
            pass
    except Exception as e:
        print(f"Notice inserting tx {tx_type} {qty} for {item_id}: {e}")

def main():
    print(f"=== Syncing August 7th, 2026 Stock Count Report into Supabase ===")
    catalog = get_catalog_items()
    print(f"Loaded {len(catalog)} catalog items.")

    matched_count = 0
    created_count = 0

    for name, qty_rec, open_qty, issuance, transfer, qty_sold, damages, phy_count, comment in ENTRIES:
        item_id = match_item(name, catalog)
        if not item_id:
            item_id = create_item(name)
            created_count += 1
            print(f"Created missing catalog item: {name} ({item_id})")
            # Refresh catalog
            catalog = get_catalog_items()
        else:
            matched_count += 1

        sheet_payload = {
            "item_id": item_id,
            "date": REPORT_DATE,
            "open_qty": open_qty,
            "qty_in": qty_rec,
            "sales_qty": qty_sold,
            "close_qty": phy_count,
            "remark": comment if comment else None,
            "retail_team_name": "Retail"
        }
        upsert_daily_stock_sheet(sheet_payload)

        # Sync transactions for received / transfer / issuance if present
        if qty_rec > 0:
            insert_tx(item_id, "receive", qty_rec, "Aug 7 Report Qty Received")
        if transfer > 0:
            insert_tx(item_id, "transfer", transfer, "Aug 7 Report Transfer")
        if issuance > 0:
            insert_tx(item_id, "issuance", issuance, "Aug 7 Report Issuance")
        if damages > 0:
            insert_tx(item_id, "damage", damages, "Aug 7 Report Damages")

    print(f"=== Sync Complete! Matched: {matched_count}, Created: {created_count}, Total Processed: {len(ENTRIES)} ===")

if __name__ == "__main__":
    main()
