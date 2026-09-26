import urllib.request
import json

SUPABASE_URL = 'https://insenbrtdrwfomazehna.supabase.co'
SUPABASE_KEY = 'sb_publishable_S-qu2XDOegUZB_XJnlbLjg_aqKUXB4h'

# 1. Sign in
body = {'email': 'stock_auditor@stockist.local', 'password': 'Stockist#2026!SecureAudit'}
req = urllib.request.Request(f'{SUPABASE_URL}/auth/v1/token?grant_type=password', data=json.dumps(body).encode(), headers={'apikey': SUPABASE_KEY, 'Content-Type': 'application/json'}, method='POST')
with urllib.request.urlopen(req) as r:
    token = json.loads(r.read())['access_token']

auth_headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

# 2. Get items
req_items = urllib.request.Request(f'{SUPABASE_URL}/rest/v1/items?select=id,name', headers=auth_headers)
with urllib.request.urlopen(req_items) as r:
    items_map = {it['id']: it['name'] for it in json.loads(r.read())}

# 3. Get transactions for Sept 18
url = f'{SUPABASE_URL}/rest/v1/inventory_transactions?select=id,item_id,type,quantity,transaction_date,department,metadata&transaction_date=gte.2026-09-18T00:00:00&order=transaction_date.desc'
req = urllib.request.Request(url, headers=auth_headers)
with urllib.request.urlopen(req) as r:
    txs = json.loads(r.read())

print(f"Total Sept 18 inventory_transactions: {len(txs)}")
sale_txs = [t for t in txs if t.get('type') == 'sale']
print(f"Total sale transactions: {len(sale_txs)}")

for t in sale_txs:
    item_name = items_map.get(t['item_id'], 'Unknown')
    fname = t.get('metadata', {}).get('file_name', 'N/A') if isinstance(t.get('metadata'), dict) else 'N/A'
    print(f"  - {item_name}: sold {t['quantity']} | file: {fname}")

# 4. Check daily_stock_sheets for Sept 18
sheet_url = f'{SUPABASE_URL}/rest/v1/daily_stock_sheets?select=item_id,open_qty,close_qty,sales_qty,remark&date=eq.2026-09-18'
req_sheet = urllib.request.Request(sheet_url, headers=auth_headers)
with urllib.request.urlopen(req_sheet) as r:
    sheets = json.loads(r.read())
print(f"\nTotal daily_stock_sheets rows for Sept 18: {len(sheets)}")
for s in sheets[:10]:
    item_name = items_map.get(s['item_id'], 'Unknown')
    print(f"  - {item_name}: open={s['open_qty']}, close={s['close_qty']}, sales_qty={s['sales_qty']}, remark={s.get('remark')}")
