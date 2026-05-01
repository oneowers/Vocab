async function test() {
  try {
    const res = await fetch("http://localhost:3000/api/pro/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "FREEMONTH" })
    })
    const text = await res.text()
    console.log("Status:", res.status)
    console.log("Response:", text)
  } catch (e) {
    console.log("Fetch error:", e)
  }
}
test()
