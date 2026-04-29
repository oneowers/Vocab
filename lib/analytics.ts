export function trackEvent(eventName: string) {
  if (typeof window === "undefined") return

  fetch("/api/analytics", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ event: eventName })
  }).catch(() => {
    // Ignore analytics errors
  })
}
