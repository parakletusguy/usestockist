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

url = f"{SUPABASE_URL}/rest/v1/daily_stock_sheets?select=id,date,open_qty,qty_in,sales_qty,close_qty,remark,items(name)&date=eq.2026-08-07"
req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req) as resp:
    rows = json.loads(resp.read().decode('utf-8'))
    print(f"Total synced stock sheet records for 2026-08-07: {len(rows)}")
    print("-" * 75)
    print(f"{'Item Name':<32} | {'Open':<5} | {'In':<4} | {'Sold':<5} | {'Close':<6} | {'Remark'}")
    print("-" * 75)
    for r in rows[:25]:
        name = r['items']['name'] if r.get('items') else 'Unknown'
        remark = r['remark'] or ''
        print(f"{name:<32} | {r['open_qty']:<5} | {r['qty_in']:<4} | {r['sales_qty']:<5} | {r['close_qty']:<6} | {remark}")
