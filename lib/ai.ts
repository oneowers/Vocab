import { generateText } from "ai"

type AiTextProvider = "gateway" | "gemini"

type GenerateLexiAiTextOptions = {
  prompt: string
  purpose: string
  temperature?: number
  maxOutputTokens?: number
  responseMimeType?: "application/json" | "text/plain"
}

export type LexiAiTextResult = {
  text: string
  provider: AiTextProvider
  model: string
}

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string
        thought?: boolean
      }>
    }
  }>
  error?: {
    code?: number
    message?: string
    status?: string
  }
}

function getGatewayModel() {
  return (
    process.env.AI_GATEWAY_MODEL?.trim() ||
    process.env.LEXIFLOW_AI_MODEL?.trim() ||
    "openai/gpt-5.4"
  )
}

function getGeminiModel() {
  return (process.env.GEMINI_MODEL?.trim() || "gemini-1.5-flash").replace(/^models\//, "")
}

function getProviderOrder(): AiTextProvider[] {
  const configuredOrder = process.env.AI_PROVIDER_ORDER
    ?.split(",")
    .map((item) => item.trim().toLowerCase())
    .filter((item): item is AiTextProvider => item === "gateway" || item === "gemini")

  if (configuredOrder?.length) {
    return Array.from(new Set(configuredOrder))
  }

  const hasGatewayHint = Boolean(
    process.env.AI_GATEWAY_API_KEY?.trim() ||
      process.env.VERCEL_OIDC_TOKEN?.trim() ||
      process.env.VERCEL === "1" ||
      process.env.VERCEL_ENV
  )

  return hasGatewayHint ? ["gateway", "gemini"] : ["gemini", "gateway"]
}

function supportsDisabledGeminiThinking(model: string) {
  const normalized = model.toLowerCase()

  return normalized.includes("gemini-2.0-flash")
}

function summarizeAiError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)

  return message
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [redacted]")
    .replace(/key=[A-Za-z0-9._-]+/g, "key=[redacted]")
    .slice(0, 500)
}

async function requestGatewayText({
  prompt,
  temperature,
  maxOutputTokens
}: GenerateLexiAiTextOptions): Promise<LexiAiTextResult> {
  const model = getGatewayModel()
  const result = await generateText({
    model,
    prompt,
    temperature,
    maxOutputTokens,
    maxRetries: 1,
    timeout: {
      totalMs: 25_000
    }
  })
  const text = result.text.trim()

  if (!text) {
    throw new Error("AI Gateway returned an empty response.")
  }

  return {
    text,
    provider: "gateway",
    model
  }
}

async function requestGeminiText({
  prompt,
  temperature,
  maxOutputTokens,
  responseMimeType
}: GenerateLexiAiTextOptions): Promise<LexiAiTextResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim()

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.")
  }

  const model = getGeminiModel()
  const generationConfig: Record<string, unknown> = {
    temperature,
    maxOutputTokens
  }

  if (responseMimeType) {
    generationConfig.responseMimeType = responseMimeType
  }

  if (supportsDisabledGeminiThinking(model)) {
    generationConfig.thinkingConfig = {
      thinkingBudget: 0
    }
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        generationConfig
      })
    }
  )
  const payload = (await response.json().catch(() => null)) as GeminiGenerateContentResponse | null

  if (!response.ok) {
    throw new Error(
      `Gemini request failed with ${response.status}: ${
        payload?.error?.message ?? response.statusText
      }`
    )
  }

  const text = payload?.candidates
    ?.flatMap((candidate) => candidate.content?.parts ?? [])
    .filter((part) => !part.thought)
    .map((part) => part.text?.trim())
    .filter((part): part is string => Boolean(part))
    .join("")
    .trim()

  if (!text) {
    throw new Error("Gemini returned an empty response.")
  }

  return {
    text,
    provider: "gemini",
    model
  }
}

export async function generateLexiAiText(
  options: GenerateLexiAiTextOptions
): Promise<LexiAiTextResult | null> {
  for (const provider of getProviderOrder()) {
    try {
      return provider === "gateway"
        ? await requestGatewayText(options)
        : await requestGeminiText(options)
    } catch (error) {
      const model = provider === "gateway" ? getGatewayModel() : getGeminiModel()

      console.error(`[ai:${options.purpose}] ${provider} provider failed.`, {
        model,
        error: summarizeAiError(error)
      })
    }
  }

  return null
}
