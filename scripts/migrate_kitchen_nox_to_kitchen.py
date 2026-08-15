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

def patch_table_dept(table_name: str, dept_col: str, old_val: str, new_val: str):
    url = f"{SUPABASE_URL}/rest/v1/{table_name}?{dept_col}=eq.{urllib.parse.quote(old_val)}"
    payload = json.dumps({dept_col: new_val}).encode('utf-8')
    req = urllib.request.Request(url, data=payload, headers=HEADERS, method='PATCH')
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"Updated {table_name} ({dept_col}: '{old_val}' -> '{new_val}')")
    except Exception as e:
        print(f"Notice updating {table_name}: {e}")

def main():
    print("=== Migrating 'Kitchen (Nox)' -> 'Kitchen' in Database ===")
    
    tables = [
        ('items', 'department'),
        ('item_departments', 'department'),
        ('inventory_transactions', 'department'),
        ('daily_stock_sheets', 'retail_team_name'),
        ('issuance_ledger', 'recipient_group'),
        ('transfer_ledger', 'destination'),
        ('received_ledger', 'supplier')
    ]

    for tbl, col in tables:
        patch_table_dept(tbl, col, 'Kitchen (Nox)', 'Kitchen')

    print("=== Migration Complete! ===")

if __name__ == "__main__":
    main()
