import json
import urllib.request
from typing import List, Dict, Any

SUPABASE_URL = "https://insenbrtdrwfomazehna.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imluc2VuYnJ0ZHJ3Zm9tYXplaG5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1Nzk0MTcsImV4cCI6MjEwMDE1NTQxN30.wcLPIj8f2UhfZKN7z3r0ux7bvim6sq5d1beZWemXa00"

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation, resolution=merge-duplicates"
}

ITEMS_CATALOG: List[Dict[str, Any]] = [
    # 1. Print items
    {'name': 'Castilo Grande', 'category': 'Beverages', 'unit': 'bottle', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Bombay', 'category': 'Beverages', 'unit': 'bottle', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Hennesy XO', 'category': 'Beverages', 'unit': 'bottle', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Louis Roederer', 'category': 'Beverages', 'unit': 'bottle', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Alita', 'category': 'Beverages', 'unit': 'bottle', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Lamothe Parrot', 'category': 'Beverages', 'unit': 'bottle', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Chamdor', 'category': 'Beverages', 'unit': 'bottle', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Water', 'category': 'Beverages', 'unit': 'bottle', 'departments': ['Retail', 'Cube', 'Bar'], 'cost': 1000},
    {'name': 'Soda', 'category': 'Beverages', 'unit': 'can', 'departments': ['Retail', 'Cube', 'Bar'], 'cost': 1200},
    {'name': 'Maltina', 'category': 'Beverages', 'unit': 'can', 'departments': ['Retail', 'Bar'], 'cost': 1500},
    {'name': 'Monster Energy', 'category': 'Beverages', 'unit': 'can', 'departments': ['Retail', 'Bar'], 'cost': 0},
    {'name': 'Pulpy', 'category': 'Beverages', 'unit': 'bottle', 'departments': ['Retail'], 'cost': 0},
    {'name': 'Schweppes Chapman Can', 'category': 'Beverages', 'unit': 'can', 'departments': ['Retail', 'Bar'], 'cost': 2000},
    {'name': 'Black Bullet', 'category': 'Beverages', 'unit': 'can', 'departments': ['Bar'], 'cost': 0},

    # 3. Other Concessions & Kitchen Foods
    {'name': 'BBQ Sauce', 'category': 'Food', 'unit': 'bottle', 'departments': ['Kitchen', 'Retail'], 'cost': 0},
    {'name': 'Ketchup', 'category': 'Food', 'unit': 'bottle', 'departments': ['Kitchen', 'Retail'], 'cost': 0},
    {'name': 'Bounty', 'category': 'Food', 'unit': 'pcs', 'departments': ['Retail'], 'cost': 0},
    {'name': 'Short Bread', 'category': 'Food', 'unit': 'pack', 'departments': ['Retail'], 'cost': 0},
    {'name': 'Pringles', 'category': 'Food', 'unit': 'can', 'departments': ['Retail'], 'cost': 6000},
    {'name': 'Mayonnaise', 'category': 'Food', 'unit': 'bottle', 'departments': ['Kitchen'], 'cost': 0},
    {'name': 'Meat Pie', 'category': 'Food', 'unit': 'pcs', 'departments': ['Retail', 'Kitchen'], 'cost': 1500},
    {'name': 'Doughnut', 'category': 'Food', 'unit': 'pcs', 'departments': ['Retail', 'Kitchen'], 'cost': 0},
    {'name': 'Burger', 'category': 'Food', 'unit': 'pcs', 'departments': ['Kitchen'], 'cost': 0},
    {'name': 'Parfait', 'category': 'Food', 'unit': 'pcs', 'departments': ['Retail'], 'cost': 4000},
    {'name': 'Curry', 'category': 'Food', 'unit': 'pack', 'departments': ['Kitchen'], 'cost': 0},
    {'name': 'Pepper', 'category': 'Food', 'unit': 'pack', 'departments': ['Kitchen'], 'cost': 0},
    {'name': 'Shawarma Bread', 'category': 'Food', 'unit': 'pack', 'departments': ['Kitchen'], 'cost': 0},
    {'name': 'Portioned Chicken', 'category': 'Food', 'unit': 'kg', 'departments': ['Kitchen'], 'cost': 0},
    {'name': 'Hotdog Sausages', 'category': 'Food', 'unit': 'pcs', 'departments': ['Kitchen'], 'cost': 0},
    {'name': 'Condensed Milk', 'category': 'Food', 'unit': 'can', 'departments': ['Kitchen'], 'cost': 0},
    {'name': 'Sliced Cake', 'category': 'Food', 'unit': 'pcs', 'departments': ['Retail', 'Kitchen'], 'cost': 0},
    {'name': 'Small Chops', 'category': 'Food', 'unit': 'pack', 'departments': ['Retail', 'Kitchen'], 'cost': 4000},
    {'name': 'Peak Yoghurt', 'category': 'Food', 'unit': 'can', 'departments': ['Retail'], 'cost': 0},
    {'name': 'Kingrey Yoghurt', 'category': 'Food', 'unit': 'bottle', 'departments': ['Retail'], 'cost': 0},
    {'name': 'Tigernut Drink', 'category': 'Beverages', 'unit': 'bottle', 'departments': ['Retail'], 'cost': 2500},
    {'name': 'Zobo Drink', 'category': 'Beverages', 'unit': 'bottle', 'departments': ['Retail'], 'cost': 1500},
    {'name': 'Hotdog Bread Bun', 'category': 'Food', 'unit': 'pcs', 'departments': ['Kitchen'], 'cost': 0},
    {'name': 'Corn Dog', 'category': 'Food', 'unit': 'pcs', 'departments': ['Kitchen'], 'cost': 0},

    # 4. Popcorn Raw Materials
    {'name': 'Butter (15kg)', 'category': 'Food', 'unit': 'box', 'departments': ['Retail'], 'cost': 0},
    {'name': 'Raw Corn', 'category': 'Food', 'unit': 'pack', 'departments': ['Retail'], 'cost': 1000},
    {'name': 'Salt', 'category': 'Food', 'unit': 'pack', 'departments': ['Retail', 'Kitchen'], 'cost': 0},
    {'name': 'Sugar', 'category': 'Food', 'unit': 'pack', 'departments': ['Retail', 'Kitchen'], 'cost': 0},
    {'name': 'Vegetable Oil', 'category': 'Food', 'unit': 'ltr', 'departments': ['Retail', 'Kitchen'], 'cost': 0},

    # 5. Consumables
    {'name': 'Foil', 'category': 'Supplies', 'unit': 'roll', 'departments': ['Kitchen', 'Retail'], 'cost': 0},
    {'name': 'Paper Plate', 'category': 'Supplies', 'unit': 'pack', 'departments': ['Kitchen', 'Retail'], 'cost': 0},
    {'name': 'Rubber Band', 'category': 'Supplies', 'unit': 'pack', 'departments': ['Retail'], 'cost': 0},
    {'name': 'Serviette White', 'category': 'Supplies', 'unit': 'pack', 'departments': ['Retail', 'Bar', 'Kitchen'], 'cost': 0},
    {'name': 'Straw', 'category': 'Supplies', 'unit': 'pack', 'departments': ['Retail', 'Bar'], 'cost': 0},
    {'name': 'Take Away Bags', 'category': 'Supplies', 'unit': 'pack', 'departments': ['Retail'], 'cost': 0},

    # 6. Retail Tools
    {'name': 'Popcorn Bucket', 'category': 'Equipment', 'unit': 'pcs', 'departments': ['Retail'], 'cost': 0},
    {'name': 'Popcorn Scoop', 'category': 'Equipment', 'unit': 'pcs', 'departments': ['Retail'], 'cost': 0},
    {'name': 'Butter Scoop', 'category': 'Equipment', 'unit': 'pcs', 'departments': ['Retail'], 'cost': 0},
    {'name': 'Hotdog Tong', 'category': 'Equipment', 'unit': 'pcs', 'departments': ['Retail'], 'cost': 0},

    # 7. Cleaning Consumables
    {'name': 'Air Freshner Spray', 'category': 'Cleaning', 'unit': 'can', 'departments': ['Housekeeping'], 'cost': 0},
    {'name': 'Airfreshner Gel', 'category': 'Cleaning', 'unit': 'pcs', 'departments': ['Housekeeping'], 'cost': 0},
    {'name': 'Bin Bag', 'category': 'Cleaning', 'unit': 'pack', 'departments': ['Housekeeping'], 'cost': 0},
    {'name': 'Sweeping Brush', 'category': 'Cleaning', 'unit': 'pcs', 'departments': ['Housekeeping'], 'cost': 0},
    {'name': 'Camphor', 'category': 'Cleaning', 'unit': 'pack', 'departments': ['Housekeeping'], 'cost': 0},
    {'name': 'Cobwebs Brush', 'category': 'Cleaning', 'unit': 'pcs', 'departments': ['Housekeeping'], 'cost': 0},
    {'name': 'Detergent', 'category': 'Cleaning', 'unit': 'pack', 'departments': ['Housekeeping'], 'cost': 0},
    {'name': 'Dettol Antiseptic', 'category': 'Cleaning', 'unit': 'bottle', 'departments': ['Housekeeping'], 'cost': 0},
    {'name': 'Soap Dispenser', 'category': 'Equipment', 'unit': 'pcs', 'departments': ['Housekeeping'], 'cost': 0},
    {'name': 'Hair Net', 'category': 'Supplies', 'unit': 'pack', 'departments': ['Kitchen'], 'cost': 0},
    {'name': 'Hand Towel', 'category': 'Cleaning', 'unit': 'pcs', 'departments': ['Housekeeping'], 'cost': 0},
    {'name': 'Hand Wash', 'category': 'Cleaning', 'unit': 'bottle', 'departments': ['Housekeeping'], 'cost': 0},
    {'name': 'Harpic', 'category': 'Cleaning', 'unit': 'bottle', 'departments': ['Housekeeping'], 'cost': 0},
    {'name': 'Hypo 500ml', 'category': 'Cleaning', 'unit': 'bottle', 'departments': ['Housekeeping'], 'cost': 0},
    {'name': 'Hypo 1ltr', 'category': 'Cleaning', 'unit': 'bottle', 'departments': ['Housekeeping'], 'cost': 0},
    {'name': 'Insecticides Spray 300ml', 'category': 'Cleaning', 'unit': 'can', 'departments': ['Housekeeping'], 'cost': 0},
    {'name': 'Insecticides Spray 500ml', 'category': 'Cleaning', 'unit': 'can', 'departments': ['Housekeeping'], 'cost': 0},
    {'name': 'Iron Sponge', 'category': 'Cleaning', 'unit': 'pcs', 'departments': ['Housekeeping'], 'cost': 0},
    {'name': 'Liquid Soap', 'category': 'Cleaning', 'unit': 'bottle', 'departments': ['Housekeeping'], 'cost': 0},
    {'name': 'Mop', 'category': 'Cleaning', 'unit': 'pcs', 'departments': ['Housekeeping'], 'cost': 0},
    {'name': 'Mopping/Brush Stick', 'category': 'Cleaning', 'unit': 'pcs', 'departments': ['Housekeeping'], 'cost': 0},
    {'name': 'Mopping Bucket', 'category': 'Cleaning', 'unit': 'pcs', 'departments': ['Housekeeping'], 'cost': 0},
    {'name': 'Parker/Sweeper', 'category': 'Cleaning', 'unit': 'pcs', 'departments': ['Housekeeping'], 'cost': 0},
    {'name': 'Wig Brush', 'category': 'Cleaning', 'unit': 'pcs', 'departments': ['Housekeeping'], 'cost': 0},
    {'name': 'Cobwebs Stick', 'category': 'Cleaning', 'unit': 'pcs', 'departments': ['Housekeeping'], 'cost': 0},
    {'name': 'Scouring Powder', 'category': 'Cleaning', 'unit': 'pack', 'departments': ['Housekeeping'], 'cost': 0},
    {'name': 'Sponge', 'category': 'Cleaning', 'unit': 'pcs', 'departments': ['Housekeeping'], 'cost': 0},
    {'name': 'Surface Cleaner', 'category': 'Cleaning', 'unit': 'bottle', 'departments': ['Housekeeping'], 'cost': 0},
    {'name': 'Tile Cleaner', 'category': 'Cleaning', 'unit': 'bottle', 'departments': ['Housekeeping'], 'cost': 0},
    {'name': 'Toilet Brush', 'category': 'Cleaning', 'unit': 'pcs', 'departments': ['Housekeeping'], 'cost': 0},
    {'name': 'Toilet Roll', 'category': 'Cleaning', 'unit': 'roll', 'departments': ['Housekeeping'], 'cost': 0},
    {'name': 'Waste Bin', 'category': 'Equipment', 'unit': 'pcs', 'departments': ['Housekeeping'], 'cost': 0},
    {'name': 'Windolene', 'category': 'Cleaning', 'unit': 'bottle', 'departments': ['Housekeeping'], 'cost': 0},

    # 8. Bar Drinks & Cocktail Items
    {'name': 'Priskaia Vodka', 'category': 'Beverages', 'unit': 'bottle', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Sierra Tequilla', 'category': 'Beverages', 'unit': 'bottle', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Bitter Lemon Juice', 'category': 'Beverages', 'unit': 'can', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Pineapple Juice', 'category': 'Beverages', 'unit': 'pack', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Orange Juice', 'category': 'Beverages', 'unit': 'pack', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Grapes', 'category': 'Food', 'unit': 'kg', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Cranberry Juice', 'category': 'Beverages', 'unit': 'pack', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Virgin Mojito', 'category': 'Beverages', 'unit': 'bottle', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Best Cream', 'category': 'Beverages', 'unit': 'bottle', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Flirt Vodka', 'category': 'Beverages', 'unit': 'bottle', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Strawberry Fruit', 'category': 'Food', 'unit': 'pack', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Blue Curacao', 'category': 'Beverages', 'unit': 'bottle', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Chocolate Syrup', 'category': 'Beverages', 'unit': 'bottle', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Strawberry Syrup', 'category': 'Beverages', 'unit': 'bottle', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Da Montare Spray', 'category': 'Beverages', 'unit': 'can', 'departments': ['Bar'], 'cost': 0},
    {'name': 'William Lawson Whisky', 'category': 'Beverages', 'unit': 'bottle', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Kahlua Coffee', 'category': 'Beverages', 'unit': 'bottle', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Caramel Syrup', 'category': 'Beverages', 'unit': 'bottle', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Beun Amigo Tequilla', 'category': 'Beverages', 'unit': 'bottle', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Gordon/Lord Gin', 'category': 'Beverages', 'unit': 'bottle', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Ribena', 'category': 'Beverages', 'unit': 'bottle', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Bacardi White', 'category': 'Beverages', 'unit': 'bottle', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Mojito Syrup', 'category': 'Beverages', 'unit': 'bottle', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Vanilla Syrup', 'category': 'Beverages', 'unit': 'bottle', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Passion Syrup', 'category': 'Beverages', 'unit': 'bottle', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Coconut Syrup', 'category': 'Beverages', 'unit': 'bottle', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Grenadine', 'category': 'Beverages', 'unit': 'bottle', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Beet Root', 'category': 'Food', 'unit': 'kg', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Shipmaster Rum', 'category': 'Beverages', 'unit': 'bottle', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Smoothie Cups', 'category': 'Supplies', 'unit': 'pcs', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Dates', 'category': 'Food', 'unit': 'pack', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Pineapple Fruit', 'category': 'Food', 'unit': 'pcs', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Banana Fruit', 'category': 'Food', 'unit': 'pack', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Avocado', 'category': 'Food', 'unit': 'pcs', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Apple', 'category': 'Food', 'unit': 'pcs', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Groundnut', 'category': 'Food', 'unit': 'pack', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Captain Jack', 'category': 'Beverages', 'unit': 'bottle', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Malibu Syrup', 'category': 'Beverages', 'unit': 'bottle', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Peach Syrup', 'category': 'Beverages', 'unit': 'bottle', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Marie Brizard', 'category': 'Beverages', 'unit': 'bottle', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Lime Seed', 'category': 'Food', 'unit': 'pack', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Ice Cream Mix', 'category': 'Food', 'unit': 'pack', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Cza Vodka', 'category': 'Beverages', 'unit': 'bottle', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Bitters', 'category': 'Beverages', 'unit': 'bottle', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Dailys Sweet and Sour', 'category': 'Beverages', 'unit': 'bottle', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Mint Leaf', 'category': 'Food', 'unit': 'pack', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Liqueur Triple Sec', 'category': 'Beverages', 'unit': 'bottle', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Andre Rose', 'category': 'Beverages', 'unit': 'bottle', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Four Cousins', 'category': 'Beverages', 'unit': 'bottle', 'departments': ['Bar'], 'cost': 0},
    {'name': 'Cucumber', 'category': 'Food', 'unit': 'pcs', 'departments': ['Bar'], 'cost': 0},

    # 9. Cinema Access & Ticket Items
    {'name': 'Regular Ticket', 'category': 'Other', 'unit': 'pcs', 'departments': ['Retail'], 'cost': 6000},
    {'name': 'Gold Seat', 'category': 'Other', 'unit': 'pcs', 'departments': ['Retail'], 'cost': 5000},
    {'name': 'Platinum Seat', 'category': 'Other', 'unit': 'pcs', 'departments': ['Retail'], 'cost': 5000},
    {'name': 'VR Game', 'category': 'Other', 'unit': 'pcs', 'departments': ['Retail'], 'cost': 2000},
    {'name': 'Box-Signatr Access (Single)', 'category': 'Other', 'unit': 'pcs', 'departments': ['Retail'], 'cost': 5000},
    {'name': 'Box-Signatr Access (Couple Seat)', 'category': 'Other', 'unit': 'pcs', 'departments': ['Retail'], 'cost': 7000},
]

def post_batch(url: str, rows: list) -> Any:
    req = urllib.request.Request(
        url,
        data=json.dumps(rows).encode("utf-8"),
        headers=HEADERS,
        method="POST"
    )
    with urllib.request.urlopen(req) as response:
        content = response.read().decode("utf-8")
        return json.loads(content) if content else []

def fast_seed():
    print(f"Fast seeding {len(ITEMS_CATALOG)} items into Supabase...")
    
    # 1. Fetch existing items
    req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/items?select=id,name", headers=HEADERS)
    with urllib.request.urlopen(req) as response:
        existing_data = json.loads(response.read().decode("utf-8"))
    existing_map = {item['name'].strip().lower(): item['id'] for item in existing_data}

    items_to_insert = []
    items_to_update = []
    item_dept_mapping = []

    for item_def in ITEMS_CATALOG:
        name = item_def['name']
        name_key = name.strip().lower()
        payload = {
            "name": name,
            "category": item_def['category'],
            "unit_of_measure": item_def['unit'],
            "department": item_def['departments'][0],
            "low_stock_threshold": 5,
            "unit_cost": item_def['cost']
        }

        if name_key not in existing_map:
            items_to_insert.append((item_def, payload))

    # Bulk insert new items
    if items_to_insert:
        rows_to_post = [p[1] for p in items_to_insert]
        created_records = post_batch(f"{SUPABASE_URL}/rest/v1/items", rows_to_post)
        for rec in created_records:
            existing_map[rec['name'].strip().lower()] = rec['id']

    # Now assign all item_departments
    all_dept_rows = []
    for item_def in ITEMS_CATALOG:
        item_id = existing_map.get(item_def['name'].strip().lower())
        if item_id:
            for dept in item_def['departments']:
                all_dept_rows.append({"item_id": item_id, "department": dept})

    # Clear existing item_departments
    del_req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/item_departments?item_id=neq.00000000-0000-0000-0000-000000000000", headers=HEADERS, method="DELETE")
    try:
        urllib.request.urlopen(del_req)
    except Exception as e:
        print("Notice during delete:", e)

    # Bulk insert item_departments
    if all_dept_rows:
        post_batch(f"{SUPABASE_URL}/rest/v1/item_departments", all_dept_rows)

    print(f"Done! Total items in catalog: {len(existing_map)}")
    print(f"Total department relationships created: {len(all_dept_rows)}")

if __name__ == "__main__":
    fast_seed()
