import urllib.request
import json

SUPABASE_URL = 'https://insenbrtdrwfomazehna.supabase.co'
SUPABASE_KEY = 'sb_publishable_S-qu2XDOegUZB_XJnlbLjg_aqKUXB4h'

body = {'email': 'stock_auditor@stockist.local', 'password': 'Stockist#2026!SecureAudit'}
req = urllib.request.Request(f'{SUPABASE_URL}/auth/v1/token?grant_type=password', data=json.dumps(body).encode(), headers={'apikey': SUPABASE_KEY, 'Content-Type': 'application/json'}, method='POST')
with urllib.request.urlopen(req) as r:
    token = json.loads(r.read())['access_token']

auth_headers = {'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

url = f'{SUPABASE_URL}/rest/v1/items?select=id,name,department'
with urllib.request.urlopen(urllib.request.Request(url, headers=auth_headers)) as r:
    items = json.loads(r.read())

targets = ['meat', 'chop', 'schweppes', 'straw', 'take', 'heineken']
for it in items:
    if any(t in it['name'].lower() for t in targets):
        print(f"{it['id']} | {it['name']} ({it.get('department')})")
