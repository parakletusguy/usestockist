import json
import urllib.request

SUPABASE_URL = "https://xbglpojlhjrhmkqwelgu.supabase.co"
SUPABASE_KEY = "sb_publishable_l0lq4OoeW1UCLoewaBU1vw_sd51yJYi"

def test_login():
    url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
    headers = {
        "apikey": SUPABASE_KEY,
        "Content-Type": "application/json"
    }
    body = {
        "email": "user_seed_2026@stockist.local",
        "password": "St0ckist#2026!SecuredAdmin"
    }
    req = urllib.request.Request(url, data=json.dumps(body).encode('utf-8'), headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            token = data.get('access_token')
            print("Login Success! Token:", token[:25] + "...")
            return token
    except urllib.error.HTTPError as e:
        print("Error response:", e.read().decode('utf-8'))
        return None

if __name__ == "__main__":
    test_login()
