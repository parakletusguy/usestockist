import json
import urllib.request

SUPABASE_URL = "https://xbglpojlhjrhmkqwelgu.supabase.co"
SUPABASE_KEY = "sb_publishable_l0lq4OoeW1UCLoewaBU1vw_sd51yJYi"

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

def fetch_items():
    url = f"{SUPABASE_URL}/rest/v1/items?select=id,name,category,department&limit=1000"
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

if __name__ == "__main__":
    items = fetch_items()
    print(f"Total items in DB catalog: {len(items)}")
    for item in items[:15]:
        print(item)
