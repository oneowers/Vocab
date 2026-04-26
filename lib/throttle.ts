const throttleMap = new Map<string, number>()

export function isRateLimited(key: string, windowMs = 1000) {
  const now = Date.now()
  const lastSeen = throttleMap.get(key)

  if (typeof lastSeen === "number" && now - lastSeen < windowMs) {
    return true
  }

  throttleMap.set(key, now)
  return false
}

