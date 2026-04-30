import { NextRequest, NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"

import { generateLexiAiText } from "@/lib/ai"
import { getOptionalAuthUser } from "@/lib/auth"
import { getPrisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/throttle"
import type { PracticeWritingChallengeResult, PracticeWritingTargetWord } from "@/lib/types"

function getThrottleKey(request: NextRequest, userId: string) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  return userId || forwardedFor || "user"
}

function buildPrompt(targetWords: PracticeWritingTargetWord[], userText: string) {
  return [
    "You are an English vocabulary coach inside LexiFlow.",
    "",
    "The user was asked to write a short text using these target words:",
    JSON.stringify(targetWords, null, 2),
    "",
    "Each target word has:",
    "- word",
    "- translation",
    "- CEFR level",
    "",
    "User text:",
    userText,
    "",
    "Your task:",
    "1. Check whether the user used each target word.",
    "2. Check whether each word was used naturally and correctly.",
    "3. Check grammar, spelling, and sentence structure.",
    "4. Give a score from 0 to 100.",
    "5. Explain mistakes simply in Russian.",
    "6. Say what you liked about the text.",
    "7. Provide an improved version of the user's text in natural English.",
    "8. Give one short next task.",
    "",
    "Scoring:",
    "- 40 points: target words are used",
    "- 25 points: words are used correctly",
    "- 20 points: grammar and sentence structure",
    "- 15 points: naturalness and meaning",
    "",
    "Return only valid JSON in this format:",
    "",
    "{",
    '  "score": 0,',
    '  "levelFeedback": "string",',
    '  "usedWords": [',
    "    {",
    '      "word": "string",',
    '      "used": true,',
    '      "correct": true,',
    '      "feedback": "string"',
    "    }",
    "  ],",
    '  "grammarMistakes": [',
    "    {",
    '      "original": "string",',
    '      "corrected": "string",',
    '      "explanationRu": "string"',
    "    }",
    "  ],",
    '  "whatWasGood": "string",',
    '  "improvedText": "string",',
    '  "nextTask": "string"',
    "}"
  ].join("\n")
}

function extractJsonText(text: string) {
  let cleanedText = text.trim()

  const jsonBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/)
  if (jsonBlockMatch) {
    cleanedText = jsonBlockMatch[1].trim()
  }

  if (!cleanedText.startsWith("{")) {
    const jsonStart = cleanedText.indexOf("{")
    const jsonEnd = cleanedText.lastIndexOf("}")
    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      cleanedText = cleanedText.slice(jsonStart, jsonEnd + 1)
    }
  }

  return cleanedText
}

async function fetchAiWritingReview(prompt: string) {
  const result = await generateLexiAiText({
    prompt,
    purpose: "writing-challenge",
    temperature: 0.2,
    maxOutputTokens: 1400,
    responseMimeType: "application/json"
  })

  if (!result?.text) {
    throw new Error("AI provider returned an empty writing review.")
  }

  const text = extractJsonText(result.text)

  console.log(
    "[writing-challenge] AI raw text length:",
    text.length,
    "provider:",
    result.provider,
    "model:",
    result.model,
    "starts with:",
    text.slice(0, 60)
  )

  return text
}

function normalizeResult(parsed: unknown, targetWords: PracticeWritingTargetWord[]): PracticeWritingChallengeResult {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("AI response is not a valid object.")
  }

  const value = parsed as Record<string, unknown>
  const score = typeof value.score === "number" ? Math.max(0, Math.min(100, Math.round(value.score))) : 0
  const levelFeedback = typeof value.levelFeedback === "string" ? value.levelFeedback.trim() : ""
  const whatWasGood = typeof value.whatWasGood === "string" ? value.whatWasGood.trim() : ""
  const improvedText = typeof value.improvedText === "string" ? value.improvedText.trim() : ""
  const nextTask = typeof value.nextTask === "string" ? value.nextTask.trim() : ""
  const usedWordsRaw = Array.isArray(value.usedWords) ? value.usedWords : []
  const grammarMistakesRaw = Array.isArray(value.grammarMistakes) ? value.grammarMistakes : []

  const usedWords = targetWords.map((targetWord) => {
    const match = usedWordsRaw.find((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return false
      }

      return (item as Record<string, unknown>).word === targetWord.word
    }) as Record<string, unknown> | undefined

    return {
      word: targetWord.word,
      used: typeof match?.used === "boolean" ? match.used : false,
      correct: typeof match?.correct === "boolean" ? match.correct : false,
      feedback: typeof match?.feedback === "string" ? match.feedback.trim() : ""
    }
  })

  const grammarMistakes = grammarMistakesRaw
    .filter((item) => item && typeof item === "object" && !Array.isArray(item))
    .map((item) => {
      const value = item as Record<string, unknown>

      return {
        original: typeof value.original === "string" ? value.original.trim() : "",
        corrected: typeof value.corrected === "string" ? value.corrected.trim() : "",
        explanationRu: typeof value.explanationRu === "string" ? value.explanationRu.trim() : ""
      }
    })
    .filter((item) => item.original || item.corrected || item.explanationRu)

  // Be lenient: only require score and levelFeedback; fill in defaults for the rest
  if (!levelFeedback) {
    throw new Error("AI response is missing levelFeedback.")
  }

  return {
    score,
    levelFeedback,
    usedWords,
    grammarMistakes,
    whatWasGood: whatWasGood || "Хорошая попытка! Продолжай практиковаться.",
    improvedText: improvedText || "",
    nextTask: nextTask || "Попробуй написать ещё один текст с этими словами."
  }
}

function buildFallbackResult(
  targetWords: PracticeWritingTargetWord[],
  userText: string
): PracticeWritingChallengeResult {
  const normalizedText = userText.toLowerCase()
  const usedWords = targetWords.map((targetWord) => {
    const used = normalizedText.includes(targetWord.word.toLowerCase())

    return {
      word: targetWord.word,
      used,
      correct: used,
      feedback: used
        ? "Слово использовано в тексте. AI-проверка была недоступна, поэтому это базовая локальная оценка."
        : "Это слово не найдено в тексте. Попробуй добавить его в следующую версию."
    }
  })
  const usedCount = usedWords.filter((item) => item.used).length
  const coverageScore = Math.round((usedCount / Math.max(targetWords.length, 1)) * 40)
  const lengthBonus = userText.trim().split(/\s+/).filter(Boolean).length >= 8 ? 20 : 10
  const grammarScore = 20
  const naturalnessScore = usedCount === targetWords.length ? 15 : 8
  const score = Math.max(0, Math.min(100, coverageScore + lengthBonus + grammarScore + naturalnessScore))

  return {
    score,
    levelFeedback:
      "AI-проверка сейчас недоступна, поэтому LexiFlow показал базовую локальную оценку по использованию целевых слов.",
    usedWords,
    grammarMistakes: [],
    whatWasGood:
      usedCount > 0
        ? "Ты уже встроил часть целевых слов в связный текст, и это хороший шаг к активному использованию словаря."
        : "Ты попытался написать собственный текст, и это уже полезная практика для закрепления слов.",
    improvedText: userText,
    nextTask:
      usedCount === targetWords.length
        ? "Напиши ещё 2 предложения и добавь одно связующее слово, например however или because."
        : "Перепиши текст и постарайся использовать все целевые слова хотя бы по одному разу."
  }
}

export async function POST(request: NextRequest) {
  const user = await getOptionalAuthUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const rateLimit = await checkRateLimit(
    `practice-writing:${getThrottleKey(request, user.id)}`,
    1,
    2
  )

  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Slow down a little." }, { status: 429 })
  }

  const body = (await request.json().catch(() => null)) as
    | {
        cardIds?: string[]
        userText?: string
      }
    | null

  const cardIds = Array.isArray(body?.cardIds)
    ? Array.from(new Set(body.cardIds.filter((value): value is string => typeof value === "string" && value.length > 0)))
    : []
  const userText = typeof body?.userText === "string" ? body.userText.trim() : ""

  if (!cardIds.length || !userText) {
    return NextResponse.json({ error: "Missing writing challenge fields." }, { status: 400 })
  }

  const prisma = getPrisma()
  const cards = await prisma.card.findMany({
    where: {
      userId: user.id,
      id: {
        in: cardIds
      }
    },
    select: {
      id: true,
      original: true,
      translation: true,
      catalogWord: {
        select: {
          word: true,
          translation: true,
          cefrLevel: true
        }
      }
    }
  })

  if (!cards.length) {
    return NextResponse.json({ error: "Target words were not found." }, { status: 404 })
  }

  const targetWords = cards.map((card) => ({
    word: card.catalogWord?.word ?? card.original ?? "",
    translation: card.catalogWord?.translation ?? card.translation ?? "",
    cefrLevel: card.catalogWord?.cefrLevel ?? null
  }))

  const rawResponse = await fetchAiWritingReview(buildPrompt(targetWords, userText)).catch((error) => {
    console.error("Writing challenge AI request failed.", error)
    return null
  })

  let result: PracticeWritingChallengeResult

  if (!rawResponse) {
    result = buildFallbackResult(targetWords, userText)
  } else {
    try {
      result = normalizeResult(JSON.parse(rawResponse), targetWords)
    } catch (error) {
      console.error("Could not parse AI writing challenge JSON.", error, rawResponse)
      result = buildFallbackResult(targetWords, userText)
    }
  }

  const saved = await prisma.practiceWritingChallenge.create({
    data: {
      userId: user.id,
      cardIds,
      targetWords: targetWords as Prisma.InputJsonValue,
      userText,
      score: result.score,
      levelFeedback: result.levelFeedback,
      usedWords: result.usedWords as unknown as Prisma.InputJsonValue,
      grammarMistakes: result.grammarMistakes as unknown as Prisma.InputJsonValue,
      whatWasGood: result.whatWasGood,
      improvedText: result.improvedText,
      nextTask: result.nextTask
    },
    select: {
      id: true
    }
  })

  return NextResponse.json({
    result: {
      ...result,
      id: saved.id
    }
  })
}
