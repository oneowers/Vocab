import { NextRequest, NextResponse } from "next/server"

import { getOptionalAuthUser } from "@/lib/auth"
import { findCatalogWordByWord, getOrCreateAppSettings, resolveTranslationDetails } from "@/lib/catalog"
import { fetchCefrProfile } from "@/lib/cefr-profile"
import { fetchDictionaryDetails } from "@/lib/dictionary"
import { getPrisma } from "@/lib/prisma"
import { isRateLimited } from "@/lib/throttle"

type AiChatRequestBody = {
  message?: string
}

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string
      }>
    }
  }>
}

type StudyDictionary = Awaited<ReturnType<typeof fetchDictionaryDetails>> | null

function getThrottleKey(request: NextRequest, userId: string | null) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  return userId || forwardedFor || "guest"
}

function extractStudyQuery(message: string) {
  return message
    .trim()
    .replace(/^translate\s+/i, "")
    .replace(/^what does\s+(.+?)\s+mean\??$/i, "$1")
    .replace(/^meaning of\s+/i, "")
    .replace(/^explain\s+/i, "")
    .replace(/^как переводится\s+/i, "")
    .replace(/^переведи\s+/i, "")
    .trim()
}

function hasCyrillic(input: string) {
  return /[А-Яа-яЁё]/.test(input)
}

function hasLatin(input: string) {
  return /[A-Za-z]/.test(input)
}

function isSingleWord(input: string) {
  return input.trim().split(/\s+/).filter(Boolean).length === 1
}

function hasStudyIntent(input: string) {
  const normalized = input.trim().toLowerCase()

  if (isSingleWord(normalized)) {
    return true
  }

  return [
    "translate",
    "meaning",
    "explain",
    "word",
    "phrase",
    "sentence",
    "synonym",
    "synonyms",
    "pronunciation",
    "pronounce",
    "cefr",
    "level",
    "example",
    "examples",
    "remember",
    "переведи",
    "переводится",
    "значит",
    "объясни",
    "слово",
    "фраз",
    "предложени",
    "синоним",
    "произнос",
    "уровень",
    "пример",
    "запомнить"
  ].some((marker) => normalized.includes(marker))
}

function pickTopLevel(profile: Awaited<ReturnType<typeof fetchCefrProfile>>) {
  if (!profile?.buckets.length) {
    return null
  }

  return [...profile.buckets]
    .sort((left, right) => right.percentage - left.percentage)
    .find((bucket) => bucket.percentage > 0)?.level ?? null
}

function buildGeminiChatPrompt(rawMessage: string) {
  return [
    "You are Lexiflow's friendly AI study coach.",
    "Answer the learner directly in the same language they used.",
    "Do not translate their message unless they explicitly ask for a translation.",
    "If they ask about live/current information such as weather, be honest that you do not have live local data and give a useful general answer.",
    "Keep the answer concise and natural.",
    "",
    `Learner message: ${rawMessage}`
  ].join("\n")
}

function buildFallbackStudyReply({
  message,
  translatedText,
  translationAlternatives,
  detectedLevel,
  dictionary
}: {
  message: string
  translatedText: string | null
  translationAlternatives: string[]
  detectedLevel: string | null
  dictionary: StudyDictionary
}) {
  const lines: string[] = []
  const topicLabel = isSingleWord(message) ? "word" : "phrase"

  if (translatedText) {
    lines.push(`Answer: ${translatedText}`)
  }

  if (translationAlternatives.length) {
    lines.push(`Other options: ${translationAlternatives.slice(0, 4).join(", ")}`)
  }

  if (detectedLevel) {
    lines.push(`Level: ${detectedLevel}`)
  }

  if (dictionary?.phonetic) {
    lines.push(`Pronunciation: ${dictionary.phonetic}`)
  }

  if (dictionary?.example) {
    lines.push(`Example: ${dictionary.example}`)
  }

  if (dictionary?.synonyms.length) {
    lines.push(`Synonyms: ${dictionary.synonyms.slice(0, 5).join(", ")}`)
  }

  lines.push(
    isSingleWord(message)
      ? `Tip: Add this ${topicLabel} to your deck if you want to practice it in flip, quiz, and write.`
      : "Tip: Break long text into smaller chunks if you want cleaner explanations and better CEFR feedback."
  )

  return lines.join("\n\n")
}

function buildGeminiPrompt({
  rawMessage,
  message,
  sourceLang,
  targetLang,
  translatedText,
  translationAlternatives,
  detectedLevel,
  dictionary
}: {
  rawMessage: string
  message: string
  sourceLang: "EN" | "RU"
  targetLang: "EN" | "RU"
  translatedText: string | null
  translationAlternatives: string[]
  detectedLevel: string | null
  dictionary: StudyDictionary
}) {
  return [
    "You are Lexiflow's AI study coach for English and Russian vocabulary learners.",
    "Answer the learner directly, in the same language they used when possible.",
    "Keep the answer short, practical, and study-focused.",
    "Use the provided app context when it is available. Do not invent dictionary details.",
    "",
    `Learner request: ${rawMessage}`,
    `Normalized study query: ${message}`,
    `Detected direction: ${sourceLang} to ${targetLang}`,
    translatedText ? `Known answer: ${translatedText}` : "Known answer: unavailable",
    translationAlternatives.length
      ? `Other possible answers: ${translationAlternatives.slice(0, 6).join(", ")}`
      : "Other possible answers: unavailable",
    detectedLevel ? `CEFR level: ${detectedLevel}` : "CEFR level: unavailable",
    dictionary?.phonetic ? `Pronunciation: ${dictionary.phonetic}` : "Pronunciation: unavailable",
    dictionary?.example ? `Dictionary example: ${dictionary.example}` : "Dictionary example: unavailable",
    dictionary?.synonyms.length
      ? `Synonyms: ${dictionary.synonyms.slice(0, 8).join(", ")}`
      : "Synonyms: unavailable",
    "",
    "Format:",
    "- Start with the best direct answer.",
    "- Add one short explanation or usage note.",
    "- Add pronunciation, CEFR, synonyms, or an example only when context provides it.",
    "- End with one tiny practice tip."
  ].join("\n")
}

async function fetchGeminiStudyReply(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY?.trim()

  if (!apiKey) {
    return null
  }

  const model = (process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash").replace(/^models\//, "")
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
        generationConfig: {
          temperature: 0.45,
          maxOutputTokens: 420
        }
      })
    }
  )

  if (!response.ok) {
    return null
  }

  const payload = (await response.json().catch(() => null)) as GeminiGenerateContentResponse | null

  return payload?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text)
    .filter(Boolean)
    .join("")
    .trim() || null
}

export async function POST(request: NextRequest) {
  const user = await getOptionalAuthUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (isRateLimited(`ai-chat:${getThrottleKey(request, user.id)}`)) {
    return NextResponse.json({ error: "Slow down a little." }, { status: 429 })
  }

  const body = (await request.json().catch(() => null)) as AiChatRequestBody | null
  const rawMessage = body?.message?.trim()

  if (!rawMessage) {
    return NextResponse.json({ error: "Missing message." }, { status: 400 })
  }

  const message = extractStudyQuery(rawMessage).slice(0, 400)

  if (!message) {
    return NextResponse.json({ error: "Missing message." }, { status: 400 })
  }

  if (!hasStudyIntent(rawMessage)) {
    const geminiReply = await fetchGeminiStudyReply(buildGeminiChatPrompt(rawMessage)).catch(() => null)

    return NextResponse.json({
      reply:
        geminiReply ||
        "I can help with that, but Gemini is not available right now. Try again in a moment.",
      mode: geminiReply ? "study" : "fallback",
      source: null
    })
  }

  const prisma = getPrisma()
  const settings = await getOrCreateAppSettings(prisma)

  const sourceLang = hasCyrillic(message) && !hasLatin(message) ? "RU" : "EN"
  const targetLang = sourceLang === "EN" ? "RU" : "EN"
  const translationResult = await resolveTranslationDetails({
    prisma,
    query: message,
    sourceLang,
    targetLang
  })

  const translatedText = translationResult?.translation?.trim() || null
  const dictionaryWord =
    sourceLang === "EN"
      ? message
      : targetLang === "EN" && translatedText
        ? translatedText
        : null

  const shouldLoadDictionary = Boolean(dictionaryWord && isSingleWord(dictionaryWord))
  const shouldProfile = settings.cefrProfilerEnabled && message.split(/\s+/).filter(Boolean).length <= 24

  const [dictionary, profile, cefrCatalogWord] = await Promise.all([
    shouldLoadDictionary ? fetchDictionaryDetails(dictionaryWord as string) : Promise.resolve(null),
    shouldProfile ? fetchCefrProfile(sourceLang === "EN" ? message : translatedText || message) : Promise.resolve(null),
    sourceLang === "EN" && isSingleWord(message)
      ? findCatalogWordByWord(prisma, message)
      : dictionaryWord && sourceLang === "RU" && isSingleWord(dictionaryWord)
        ? findCatalogWordByWord(prisma, dictionaryWord)
        : Promise.resolve(null)
  ])

  const detectedLevel = cefrCatalogWord?.cefrLevel ?? pickTopLevel(profile)
  const fallbackReply = buildFallbackStudyReply({
    message,
    translatedText,
    translationAlternatives: translationResult?.translationAlternatives ?? [],
    detectedLevel,
    dictionary
  })
  const geminiReply = await fetchGeminiStudyReply(
    buildGeminiPrompt({
      rawMessage,
      message,
      sourceLang,
      targetLang,
      translatedText,
      translationAlternatives: translationResult?.translationAlternatives ?? [],
      detectedLevel,
      dictionary
    })
  ).catch(() => null)

  if (!geminiReply && !translatedText && !dictionary && !profile) {
    return NextResponse.json(
      {
        reply:
          "I could not build a study answer for that yet. Try a single word, a short phrase, or tap one of the prompt chips.",
        mode: "fallback"
      },
      { status: 200 }
    )
  }

  return NextResponse.json({
    reply: geminiReply || fallbackReply,
    mode: translatedText ? "study" : "fallback",
    source: translationResult?.source ?? null
  })
}
