const RATE_LIMIT_CONFIG_ERROR =
  "RATE_LIMIT_STORAGE not configured. Set KV_REST_API_URL or UPSTASH_REDIS_REST_URL in environment variables."

interface RateLimitConfig {
  baseUrl: string
  token: string
}

interface RedisResponse<T> {
  result?: T
  error?: string
}

function getRateLimitConfig(): RateLimitConfig {
  const baseUrl =
    process.env.KV_REST_API_URL?.trim() ||
    process.env.UPSTASH_REDIS_REST_URL?.trim() ||
    ""
  const token =
    process.env.KV_REST_API_TOKEN?.trim() ||
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ||
    ""

  if (!baseUrl || !token) {
    throw new Error(RATE_LIMIT_CONFIG_ERROR)
  }

  return {
    baseUrl,
    token
  }
}

async function callRedis<T>(config: RateLimitConfig, command: Array<string | number>) {
  const response = await fetch(config.baseUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(command),
    cache: "no-store"
  })

  if (!response.ok) {
    throw new Error(`Rate limit storage request failed with ${response.status}.`)
  }

  const payload = (await response.json()) as RedisResponse<T>

  if (payload.error) {
    throw new Error(payload.error)
  }

  if (typeof payload.result === "undefined") {
    throw new Error("Rate limit storage returned an empty result.")
  }

  return payload.result
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const config = getRateLimitConfig()
  const redisKey = `ratelimit:${key}`

  try {
    const count = Number(await callRedis<number>(config, ["INCR", redisKey]))

    if (count === 1) {
      await callRedis<number>(config, ["EXPIRE", redisKey, windowSeconds])
    }

    const ttlMs = Number(await callRedis<number>(config, ["PTTL", redisKey]))
    const safeTtlMs = ttlMs > 0 ? ttlMs : windowSeconds * 1000

    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      resetAt: Date.now() + safeTtlMs
    }
  } catch (error) {
    console.error("Rate limit storage unavailable, allowing request.", error)

    return {
      allowed: true,
      remaining: limit,
      resetAt: Date.now() + windowSeconds * 1000
    }
  }
}
