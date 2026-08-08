import urllib.request
import json
from typing import List, Dict, Any

SUPABASE_URL = "https://insenbrtdrwfomazehna.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imluc2VuYnJ0ZHJ3Zm9tYXplaG5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1Nzk0MTcsImV4cCI6MjEwMDE1NTQxN30.wcLPIj8f2UhfZKN7z3r0ux7bvim6sq5d1beZWemXa00"

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

def make_req(endpoint: str, data: Any = None, method: str = "GET") -> Any:
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8") if data is not None else None,
        headers=HEADERS,
        method=method
    )
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode("utf-8")
            return json.loads(content) if content else None
    except Exception as e:
        print(f"HTTP Error on {method} {endpoint}: {e}")
        return None

def fast_deduplicate():
    print("Starting fast database deduplication...")
    
    # 1. Fetch all items
    items = make_req("items?select=*") or []
    print(f"Current total items in DB: {len(items)}")

    # Group by normalized item name
    grouped: Dict[str, List[dict]] = {}
    for i in items:
        norm_name = i['name'].strip().lower()
        grouped.setdefault(norm_name, []).append(i)

    to_delete_ids = []
    primary_items = {}

    for norm_name, group in grouped.items():
        # Prefer keeper with non-zero unit_cost or lowest created_at
        group_sorted = sorted(group, key=lambda x: (-float(x.get('unit_cost') or 0), x['created_at']))
        keeper = group_sorted[0]
        primary_items[norm_name] = keeper

        for dup in group_sorted[1:]:
            to_delete_ids.append(dup['id'])

    # Merge 'Cube Pack' / 'Cube Packs' into 'Regular Popcorn'
    cube_pack_ids = []
    for norm_name, keeper in list(primary_items.items()):
        if norm_name in ['cube pack', 'cube packs']:
            cube_pack_ids.append(keeper['id'])
            del primary_items[norm_name]

    if cube_pack_ids:
        print(f"Merging {len(cube_pack_ids)} 'Cube Pack' items into 'Regular Popcorn'...")
        to_delete_ids.extend(cube_pack_ids)

    # Merge 'Soda' into 'Soda Drinks'
    soda_ids = []
    for norm_name, keeper in list(primary_items.items()):
        if norm_name == 'soda':
            soda_ids.append(keeper['id'])
            del primary_items[norm_name]

    if soda_ids:
        print(f"Merging {len(soda_ids)} 'Soda' items into 'Soda Drinks'...")
        to_delete_ids.extend(soda_ids)

    # 2. Batch Delete all redundant IDs
    if to_delete_ids:
        # Delete in chunks of 50
        chunk_size = 50
        for i in range(0, len(to_delete_ids), chunk_size):
            chunk = to_delete_ids[i:i + chunk_size]
            id_filter = ",".join(chunk)
            make_req(f"item_departments?item_id=in.({id_filter})", method="DELETE")
            make_req(f"items?id=in.({id_filter})", method="DELETE")

    # 3. Update 'Regular Popcorn' to cost ₦4000 and ensure it exists
    reg_popcorn = primary_items.get('regular popcorn')
    if reg_popcorn:
        make_req(f"items?id=eq.{reg_popcorn['id']}", data={"unit_cost": 4000.0, "category": "Food", "unit_of_measure": "pack"}, method="PATCH")

    # 4. Re-sync all `item_departments`
    print("Re-syncing all item_departments relationships...")
    make_req("item_departments?item_id=neq.00000000-0000-0000-0000-000000000000", method="DELETE")

    DEFAULT_DEPTS = {
        'regular popcorn': ['Retail', 'Cube'],
        'soda drinks': ['Retail', 'Bar', 'Cube'],
        'eva water 75cl': ['Retail', 'Bar'],
        'schweppes chapman can': ['Retail', 'Bar'],
        'monster energy': ['Retail', 'Bar'],
        'maltina': ['Retail', 'Bar'],
        'pos roll': ['Retail', 'Cube', 'Bar'],
        'meat pie': ['Retail', 'Kitchen'],
        'small chops': ['Retail', 'Kitchen'],
        'parfait': ['Retail', 'Nox'],
        'serviette white': ['Retail', 'Bar', 'Kitchen'],
        'straw': ['Retail', 'Bar'],
        'bbq sauce': ['Kitchen', 'Retail'],
        'ketchup': ['Kitchen', 'Retail'],
        'foil': ['Kitchen', 'Retail'],
        'paper plate': ['Kitchen', 'Retail'],
        'salt': ['Retail', 'Kitchen'],
        'sugar': ['Retail', 'Kitchen'],
        'vegetable oil': ['Retail', 'Kitchen'],
    }

    new_dept_rows = []
    for norm_name, item in primary_items.items():
        depts = DEFAULT_DEPTS.get(norm_name, [item.get('department') or 'Retail'])
        for d in depts:
            new_dept_rows.append({"item_id": item['id'], "department": d})

    if new_dept_rows:
        make_req("item_departments", data=new_dept_rows, method="POST")

    # Final check
    remaining_items = make_req("items?select=id,name") or []
    remaining_depts = make_req("item_departments?select=id") or []
    print(f"\nDeduplication complete!")
    print(f"Total Unique Items in Database: {len(remaining_items)}")
    print(f"Total Department Relationships: {len(remaining_depts)}")

if __name__ == "__main__":
    fast_deduplicate()
