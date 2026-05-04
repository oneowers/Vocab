import time
import requests

BASE_URL = "http://localhost:3000"
REGISTER_URL = f"{BASE_URL}/api/auth/register"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
CARDS_URL = f"{BASE_URL}/api/cards"

def setup_auth():
    """Register and login a dynamic user, returning the session cookies."""
    timestamp = str(int(time.time() * 1000))
    email = f"testuser{timestamp}@example.com"
    password = f"StrongPass!{timestamp}"

    credentials = {"email": email, "password": password}

    # Register
    reg_resp = requests.post(REGISTER_URL, json=credentials, timeout=30)
    assert reg_resp.status_code in [200, 201], f"Registration failed: {reg_resp.text}"

    # Login
    login_resp = requests.post(LOGIN_URL, json=credentials, timeout=30)
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"

    cookies = login_resp.cookies
    assert cookies is not None and len(cookies) > 0, "No cookies returned on login"
    return cookies

def run_negative_tests():
    print("Setting up authentication...")
    cookies = setup_auth()
    headers = {"Content-Type": "application/json"}
    
    print("\n--- Test 1: Missing 'original' field ---")
    payload_missing_original = {
        "translation": "яблоко",
        "direction": "en-ru"
    }
    resp1 = requests.post(CARDS_URL, json=payload_missing_original, cookies=cookies, headers=headers, timeout=30)
    assert resp1.status_code == 400, f"Expected 400, got {resp1.status_code}"
    data1 = resp1.json()
    assert data1.get("error") == "Validation error"
    assert any("original" in issue.get("path", []) for issue in data1.get("issues", [])), "Missing expected Zod issue for 'original'"
    print("✅ Passed!")

    print("\n--- Test 2: Missing 'translation' field ---")
    payload_missing_translation = {
        "original": "apple",
        "direction": "en-ru"
    }
    resp2 = requests.post(CARDS_URL, json=payload_missing_translation, cookies=cookies, headers=headers, timeout=30)
    assert resp2.status_code == 400, f"Expected 400, got {resp2.status_code}"
    data2 = resp2.json()
    assert data2.get("error") == "Validation error"
    assert any("translation" in issue.get("path", []) for issue in data2.get("issues", [])), "Missing expected Zod issue for 'translation'"
    print("✅ Passed!")

    print("\n--- Test 3: Invalid 'direction' value ---")
    payload_invalid_direction = {
        "original": "apple",
        "translation": "яблоко",
        "direction": "ru-ru" # Invalid, expecting en-ru or ru-en
    }
    resp3 = requests.post(CARDS_URL, json=payload_invalid_direction, cookies=cookies, headers=headers, timeout=30)
    assert resp3.status_code == 400, f"Expected 400, got {resp3.status_code}"
    data3 = resp3.json()
    assert data3.get("error") == "Validation error"
    assert any("direction" in issue.get("path", []) for issue in data3.get("issues", [])), "Missing expected Zod issue for 'direction'"
    print("✅ Passed!")

    print("\n🎉 All negative tests passed successfully!")

if __name__ == "__main__":
    run_negative_tests()
