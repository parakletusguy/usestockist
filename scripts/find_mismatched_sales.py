import urllib.request
import json

SUPABASE_URL = 'https://insenbrtdrwfomazehna.supabase.co'
SUPABASE_KEY = 'sb_publishable_S-qu2XDOegUZB_XJnlbLjg_aqKUXB4h'

body = {'email': 'stock_auditor@stockist.local', 'password': 'Stockist#2026!SecureAudit'}
req = urllib.request.Request(f'{SUPABASE_URL}/auth/v1/token?grant_type=password', data=json.dumps(body).encode(), headers={'apikey': SUPABASE_KEY, 'Content-Type': 'application/json'}, method='POST')
with urllib.request.urlopen(req) as r:
    token = json.loads(r.read())['access_token']

auth_headers = {'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

# Get all items
with urllib.request.urlopen(urllib.request.Request(f'{SUPABASE_URL}/rest/v1/items?select=id,name', headers=auth_headers)) as r:
    items = json.loads(r.read())

# Get sheets for Sept 18
with urllib.request.urlopen(urllib.request.Request(f'{SUPABASE_URL}/rest/v1/daily_stock_sheets?select=item_id,open_qty&date=eq.2026-09-18', headers=auth_headers)) as r:
    sheets = json.loads(r.read())
sheet_map = {s['item_id']: s['open_qty'] for s in sheets}

# Get sale tx for Sept 18
with urllib.request.urlopen(urllib.request.Request(f'{SUPABASE_URL}/rest/v1/inventory_transactions?select=item_id,quantity&type=eq.sale&transaction_date=gte.2026-09-18T00:00:00', headers=auth_headers)) as r:
    sales = json.loads(r.read())
sales_map = {}
for s in sales:
    sales_map[s['item_id']] = sales_map.get(s['item_id'], 0) + s['quantity']

seen = set()
for it in items:
    s_open = sheet_map.get(it['id'], 0)
    s_sold = sales_map.get(it['id'], 0)
    norm = it['name'].lower().replace(' ', '').replace('-', '').replace('(', '').replace(')', '').replace('drink', '')
    
    sim = [o for o in items if o['id'] != it['id'] and o['name'].lower().replace(' ', '').replace('-', '').replace('(', '').replace(')', '').replace('drink', '') == norm]
    for other in sim:
        pair = tuple(sorted([it['id'], other['id']]))
        if pair not in seen:
            seen.add(pair)
            print(f"DUPLICATE PAIR:")
            print(f"  Item A: \"{it['name']}\" (open: {s_open}, sold: {s_sold})")
            print(f"  Item B: \"{other['name']}\" (open: {sheet_map.get(other['id'], 0)}, sold: {sales_map.get(other['id'], 0)})")

print("\n--- ALL ITEMS WITH SALES ON SEPT 18 ---")
for it in items:
    sold = sales_map.get(it['id'], 0)
    if sold > 0:
        op = sheet_map.get(it['id'], None)
        print(f"{it['name']:<28} | Sold: {sold:>6} | Sheet Opening: {str(op):>6}")
