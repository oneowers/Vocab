import requests
import time

BASE_URL = "http://localhost:3000"
REGISTER_URL = BASE_URL + "/api/auth/register"
LOGIN_URL = BASE_URL + "/api/auth/login"
CARDS_URL = BASE_URL + "/api/cards"

def test_post_api_cards_create_new_vocabulary_card():
    headers = {"Content-Type": "application/json"}
    
    # Step 1: Dynamically register a new user
    timestamp = str(int(time.time() * 1000))
    credentials = {
        "email": f"testuser{timestamp}@example.com",
        "password": f"StrongPass!{timestamp}"
    }
    reg_resp = requests.post(REGISTER_URL, json=credentials, headers=headers, timeout=30)
    assert reg_resp.status_code in [200, 201], f"Registration failed [{reg_resp.status_code}]: {reg_resp.text}"

    # Step 2: Login - accept any auth cookie (email-session or sb-access-token)
    login_resp = requests.post(LOGIN_URL, json=credentials, headers=headers, timeout=30)
    assert login_resp.status_code == 200, f"Login failed [{login_resp.status_code}]: {login_resp.text}"
    cookies = login_resp.cookies
    assert len(cookies) > 0, "No session cookies returned after login"

    # Step 3: Create card with valid Zod-compatible payload
    payload = {
        "original": "apple",
        "translation": "яблоко",
        "direction": "en-ru"
    }
    card_resp = requests.post(CARDS_URL, json=payload, headers=headers, cookies=cookies, timeout=30)
    assert card_resp.status_code == 201, f"Expected 201, got {card_resp.status_code}: {card_resp.text}"

    data = card_resp.json()
    assert "card" in data, "Response missing 'card' object"
    card = data["card"]
    assert "id" in card, "Card missing 'id'"
    assert card.get("original") == payload["original"], f"original mismatch: {card.get('original')}"
    assert card.get("translation") == payload["translation"], f"translation mismatch: {card.get('translation')}"


test_post_api_cards_create_new_vocabulary_card()