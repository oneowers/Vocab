import { NextRequest, NextResponse } from "next/server"

import { getOptionalAuthUser } from "@/lib/auth"
import { generateLexiAiText } from "@/lib/ai"
import {
  buildQuizPrompt,
  buildQuizRepairPrompt,
  buildWordListPrompt,
  parseAIBlockFromText,
  type TargetWord
} from "@/lib/ai-blocks"
import { findCatalogWordByWord, getOrCreateAppSettings, resolveTranslationDetails } from "@/lib/catalog"
import { fetchCefrProfile } from "@/lib/cefr-profile"
import { fetchDictionaryDetails } from "@/lib/dictionary"
import { getPrisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/throttle"

type AiChatRequestBody = {
  message?: string
  mode?: string
  history?: Array<{
    role?: string
    content?: string
  }>
}

type StudyDictionary = Awaited<ReturnType<typeof fetchDictionaryDetails>> | null
type AiChatMode = "chat" | "prompts" | "story" | "quiz" | "memory" | "roleplay" | "review"

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

function isAiChatMode(value: string | undefined): value is AiChatMode {
  return (
    value === "chat" ||
    value === "prompts" ||
    value === "story" ||
    value === "quiz" ||
    value === "memory" ||
    value === "roleplay" ||
    value === "review"
  )
}

function isInteractiveMode(mode: AiChatMode) {
  return (
    mode === "story" ||
    mode === "quiz" ||
    mode === "memory" ||
    mode === "roleplay" ||
    mode === "review"
  )
}

function normalizeHistory(history: AiChatRequestBody["history"]) {
  return (history ?? [])
    .filter((item) => item.role === "assistant" || item.role === "user")
    .map((item) => ({
      role: item.role as "assistant" | "user",
      content: item.content?.trim().slice(0, 1200) ?? ""
    }))
    .filter((item) => item.content)
    .slice(-10)
}

function formatHistory(history: ReturnType<typeof normalizeHistory>) {
  if (!history.length) {
    return "Conversation so far: none"
  }

  return [
    "Conversation so far:",
    ...history.map((item) => `${item.role === "assistant" ? "Coach" : "Learner"}: ${item.content}`)
  ].join("\n")
}

function hasStudyIntent(input: string) {
  const normalized = input.trim().toLowerCase()

  if (isSingleWord(normalized)) {
    return true
  }

  return [
    "translate", "meaning", "explain", "word", "phrase", "sentence",
    "synonym", "synonyms", "pronunciation", "pronounce", "cefr", "level",
    "example", "examples", "remember", "quiz", "test", "drill", "roleplay",
    "story", "review", "переведи", "переводится", "значит", "объясни",
    "слово", "фраз", "предложени", "синоним", "произнос", "уровень",
    "пример", "запомнить", "тест", "викторин", "задани", "вопрос",
    "роль", "истори", "проверь"
  ].some((marker) => normalized.includes(marker))
}

function pickTopLevel(profile: Awaited<ReturnType<typeof fetchCefrProfile>>) {
  if (!profile?.buckets.length) {
    return null
  }

  return (
    [...profile.buckets]
      .sort((left, right) => right.percentage - left.percentage)
      .find((bucket) => bucket.percentage > 0)?.level ?? null
  )
}

function buildAiChatPrompt(
  rawMessage: string,
  history: ReturnType<typeof normalizeHistory>,
  mode: AiChatMode,
  userContext: string = ""
) {
  const modeInstruction = isInteractiveMode(mode)
    ? [
        `Active chat mode: ${mode}.`,
        "Run this as an in-chat activity. Do not redirect the learner to another page.",
        "For interactive modes: ask one task/question at a time and use the conversation history to continue.",
        "Keep tasks short enough for a mobile chat bubble."
      ].join("\n")
    : "Active chat mode: general coach."

  return [
    "You are Lexiflow's friendly AI study coach.",
    "Answer the learner directly in the same language they used.",
    "Do not translate their message unless they explicitly ask for a translation.",
    "If they ask about live/current information such as weather, be honest that you do not have live local data and give a useful general answer.",
    "Keep the answer concise and natural.",
    modeInstruction,
    userContext,
    "",
    formatHistory(history),
    "",
    `Learner message: ${rawMessage}`
  ].filter(Boolean).join("\n")
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

function buildAiStudyPrompt({
  rawMessage,
  message,
  history,
  mode,
  sourceLang,
  targetLang,
  translatedText,
  translationAlternatives,
  detectedLevel,
  dictionary
}: {
  rawMessage: string
  message: string
  history: ReturnType<typeof normalizeHistory>
  mode: AiChatMode
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
    isInteractiveMode(mode)
      ? "This is an in-chat activity. Ask one task/question at a time and use the conversation history to continue."
      : "This is a study answer.",
    "",
    formatHistory(history),
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

async function fetchAiText(prompt: string, maxTokens = 800) {
  const result = await generateLexiAiText({
    prompt,
    purpose: "ai-chat",
    temperature: 0.35,
    maxOutputTokens: maxTokens
  })

  return result?.text ?? null
}

// ============================================================
// WORD LIST GENERATION PIPELINE
// ============================================================

function extractTopicFromMessage(message: string): string | null {
  const normalized = message.trim()

  const patterns = [
    /словарь\s+(?:по\s+теме\s+|на тему\s+|по\s+)?["']?(.+?)["']?$/i,
    /слова\s+(?:по\s+теме\s+|на тему\s+|о\s+|об\s+)?["']?(.+?)["']?$/i,
    /words?\s+(?:on|about|for|related to)\s+["']?(.+?)["']?$/i,
    /vocabulary\s+(?:for|on|about)\s+["']?(.+?)["']?$/i,
    /topic\s*(?:dictionary|vocab|words)?\s*[:\/]\s*["']?(.+?)["']?$/i,
    /\/topic\s+["']?(.+?)["']?$/i,
  ]

  for (const pattern of patterns) {
    const match = normalized.match(pattern)
    if (match?.[1]) {
      return match[1].trim().slice(0, 80)
    }
  }

  return null
}

async function handleWordListMode(topic: string, cefrLevel?: string): Promise<NextResponse> {
  const prompt = buildWordListPrompt(topic, cefrLevel)
  const rawReply = await fetchAiText(prompt, 2500).catch(() => null)

  if (!rawReply) {
    return NextResponse.json({
      reply: "AI coach is temporarily unavailable. Please try again in a moment.",
      kind: "text",
      mode: "fallback"
    })
  }

  const parseResult = parseAIBlockFromText(rawReply)

  if (parseResult.ok) {
    return NextResponse.json({
      kind: "block",
      block: parseResult.block,
      reply: null,
      mode: "block"
    })
  }

  return NextResponse.json({
    reply: `Could not generate word list for "${topic}". Please try again.`,
    kind: "text",
    mode: "fallback"
  })
}

// ============================================================
// QUIZ GENERATION PIPELINE
// ============================================================

async function handleQuizMode(userId: string): Promise<NextResponse> {
  const prisma = getPrisma()

  // 1. Fetch user cards (prioritize unknown words)
  const cards = await prisma.card.findMany({
    where: { userId },
    orderBy: [
      { lastReviewResult: "desc" }, // "unknown" sorts before "known"
      { nextReviewDate: "asc" }
    ],
    take: 8,
    include: { catalogWord: true }
  })

  if (cards.length === 0) {
    return NextResponse.json({
      reply: "You don't have any saved words yet. Add some cards to your deck first so I can quiz you on them! 📚",
      kind: "text",
      mode: "fallback"
    })
  }

  // 2. Build deduplicated target words list
  const seen = new Set<string>()
  const targetWords: TargetWord[] = cards
    .map((c): TargetWord => {
      const res: TargetWord = {
        word: c.original || c.catalogWord?.word || "",
        translation: c.translation || c.catalogWord?.translation || "",
      }
      if (c.catalogWord?.cefrLevel) {
        res.level = c.catalogWord.cefrLevel as string
      }
      return res
    })
    .filter((c) => !!c.word && !!c.translation)
    .filter((c) => {
      const key = c.word.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }) 

  // 3. Build hidden prompt and call AI
  const quizPrompt = buildQuizPrompt(targetWords)
  const rawReply = await fetchAiText(quizPrompt, 3000).catch(() => null)

  if (!rawReply) {
    return NextResponse.json({
      reply: "AI coach is temporarily unavailable. Please try again in a moment.",
      kind: "text",
      mode: "fallback"
    })
  }

  // 4. Parse and validate
  const parseResult = parseAIBlockFromText(rawReply)

  if (parseResult.ok) {
    return NextResponse.json({
      kind: "block",
      block: parseResult.block,
      reply: null,
      mode: "block"
    })
  }

  // 5. Retry once with repair prompt
  if (process.env.NODE_ENV === "development") {
    console.warn("[Quiz Pipeline] First attempt failed:", parseResult.error)
    console.warn("[Quiz Pipeline] Raw AI reply:", rawReply.slice(0, 500))
  }

  const repairPrompt = buildQuizRepairPrompt(targetWords, parseResult.error)
  const repairReply = await fetchAiText(repairPrompt, 3000).catch(() => null)

  if (repairReply) {
    const repairResult = parseAIBlockFromText(repairReply)
    if (repairResult.ok) {
      return NextResponse.json({
        kind: "block",
        block: repairResult.block,
        reply: null,
        mode: "block"
      })
    }

    if (process.env.NODE_ENV === "development") {
      console.warn("[Quiz Pipeline] Repair attempt also failed:", repairResult.error)
    }
  }

  const finalError = repairReply ? parseAIBlockFromText(repairReply) : parseResult
  const errorMsg = !finalError.ok ? finalError.error : "Unknown validation error"

  return NextResponse.json({
    reply: `Quiz generation failed. Please try again. (${errorMsg})`,
    kind: "text",
    mode: "fallback"
  })
}

// ============================================================
// MAIN POST HANDLER
// ============================================================

export async function POST(request: NextRequest) {
  const user = await getOptionalAuthUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const rateLimit = await checkRateLimit(
    `ai-chat:${getThrottleKey(request, user.id)}`,
    1,
    1
  )

  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Slow down a little." }, { status: 429 })
  }

  const prisma = getPrisma()
  const body = (await request.json().catch(() => null)) as AiChatRequestBody | null
  let rawMessage = body?.message?.trim()

  if (!rawMessage) {
    return NextResponse.json({ error: "Missing message." }, { status: 400 })
  }

  let userContext = ""
  if (rawMessage.toLowerCase().includes("/unknowncard")) {
    rawMessage = rawMessage.replace(/\/unknowncards?/gi, "").trim()
    if (!rawMessage) {
      rawMessage = "Can you help me practice these unknown words?"
    }
    
    const unknownCards = await prisma.card.findMany({
      where: { 
        userId: user.id,
        lastReviewResult: "unknown"
      },
      take: 10,
      orderBy: { wrongCount: "desc" },
      include: { catalogWord: true }
    })

    if (unknownCards.length > 0) {
      const wordsList = unknownCards
        .map(c => ({
          word: c.original || c.catalogWord?.word,
          translation: c.translation || c.catalogWord?.translation
        }))
        .filter(c => c.word && c.translation)
        .map(c => `- ${c.word} (${c.translation})`)
        .join("\n")
      userContext = `\n\n[SYSTEM CONTEXT: The user requested to include their 'unknown/problematic' words in this conversation. Here are up to 10 of their unknown words:\n${wordsList}\nMake sure to use or refer to these words in your response if applicable.]`
    } else {
      userContext = `\n\n[SYSTEM CONTEXT: The user requested to include their unknown words, but they currently have no words marked as 'unknown'.]`
    }
  }

  const mode = isAiChatMode(body?.mode) ? body.mode : "chat"
  const history = normalizeHistory(body?.history)

  // ── Quiz mode: use dedicated pipeline ──────────────────────
  if (mode === "quiz") {
    return handleQuizMode(user.id)
  }

  // ── Word list / topic dictionary ────────────────────────────
  const detectedTopic = extractTopicFromMessage(rawMessage)
  if (detectedTopic) {
    return handleWordListMode(detectedTopic, user.cefrLevel)
  }

  // ── Other interactive modes (story, memory, roleplay, review) ──
  if (isInteractiveMode(mode) || !hasStudyIntent(rawMessage) || userContext !== "") {
    const aiReply = await fetchAiText(buildAiChatPrompt(rawMessage, history, mode, userContext)).catch(() => null)

    return NextResponse.json({
      reply: aiReply || "I can help with that, but the AI provider is not available right now. Try again in a moment.",
      kind: "text",
      mode: aiReply ? "study" : "fallback",
      source: null
    })
  }

  // ── Study / translation mode ────────────────────────────────
  const message = extractStudyQuery(rawMessage).slice(0, 400)

  if (!message) {
    return NextResponse.json({ error: "Missing message." }, { status: 400 })
  }

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
  const aiReply = await fetchAiText(
    buildAiStudyPrompt({
      rawMessage,
      message,
      history,
      mode,
      sourceLang,
      targetLang,
      translatedText,
      translationAlternatives: translationResult?.translationAlternatives ?? [],
      detectedLevel,
      dictionary
    })
  ).catch(() => null)

  if (!aiReply && !translatedText && !dictionary && !profile) {
    return NextResponse.json(
      {
        reply: "I could not build a study answer for that yet. Try a single word, a short phrase, or tap one of the prompt chips.",
        kind: "text",
        mode: "fallback"
      },
      { status: 200 }
    )
  }

  return NextResponse.json({
    reply: aiReply || fallbackReply,
    kind: "text",
    mode: translatedText ? "study" : "fallback",
    source: translationResult?.source ?? null
  })
}
