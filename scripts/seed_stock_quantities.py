import json
import urllib.request
import datetime
from typing import List, Dict, Any, Tuple

SUPABASE_URL = "https://insenbrtdrwfomazehna.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imluc2VuYnJ0ZHJ3Zm9tYXplaG5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1Nzk0MTcsImV4cCI6MjEwMDE1NTQxN30.wcLPIj8f2UhfZKN7z3r0ux7bvim6sq5d1beZWemXa00"

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

def fetch_existing_items() -> Dict[str, Dict[str, Any]]:
    """Fetch all items from Supabase mapped by lowercase normalized name with retries."""
    for attempt in range(5):
        try:
            req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/items?select=id,name,department,category", headers=HEADERS)
            with urllib.request.urlopen(req, timeout=15) as resp:
                items = json.loads(resp.read().decode("utf-8"))
            return {item['name'].strip().lower(): item for item in items}
        except Exception as e:
            if attempt == 4: raise e
            import time; time.sleep(1)
    return {}

def post_transactions(transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Insert inventory_transactions into Supabase."""
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/inventory_transactions",
        data=json.dumps(transactions).encode("utf-8"),
        headers=HEADERS,
        method="POST"
    )
    with urllib.request.urlopen(req) as resp:
        content = resp.read().decode("utf-8")
        return json.loads(content) if content else []

def seed_quantities(item_qty_dict: Dict[str, float], note: str = "Initial Opening Stock for Launch") -> Tuple[int, List[str]]:
    """
    Given a dictionary of {item_name: quantity}, match with database items and insert receive transactions.
    """
    existing_items = fetch_existing_items()
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    
    tx_rows = []
    unmatched = []
    matched_count = 0
    
    for name, qty in item_qty_dict.items():
        clean_name = name.strip().lower()
        matched_item = existing_items.get(clean_name)
        
        # Try substring match if direct match fails
        if not matched_item:
            for k, v in existing_items.items():
                if clean_name in k or k in clean_name:
                    matched_item = v
                    break
        
        if matched_item:
            tx_rows.append({
                "item_id": matched_item["id"],
                "type": "receive",
                "quantity": float(qty),
                "department": matched_item.get("department", "Retail"),
                "transaction_date": now_iso,
                "notes": note
            })
            matched_count += 1
        else:
            unmatched.append(name)
            
    if tx_rows:
        inserted = post_transactions(tx_rows)
        print(f"Successfully inserted {len(inserted)} stock transactions!")
        
    if unmatched:
        print(f"Warning: {len(unmatched)} item(s) could not be matched in database catalog: {unmatched}")
        
    return matched_count, unmatched

if __name__ == "__main__":
    items = fetch_existing_items()
    print(f"Script ready. Total active items in Supabase catalog: {len(items)}")
