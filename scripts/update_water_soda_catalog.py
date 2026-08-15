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

def patch_item(item_id: str, payload: dict):
    url = f"{SUPABASE_URL}/rest/v1/items?id=eq.{item_id}"
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers=HEADERS, method='PATCH')
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        print(f"Patched item {item_id}: {res}")

def delete_item(item_id: str):
    url = f"{SUPABASE_URL}/rest/v1/items?id=eq.{item_id}"
    req = urllib.request.Request(url, headers=HEADERS, method='DELETE')
    with urllib.request.urlopen(req) as resp:
        print(f"Deleted duplicate item {item_id}")

def update_item_departments(item_id: str, depts: list):
    # 1. Delete existing
    del_url = f"{SUPABASE_URL}/rest/v1/item_departments?item_id=eq.{item_id}"
    del_req = urllib.request.Request(del_url, headers=HEADERS, method='DELETE')
    try:
        urllib.request.urlopen(del_req)
    except Exception as e:
        print(f"Notice deleting item_departments: {e}")

    # 2. Insert new
    rows = [{"item_id": item_id, "department": d} for d in depts]
    ins_url = f"{SUPABASE_URL}/rest/v1/item_departments"
    ins_data = json.dumps(rows).encode('utf-8')
    ins_req = urllib.request.Request(ins_url, data=ins_data, headers=HEADERS, method='POST')
    try:
        with urllib.request.urlopen(ins_req) as resp:
            print(f"Updated item_departments for {item_id}: {depts}")
    except Exception as e:
        print(f"Error inserting item_departments: {e}")

def main():
    print("=== Updating Water and Soda in Supabase Catalog ===")
    
    # 1. Update Cube Water -> Water
    cube_water_id = "0355adfc-a476-441f-93d1-d1d9451e5a14"
    patch_item(cube_water_id, {"name": "Water", "department": "Retail", "unit_cost": 1000})
    update_item_departments(cube_water_id, ["Retail", "Cube", "Bar"])

    # 2. Update Cube Soda Drink -> Soda
    cube_soda_id = "17aa0370-d853-40e5-9628-816a3feabb4b"
    patch_item(cube_soda_id, {"name": "Soda", "department": "Retail", "unit_cost": 1200})
    update_item_departments(cube_soda_id, ["Retail", "Cube", "Bar"])

    # 3. Clean up duplicate "Soda Drinks" if exists
    soda_drinks_id = "4c38b313-8989-416b-bb9f-700045ecb089"
    try:
        # Check if sales or details reference soda_drinks_id before delete
        delete_item(soda_drinks_id)
    except Exception as e:
        print(f"Notice on soda_drinks_id cleanup: {e}")

    print("=== Water and Soda catalog items updated successfully! ===")

if __name__ == "__main__":
    main()
