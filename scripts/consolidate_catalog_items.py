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

def get_items():
    url = f"{SUPABASE_URL}/rest/v1/items?select=id,name,category,department,unit_cost"
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def reassign_transactions(from_id: str, to_id: str):
    # Reassign inventory_transactions
    url = f"{SUPABASE_URL}/rest/v1/inventory_transactions?item_id=eq.{from_id}"
    payload = json.dumps({"item_id": to_id}).encode('utf-8')
    req = urllib.request.Request(url, data=payload, headers=HEADERS, method='PATCH')
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"Reassigned inventory_transactions from {from_id} to {to_id}")
    except Exception as e:
        print(f"Notice reassigning inventory_transactions: {e}")

    # Reassign daily_stock_sheets
    url = f"{SUPABASE_URL}/rest/v1/daily_stock_sheets?item_id=eq.{from_id}"
    payload = json.dumps({"item_id": to_id}).encode('utf-8')
    req = urllib.request.Request(url, data=payload, headers=HEADERS, method='PATCH')
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"Reassigned daily_stock_sheets from {from_id} to {to_id}")
    except Exception as e:
        print(f"Notice reassigning daily_stock_sheets: {e}")

def delete_item(item_id: str):
    # Delete from item_departments first
    del_dept = f"{SUPABASE_URL}/rest/v1/item_departments?item_id=eq.{item_id}"
    req_dept = urllib.request.Request(del_dept, headers=HEADERS, method='DELETE')
    try:
        urllib.request.urlopen(req_dept)
    except Exception:
        pass

    # Delete item
    url = f"{SUPABASE_URL}/rest/v1/items?id=eq.{item_id}"
    req = urllib.request.Request(url, headers=HEADERS, method='DELETE')
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"Deleted item {item_id} from catalog.")
    except Exception as e:
        print(f"Error deleting item {item_id}: {e}")

def main():
    print("=== Consolidating Catalog Items ===")
    items = get_items()
    item_map = {it['name'].lower().strip(): it['id'] for it in items}

    water_id = item_map.get('water')
    eva_water_id = item_map.get('eva water 75cl')
    cube_pack_id = item_map.get('cube pack')
    regular_popcorn_id = item_map.get('regular popcorn')

    # 1. Reassign Eva Water 75cl -> Water
    if eva_water_id and water_id:
        print(f"Merging 'Eva Water 75cl' ({eva_water_id}) into 'Water' ({water_id})...")
        reassign_transactions(eva_water_id, water_id)
        delete_item(eva_water_id)

    # 2. Remove Cube Pack (reassign to Regular Popcorn if needed)
    if cube_pack_id:
        print(f"Removing 'Cube Pack' ({cube_pack_id})...")
        if regular_popcorn_id:
            reassign_transactions(cube_pack_id, regular_popcorn_id)
        delete_item(cube_pack_id)

    print("=== Catalog Consolidation Complete! ===")

if __name__ == "__main__":
    main()
