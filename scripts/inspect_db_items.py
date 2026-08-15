import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

SUPABASE_URL = "https://insenbrtdrwfomazehna.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imluc2VuYnJ0ZHJ3Zm9tYXplaG5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1Nzk0MTcsImV4cCI6MjEwMDE1NTQxN30.wcLPIj8f2UhfZKN7z3r0ux7bvim6sq5d1beZWemXa00"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

url = f"{SUPABASE_URL}/rest/v1/items?select=id,name,category,department,unit_cost&order=name"
req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req) as resp:
    items = json.loads(resp.read().decode('utf-8'))
    print(f"Total items in DB: {len(items)}")
    for item in items:
        if any(w in item['name'].lower() for w in ['cube', 'water', 'soda']):
            print(f"{item['id']} | {item['name']} | {item['category']} | {item['department']} | ₦{item['unit_cost']}")
