import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

SUPABASE_URL = "https://insenbrtdrwfomazehna.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imluc2VuYnJ0ZHJ3Zm9tYXplaG5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1Nzk0MTcsImV4cCI6MjEwMDE1NTQxN30.wcLPIj8f2UhfZKN7z3r0ux7bvim6sq5d1beZWemXa00"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}"
}

url = f"{SUPABASE_URL}/rest/v1/inventory_transactions?select=*,items(name)&type=eq.sale"
req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req) as resp:
    txs = json.loads(resp.read().decode('utf-8'))
    print(f"Total sale transactions in inventory_transactions: {len(txs)}")
    for t in txs:
        item_name = t['items']['name'] if t.get('items') else 'Unknown'
        print(f"ID: {t['id']} | Item: {item_name} | Qty: {t['quantity']} | Date: {t['transaction_date']} | Dept: {t['department']}")
