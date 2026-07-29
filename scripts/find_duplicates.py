import urllib.request
import json

SUPABASE_URL = 'https://insenbrtdrwfomazehna.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imluc2VuYnJ0ZHJ3Zm9tYXplaG5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1Nzk0MTcsImV4cCI6MjEwMDE1NTQxN30.wcLPIj8f2UhfZKN7z3r0ux7bvim6sq5d1beZWemXa00'
HEADERS = {'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {SUPABASE_KEY}'}

def get_data(endpoint):
    req = urllib.request.Request(f'{SUPABASE_URL}/rest/v1/{endpoint}', headers=HEADERS)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

items = get_data('items?select=*')
item_depts = get_data('item_departments?select=*')

print(f"Total items in DB: {len(items)}")

# 1. Exact duplicates check
by_name = {}
for i in items:
    k = i['name'].strip().lower()
    by_name.setdefault(k, []).append(i)

exact_dups = {k: v for k, v in by_name.items() if len(v) > 1}
print(f"\nExact name duplicates: {len(exact_dups)}")
for name, group in exact_dups.items():
    print(f"  Item: '{group[0]['name']}' (Count: {len(group)})")
    for g in group:
        print(f"    - ID: {g['id']}, Dept: {g['department']}, Category: {g['category']}, Cost: {g['unit_cost']}")

# 2. Print all names sorted to detect near-duplicates
names = sorted([i['name'] for i in items])
print(f"\nAll {len(names)} items:")
for n in names:
    print(f"  - {n}")
