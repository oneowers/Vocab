async function test() {
  const url = 'http://localhost:3000/api/practice/translation-challenge';
  
  // We need a cookie to be authenticated as admin@localhost in dev
  // If the server is running with NEXT_PUBLIC_GUEST_MODE=true or dev-admin=true
  
  console.log("Testing API for variety...");
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Cookie": "dev-admin=true; dev-role=ADMIN" 
        },
        body: JSON.stringify({ action: "generate" })
      });
      const data = await res.json();
      console.log(`Call ${i+1}:`, data.russianText);
    } catch (e) {
      console.log(`Call ${i+1} failed:`, e.message);
    }
  }
}

test();
