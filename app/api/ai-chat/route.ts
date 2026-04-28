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

function pickTopLevel(profile: Awaited<ReturnType<typeof fetchCefrProfile>>) {
  if (!profile?.buckets.length) {
    return null
  }

  return [...profile.buckets]
    .sort((left, right) => right.percentage - left.percentage)
    .find((bucket) => bucket.percentage > 0)?.level ?? null
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

  if (!translatedText && !dictionary && !profile) {
    return NextResponse.json(
      {
        reply:
          "I could not build a study answer for that yet. Try a single word, a short phrase, or tap one of the prompt chips.",
        mode: "fallback"
      },
      { status: 200 }
    )
  }

  const lines: string[] = []
  const topicLabel = isSingleWord(message) ? "word" : "phrase"

  if (translatedText) {
    lines.push(`Translation: ${translatedText}`)
  }

  if (translationResult?.translationAlternatives.length) {
    lines.push(`Alternatives: ${translationResult.translationAlternatives.slice(0, 4).join(", ")}`)
  }

  const detectedLevel = cefrCatalogWord?.cefrLevel ?? pickTopLevel(profile)

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
    lines.push(
      `Synonyms: ${dictionary.synonyms
        .slice(0, 5)
        .join(", ")}`
    )
  }

  lines.push(
    isSingleWord(message)
      ? `Tip: Add this ${topicLabel} to your deck if you want to practice it in flip, quiz, and write.`
      : "Tip: Break long text into smaller chunks if you want cleaner explanations and better CEFR feedback."
  )

  return NextResponse.json({
    reply: lines.join("\n\n"),
    mode: translatedText ? "study" : "fallback",
    source: translationResult?.source ?? null
  })
}
