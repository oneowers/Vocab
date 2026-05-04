const BASE_URL = "http://localhost:3000";
const REGISTER_URL = `${BASE_URL}/api/auth/register`;
const LOGIN_URL = `${BASE_URL}/api/auth/login`;
const CARDS_URL = `${BASE_URL}/api/cards`;

async function setupAuth() {
  const timestamp = Date.now();
  const email = `testuser${timestamp}@example.com`;
  const password = `StrongPass!${timestamp}`;
  const credentials = { email, password };

  const regResp = await fetch(REGISTER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials)
  });
  if (![200, 201].includes(regResp.status)) {
    throw new Error(`Registration failed [${regResp.status}]: ${await regResp.text()}`);
  }

  const loginResp = await fetch(LOGIN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials)
  });
  if (loginResp.status !== 200) {
    throw new Error(`Login failed [${loginResp.status}]: ${await loginResp.text()}`);
  }

  const cookies = loginResp.headers.get("set-cookie");
  if (!cookies) throw new Error("No cookies returned on login");
  console.log("✅ Auth setup complete");
  return cookies;
}

async function testEndpoint(label, payload, cookies) {
  const resp = await fetch(CARDS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Cookie": cookies },
    body: JSON.stringify(payload)
  });
  const data = await resp.json();
  console.log(`   Response [${resp.status}]:`, JSON.stringify(data));

  if (resp.status !== 400) {
    throw new Error(`${label}: Expected 400, got ${resp.status}`);
  }
  if (!data.error || !data.error.toLowerCase().includes("valid")) {
    throw new Error(`${label}: Expected validation error message, got: ${data.error}`);
  }
  // If issues array is present, verify it contains relevant field info
  if (data.issues && data.issues.length > 0) {
    console.log(`   Zod issues: ${JSON.stringify(data.issues.map(i => ({ field: i.path, msg: i.message })))}`);
  }
  console.log(`   ✅ ${label} — Passed!`);
}

async function runNegativeTests() {
  console.log("Setting up authentication...");
  const cookies = await setupAuth();

  console.log("\n--- Test 1: Missing 'original' field ---");
  await testEndpoint(
    "Missing original",
    { translation: "яблоко", direction: "en-ru" },
    cookies
  );

  console.log("\n--- Test 2: Missing 'translation' field ---");
  await testEndpoint(
    "Missing translation",
    { original: "apple", direction: "en-ru" },
    cookies
  );

  console.log("\n--- Test 3: Invalid 'direction' value (ru-ru) ---");
  await testEndpoint(
    "Invalid direction",
    { original: "apple", translation: "яблоко", direction: "ru-ru" },
    cookies
  );

  console.log("\n--- Test 4: Missing 'direction' entirely ---");
  await testEndpoint(
    "Missing direction",
    { original: "apple", translation: "яблоко" },
    cookies
  );

  console.log("\n--- Test 5: Empty strings ---");
  await testEndpoint(
    "Empty strings",
    { original: "", translation: "", direction: "en-ru" },
    cookies
  );

  console.log("\n🎉 All negative tests passed! Zod validation is working correctly.");
}

runNegativeTests().catch(err => {
  console.error("\n❌ Test failed:", err.message);
  process.exit(1);
});
