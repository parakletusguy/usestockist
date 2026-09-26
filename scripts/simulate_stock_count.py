import urllib.request
import json

SUPABASE_URL = 'https://insenbrtdrwfomazehna.supabase.co'
SUPABASE_KEY = 'sb_publishable_S-qu2XDOegUZB_XJnlbLjg_aqKUXB4h'

body = {'email': 'stock_auditor@stockist.local', 'password': 'Stockist#2026!SecureAudit'}
req = urllib.request.Request(f'{SUPABASE_URL}/auth/v1/token?grant_type=password', data=json.dumps(body).encode(), headers={'apikey': SUPABASE_KEY, 'Content-Type': 'application/json'}, method='POST')
with urllib.request.urlopen(req) as r:
    token = json.loads(r.read())['access_token']

auth_headers = {'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

startD = '2026-09-18'
endD = '2026-09-18'
startTxD = f"{startD}T00:00:00"
endTxD = f"{endD}T23:59:59.999Z"

# 1. items
url_items = f"{SUPABASE_URL}/rest/v1/items?select=*"
with urllib.request.urlopen(urllib.request.Request(url_items, headers=auth_headers)) as r:
    items = json.loads(r.read())

# 2. current period transactions
url_tx = f"{SUPABASE_URL}/rest/v1/inventory_transactions?select=item_id,type,quantity,department&transaction_date=gte.{startTxD}&transaction_date=lte.{endTxD}"
with urllib.request.urlopen(urllib.request.Request(url_tx, headers=auth_headers)) as r:
    tx_curr = json.loads(r.read())

# 3. daily_stock_sheets
url_sheets = f"{SUPABASE_URL}/rest/v1/daily_stock_sheets?select=item_id,open_qty,close_qty,sales_qty,remark,date&date=gte.{startD}&date=lte.{endD}"
with urllib.request.urlopen(urllib.request.Request(url_sheets, headers=auth_headers)) as r:
    sheets = json.loads(r.read())

# 4. issuance
url_iss = f"{SUPABASE_URL}/rest/v1/issuance_ledger?select=item_id,quantity&date=gte.{startD}&date=lte.{endD}"
with urllib.request.urlopen(urllib.request.Request(url_iss, headers=auth_headers)) as r:
    iss_curr = json.loads(r.read())

# 5. received
url_rcv = f"{SUPABASE_URL}/rest/v1/received_ledger?select=item_id,quantity&date=gte.{startD}&date=lte.{endD}"
with urllib.request.urlopen(urllib.request.Request(url_rcv, headers=auth_headers)) as r:
    rcv_curr = json.loads(r.read())

sheets_by_item = {}
for s in sheets:
    sheets_by_item.setdefault(s['item_id'], []).append(s)

def sum_tx(item_id, tx_type):
    return sum(float(t['quantity'] or 0) for t in tx_curr if t['item_id'] == item_id and t['type'] == tx_type)

def sum_ledger(rows, item_id):
    return sum(float(r['quantity'] or 0) for r in rows if r['item_id'] == item_id)

print(f"--- RECONCILED STOCK COUNT FOR 2026-09-18 ---")
reconciled_items = []
for it in items:
    s_list = sheets_by_item.get(it['id'], [])
    sheet_open = sum(float(s['open_qty'] or 0) for s in s_list)
    sheet_sold = sum(float(s['sales_qty'] or 0) for s in s_list)
    
    tx_sold = sum_tx(it['id'], 'sale')
    tx_iss = sum_tx(it['id'], 'issuance')
    tx_rcv = sum_tx(it['id'], 'receive')
    
    ledg_iss = sum_ledger(iss_curr, it['id'])
    ledg_rcv = sum_ledger(rcv_curr, it['id'])
    
    tot_sold = tx_sold + sheet_sold
    tot_iss = max(tx_iss, ledg_iss)
    tot_rcv = max(tx_rcv, ledg_rcv)
    
    # Check if item has activity or sheet
    if sheet_open > 0 or tot_sold > 0 or tot_iss > 0 or tot_rcv > 0:
        balance = sheet_open + tot_rcv - tot_iss - tot_sold
        reconciled_items.append({
            'name': it['name'],
            'department': it.get('department'),
            'opening': sheet_open,
            'received': tot_rcv,
            'issued': tot_iss,
            'sold': tot_sold,
            'balance': balance
        })

reconciled_items.sort(key=lambda x: (x['sold'] == 0, x['name']))
for r in reconciled_items:
    if r['sold'] > 0 or r['issued'] > 0 or r['received'] > 0:
        print(f"{r['name']:<25} | Open: {r['opening']:>6} | Rcv: {r['received']:>4} | Iss: {r['issued']:>4} | SOLD: {r['sold']:>6} | BALANCE: {r['balance']:>6}")
